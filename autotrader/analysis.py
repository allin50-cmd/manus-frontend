"""
analysis.py — Vehicle analysis engine for AutoTrader Intelligence AI.

Iteration 4 hardening:
  - Every analysis produces a deterministic explanation payload that captures:
      • matched_damage_keywords  — keywords found in the title, by risk tier
      • damage_risk_score        — computed 0.0–1.0
      • valuation_mode           — 'exact_match' | 'brand_match' | 'fallback_markup'
      • comparable_pricing_basis — human-readable description of the data used
      • comparables_used         — number of comparable vehicles consulted
      • avg_comparable_price     — mean price of those comparables (or None)
      • estimated_value          — final market value estimate
      • mileage_adjustment_factor
      • liquidity_score          — 0.0–1.0 based on mileage band
      • deal_score_inputs        — all four inputs to the deal-score formula
      • deal_score               — final 0.0–10.0 score
      • recommendation           — BUY | REVIEW | PASS
      • recommendation_reason    — plain-English explanation
  - Explanation is serialised as JSON and stored in analysis.explanation_json
  - All sub-functions are pure; no global mutable state here
"""

import json
import logging
from datetime import datetime

from pricing import (
    estimate_market_value,
    apply_fallback_markup,
    seed_cache,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Damage keyword dictionaries  (lower-case for fast substring matching)
# ---------------------------------------------------------------------------

_HIGH_RISK_KEYWORDS: frozenset = frozenset({
    "salvage", "flood", "fire", "burned", "written off", "write-off",
    "total loss", "totaled", "structural", "frame damage", "rebuilt title",
    "cat a", "cat b", "cat c", "cat d", "cat s", "cat n",
})

_MEDIUM_RISK_KEYWORDS: frozenset = frozenset({
    "accident", "collision", "damaged", "repaired", "dent", "scratch",
    "hail", "panel", "bumper", "fender", "rear end", "front end",
})

_LOW_RISK_KEYWORDS: frozenset = frozenset({
    "scuff", "mark", "minor", "small", "light", "surface", "paint chip",
})

# Score contribution per matched keyword, capped at 1.0 overall.
_HIGH_WEIGHT:   float = 0.50
_MEDIUM_WEIGHT: float = 0.20
_LOW_WEIGHT:    float = 0.05

# ---------------------------------------------------------------------------
# Liquidity bands  [(mileage_upper_bound, score), ...]
# ---------------------------------------------------------------------------
_LIQUIDITY_BANDS: tuple = (
    (30_000,  1.00),
    (60_000,  0.80),
    (100_000, 0.60),
    (150_000, 0.40),
    (float("inf"), 0.20),
)


# ---------------------------------------------------------------------------
# Pure analysis helpers
# ---------------------------------------------------------------------------

def extract_damage_keywords(text: str) -> dict:
    """
    Scan *text* for damage-related keywords and return matched sets by tier.

    Returns::

        {
            "high":   [str, ...],
            "medium": [str, ...],
            "low":    [str, ...],
        }
    """
    text_l = text.lower()
    return {
        "high":   [kw for kw in _HIGH_RISK_KEYWORDS   if kw in text_l],
        "medium": [kw for kw in _MEDIUM_RISK_KEYWORDS if kw in text_l],
        "low":    [kw for kw in _LOW_RISK_KEYWORDS    if kw in text_l],
    }


def compute_damage_risk(matched: dict) -> float:
    """
    Convert matched keyword sets into a damage risk score in [0.0, 1.0].

    Multiple keywords in the same tier accumulate; the total is capped at 1.0.
    """
    risk = (
        len(matched.get("high",   [])) * _HIGH_WEIGHT
        + len(matched.get("medium", [])) * _MEDIUM_WEIGHT
        + len(matched.get("low",    [])) * _LOW_WEIGHT
    )
    return round(min(risk, 1.0), 4)


def compute_liquidity_score(mileage: float) -> float:
    """
    Return a liquidity score in [0.0, 1.0] based on mileage.

    Higher score means lower mileage → easier to sell at close to market value.
    Falls back to 0.2 (minimum) for any invalid mileage.
    """
    if mileage is None or mileage < 0:
        return 0.20
    for upper, score in _LIQUIDITY_BANDS:
        if mileage <= upper:
            return score
    return 0.20


def compute_deal_score(
    listed_price: float,
    estimated_value: float,
    damage_risk: float,
    liquidity_score: float,
) -> float:
    """
    Compute a deal quality score in [0.0, 10.0].

    Formula:
        base_score  = (estimated_value / listed_price) × 5.0   (capped at 10)
        deal_score  = base_score × (1 − damage_risk) × liquidity_score

    Interpretation:
        ≥ 7.0 → strong buy opportunity
        5.0–6.9 → worth reviewing
        < 5.0 → pass

    Returns 0.0 when either price value is zero/invalid to prevent division
    errors.
    """
    if (
        not listed_price or listed_price <= 0
        or not estimated_value or estimated_value <= 0
    ):
        return 0.0

    discount_ratio = estimated_value / listed_price
    base_score     = min(discount_ratio * 5.0, 10.0)
    adjusted       = base_score * (1.0 - damage_risk) * liquidity_score
    return round(min(adjusted, 10.0), 4)


def make_recommendation(deal_score: float, damage_risk: float) -> tuple:
    """
    Return (recommendation: str, reason: str) based on score and risk.

    Thresholds:
        damage_risk ≥ 0.5     → PASS  (too risky regardless of score)
        deal_score  ≥ 7.0     → BUY
        deal_score  ≥ 5.0     → REVIEW
        otherwise             → PASS
    """
    if damage_risk >= 0.5:
        return (
            "PASS",
            f"High damage risk ({damage_risk:.2f} ≥ 0.50) — not recommended.",
        )
    if deal_score >= 7.0:
        return (
            "BUY",
            (
                f"Strong deal: score {deal_score:.2f} ≥ 7.0 "
                f"with acceptable risk ({damage_risk:.2f})."
            ),
        )
    if deal_score >= 5.0:
        return (
            "REVIEW",
            (
                f"Moderate deal: score {deal_score:.2f} in [5, 7) — "
                "manual review advised."
            ),
        )
    return (
        "PASS",
        f"Weak deal: score {deal_score:.2f} < 5.0 — does not meet threshold.",
    )


# ---------------------------------------------------------------------------
# Primary analysis function
# ---------------------------------------------------------------------------

def analyze_vehicle(vehicle: dict, comparables: list = None) -> dict:
    """
    Perform a full analysis on one vehicle and return an analysis record.

    The returned dict matches the schema expected by Database.insert_analysis()
    and also carries an in-memory 'explanation' key (dict) for immediate use
    by the alert generator without re-parsing the JSON.

    Args:
        vehicle:     A vehicle dict as produced by ingestion.parse_csv_file().
        comparables: Optional list of comparable vehicle dicts from
                     Database.fetch_market_comparables().

    Returns::

        {
            "vehicle_id":       str,
            "damage_risk":      float,
            "deal_score":       float,
            "recommendation":   str,
            "explanation_json": str,   # JSON-serialised full explanation
            "analyzed_at":      str,   # ISO-8601 UTC timestamp
            "explanation":      dict,  # in-memory copy (not persisted directly)
        }
    """
    vid         = vehicle["id"]
    title       = vehicle.get("title", "")
    brand       = vehicle.get("brand", "")
    model       = vehicle.get("model", "")
    mileage     = vehicle.get("mileage") or 0.0
    listed_price = vehicle.get("price") or 0.0
    analyzed_at = datetime.utcnow().isoformat()

    # Pre-warm the price cache from the supplied comparables (if any).
    if comparables:
        seed_cache(comparables, brand, model)

    # ---- Step 1: Damage keyword extraction ----
    matched_kw  = extract_damage_keywords(title)
    damage_risk = compute_damage_risk(matched_kw)

    # ---- Step 2: Market value estimation ----
    pricing = estimate_market_value(brand, model, mileage, comparables)
    valuation_mode   = pricing["valuation_mode"]
    estimated_value  = pricing["estimated_value"]
    mileage_adj      = pricing["mileage_adjustment"]

    # In fallback mode estimated_value comes back as None; compute it now.
    if valuation_mode == "fallback_markup":
        estimated_value = apply_fallback_markup(listed_price, mileage_adj)
        pricing["estimated_value"] = estimated_value

    # ---- Step 3: Liquidity scoring ----
    liquidity_score = compute_liquidity_score(mileage)

    # ---- Step 4: Deal scoring ----
    deal_score = compute_deal_score(
        listed_price, estimated_value, damage_risk, liquidity_score
    )

    # ---- Step 5: Recommendation ----
    recommendation, reason = make_recommendation(deal_score, damage_risk)

    # ---- Build explanation payload ----
    explanation = {
        # Identity
        "vehicle_id":   vid,
        "title":        title,
        "brand":        brand,
        "model":        model,
        # Damage analysis
        "matched_damage_keywords":  matched_kw,
        "damage_risk_score":        damage_risk,
        # Pricing
        "listed_price":             listed_price,
        "valuation_mode":           valuation_mode,
        "comparable_pricing_basis": pricing.get("basis_description", ""),
        "comparables_used":         pricing.get("comparables_used", 0),
        "avg_comparable_price":     pricing.get("avg_comparable_price"),
        "estimated_value":          estimated_value,
        # Mileage
        "mileage":                  mileage,
        "mileage_adjustment_factor": mileage_adj,
        # Liquidity
        "liquidity_score":          liquidity_score,
        # Deal score breakdown
        "deal_score_inputs": {
            "listed_price":    listed_price,
            "estimated_value": estimated_value,
            "damage_risk":     damage_risk,
            "liquidity_score": liquidity_score,
        },
        "deal_score":           deal_score,
        # Recommendation
        "recommendation":        recommendation,
        "recommendation_reason": reason,
        # Timestamp
        "analyzed_at":           analyzed_at,
    }

    logger.debug(
        "Vehicle %s analysed: score=%.2f risk=%.2f rec=%s mode=%s",
        vid, deal_score, damage_risk, recommendation, valuation_mode,
    )

    return {
        "vehicle_id":       vid,
        "damage_risk":      damage_risk,
        "deal_score":       deal_score,
        "recommendation":   recommendation,
        "explanation_json": json.dumps(explanation, default=str),
        "analyzed_at":      analyzed_at,
        # Retained in memory for the scanner's alert generator so it can
        # inspect individual fields without deserialising JSON again.
        "explanation":      explanation,
    }
