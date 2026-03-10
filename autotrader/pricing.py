"""
pricing.py — Market valuation engine for AutoTrader Intelligence AI.

Iteration 4 hardening:
  - Explicit valuation_mode in every return payload:
      'exact_match'     — comparables found for this exact brand + model
      'brand_match'     — only brand-level comparables available
      'fallback_markup' — no comparables; listed price × fixed markup
  - In-process price cache (dict) with manual invalidation via seed_cache()
  - Case-insensitive brand/model matching throughout
  - Zero-division protection in all price and mileage calculations
  - Mileage adjustment clamped to [0.50, 1.50] so extreme values cannot
    produce negative or nonsensical estimates
  - fallback_markup is logged as a WARNING so operators can see when the
    engine is working without real comparable data
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Percentage markup applied on top of the listed price in fallback mode.
# 1.15 = the engine assumes the car is worth 15 % more than asking price,
# which is a conservative starting point when no market data is available.
DEFAULT_FALLBACK_MARKUP: float = 1.15

# Adjustment applied per 10 000-unit deviation from the baseline mileage.
# 0.02 = 2 % price change per 10 k miles.
MILEAGE_ADJUSTMENT_PER_10K: float = 0.02

# Mileage considered "average" — no adjustment is applied at this point.
BASELINE_MILEAGE: float = 50_000.0

# ---------------------------------------------------------------------------
# Module-level price cache
# Maps (brand_lower, model_lower) -> {"avg_price": float, "sample_count": int,
#                                     "updated_at": str}
# ---------------------------------------------------------------------------
_price_cache: dict = {}


def _cache_key(brand: str, model: str) -> tuple:
    return (brand.strip().lower(), model.strip().lower())


def seed_cache(comparables: list, brand: str, model: str) -> None:
    """
    Populate (or refresh) the price cache for a brand/model pair.

    *comparables* must be a list of dicts each containing at least a
    'price' key.  Rows with missing or non-positive prices are ignored.

    This is called automatically by estimate_market_value() when live
    comparables are supplied, but can also be called explicitly (e.g. from
    the stats rebuild command) to pre-warm the cache.
    """
    prices = [
        c["price"] for c in comparables
        if c.get("price") and isinstance(c["price"], (int, float)) and c["price"] > 0
    ]
    if not prices:
        return

    avg = sum(prices) / len(prices)
    key = _cache_key(brand, model)
    _price_cache[key] = {
        "avg_price":    round(avg, 2),
        "sample_count": len(prices),
        "updated_at":   datetime.utcnow().isoformat(),
    }
    logger.debug(
        "Price cache seeded for '%s %s': avg=%.2f from %d samples.",
        brand, model, avg, len(prices),
    )


def clear_cache() -> None:
    """Remove all entries from the in-process price cache."""
    _price_cache.clear()
    logger.debug("Price cache cleared.")


# ---------------------------------------------------------------------------
# Mileage adjustment
# ---------------------------------------------------------------------------

def calculate_mileage_adjustment(mileage: float) -> float:
    """
    Return a multiplier that reflects how mileage affects market value.

    - Vehicles below BASELINE_MILEAGE receive a multiplier > 1.0 (worth more).
    - Vehicles above BASELINE_MILEAGE receive a multiplier < 1.0 (worth less).
    - The result is clamped to [0.50, 1.50] to prevent extreme distortions.
    - Invalid mileage (None, negative) falls back to 1.0 with a warning.
    """
    if mileage is None or not isinstance(mileage, (int, float)) or mileage < 0:
        logger.warning(
            "Invalid mileage value %r passed to mileage adjustment; using 1.0.",
            mileage,
        )
        return 1.0

    # How many 10 k units above/below baseline?
    delta_10k = (mileage - BASELINE_MILEAGE) / 10_000.0
    adjustment = 1.0 - (delta_10k * MILEAGE_ADJUSTMENT_PER_10K)

    # Clamp to a sensible range.
    clamped = max(0.50, min(1.50, adjustment))
    return round(clamped, 4)


# ---------------------------------------------------------------------------
# Market value estimation
# ---------------------------------------------------------------------------

def estimate_market_value(
    brand: str,
    model: str,
    mileage: float,
    comparables: list = None,
) -> dict:
    """
    Estimate the market value for a vehicle.

    Resolution order:
      1. exact_match  — cache hit for this brand+model
      2. exact_match  — live comparables matching brand+model exactly
      3. brand_match  — live comparables from the same brand (any model)
      4. fallback_markup — no data; caller applies markup to listed price

    Returns a dict with these guaranteed keys::

        estimated_value      float | None   (None only in fallback mode)
        valuation_mode       str            'exact_match' | 'brand_match'
                                            | 'fallback_markup'
        comparables_used     int
        avg_comparable_price float | None
        mileage_adjustment   float
        basis_description    str            human-readable explanation
    """
    brand_l = brand.strip().lower()
    model_l = model.strip().lower()
    key     = _cache_key(brand_l, model_l)
    mileage_adj = calculate_mileage_adjustment(mileage)

    # ------------------------------------------------------------------
    # 1. Cache hit — exact_match
    # ------------------------------------------------------------------
    if key in _price_cache:
        cached    = _price_cache[key]
        base      = cached["avg_price"]
        estimated = round(base * mileage_adj, 2)
        return {
            "estimated_value":      estimated,
            "valuation_mode":       "exact_match",
            "comparables_used":     cached["sample_count"],
            "avg_comparable_price": round(base, 2),
            "mileage_adjustment":   mileage_adj,
            "basis_description": (
                f"Cache hit: {brand_l} {model_l} — "
                f"{cached['sample_count']} sample(s), avg £{base:,.2f}"
            ),
        }

    # ------------------------------------------------------------------
    # 2. Live comparables — exact_match
    # ------------------------------------------------------------------
    if comparables:
        exact_prices = [
            c["price"] for c in comparables
            if c.get("price") and c["price"] > 0
            and c.get("brand", "").strip().lower() == brand_l
            and c.get("model", "").strip().lower() == model_l
        ]
        if exact_prices:
            avg       = sum(exact_prices) / len(exact_prices)
            estimated = round(avg * mileage_adj, 2)
            # Warm the cache for next time.
            seed_cache([{"price": p} for p in exact_prices], brand_l, model_l)
            return {
                "estimated_value":      estimated,
                "valuation_mode":       "exact_match",
                "comparables_used":     len(exact_prices),
                "avg_comparable_price": round(avg, 2),
                "mileage_adjustment":   mileage_adj,
                "basis_description": (
                    f"Exact match: {brand_l} {model_l} — "
                    f"{len(exact_prices)} comparable(s), avg £{avg:,.2f}"
                ),
            }

        # ------------------------------------------------------------------
        # 3. Live comparables — brand_match
        # ------------------------------------------------------------------
        brand_prices = [
            c["price"] for c in comparables
            if c.get("price") and c["price"] > 0
            and c.get("brand", "").strip().lower() == brand_l
        ]
        if brand_prices:
            avg       = sum(brand_prices) / len(brand_prices)
            estimated = round(avg * mileage_adj, 2)
            logger.info(
                "Pricing: brand_match used for '%s %s' (no model-level data).",
                brand_l, model_l,
            )
            return {
                "estimated_value":      estimated,
                "valuation_mode":       "brand_match",
                "comparables_used":     len(brand_prices),
                "avg_comparable_price": round(avg, 2),
                "mileage_adjustment":   mileage_adj,
                "basis_description": (
                    f"Brand-level match: {brand_l} (model '{model_l}' not found) — "
                    f"{len(brand_prices)} comparable(s), avg £{avg:,.2f}"
                ),
            }

    # ------------------------------------------------------------------
    # 4. Fallback markup — no comparable data available
    # ------------------------------------------------------------------
    logger.warning(
        "Pricing: fallback_markup mode for '%s %s' — no comparables available.",
        brand_l, model_l,
    )
    return {
        # estimated_value is None here; the caller (analysis.py) applies
        # apply_fallback_markup() to the listed price.
        "estimated_value":      None,
        "valuation_mode":       "fallback_markup",
        "comparables_used":     0,
        "avg_comparable_price": None,
        "mileage_adjustment":   mileage_adj,
        "basis_description": (
            f"No comparables for '{brand_l} {model_l}'; "
            f"fallback markup ({DEFAULT_FALLBACK_MARKUP:.0%}) will be applied."
        ),
    }


def apply_fallback_markup(listed_price: float, mileage_adj: float) -> float:
    """
    Compute an estimated value when no comparables are available.

    Applies DEFAULT_FALLBACK_MARKUP and the mileage adjustment to the
    listed price.  Returns 0.0 if the listed price is invalid.
    """
    if not listed_price or listed_price <= 0:
        return 0.0
    return round(listed_price * DEFAULT_FALLBACK_MARKUP * mileage_adj, 2)
