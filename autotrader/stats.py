"""
stats.py — Market statistics calculator for AutoTrader Intelligence AI.

Iteration 4: new module.

rebuild_market_statistics() groups all persisted vehicles by (brand, model),
computes aggregate price/mileage figures, derives a liquidity score, and
upserts the results into the market_statistics table.

The liquidity score formula combines:
  - sample_factor  (saturates at 50 listings for a brand/model)
  - mileage_factor (lower average mileage → easier to sell)

Both are averaged to produce a 0.0–1.0 score.
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# The liquidity sample factor saturates at this number of listings.
# A brand/model with ≥ SAMPLE_SATURATION examples gets the maximum sample_factor.
SAMPLE_SATURATION: int = 50

# Mileage bands for the mileage_factor component of liquidity.
_MILEAGE_LIQUIDITY_BANDS: tuple = (
    (30_000,  1.00),
    (60_000,  0.80),
    (100_000, 0.60),
    (150_000, 0.40),
    (float("inf"), 0.20),
)


def _mileage_factor(avg_mileage: float) -> float:
    """Return a mileage-based liquidity factor in [0.20, 1.00]."""
    for upper, factor in _MILEAGE_LIQUIDITY_BANDS:
        if avg_mileage <= upper:
            return factor
    return 0.20


def rebuild_market_statistics(db) -> int:
    """
    Recalculate market statistics from all vehicle records in the database.

    For each (brand, model) pair:
      - Computes average price (from rows with price > 0)
      - Computes average mileage (from rows with mileage ≥ 0)
      - Records sample count
      - Derives a liquidity score [0.0, 1.0]

    Results are upserted — existing rows are updated in place.

    Returns:
        The number of brand/model pairs updated.
    """
    vehicles = db.fetch_all_vehicles()
    if not vehicles:
        logger.info("rebuild_market_statistics: no vehicles found; nothing to do.")
        return 0

    # Group by normalised (brand, model).
    groups: dict = {}
    for v in vehicles:
        brand = (v.get("brand") or "").strip().lower()
        model = (v.get("model") or "").strip().lower()
        if not brand or not model:
            continue
        groups.setdefault((brand, model), []).append(v)

    now     = datetime.utcnow().isoformat()
    updated = 0

    for (brand, model), group in groups.items():
        # Only include numerically valid values in the aggregates.
        prices = [
            v["price"] for v in group
            if v.get("price") is not None and isinstance(v["price"], (int, float))
            and v["price"] > 0
        ]
        mileages = [
            v["mileage"] for v in group
            if v.get("mileage") is not None and isinstance(v["mileage"], (int, float))
            and v["mileage"] >= 0
        ]

        avg_price   = round(sum(prices)   / len(prices),   2) if prices   else 0.0
        avg_mileage = round(sum(mileages) / len(mileages), 2) if mileages else 0.0
        sample_count = len(group)

        # Liquidity = average of sample saturation factor + mileage factor.
        sample_f  = min(sample_count / SAMPLE_SATURATION, 1.0)
        mileage_f = _mileage_factor(avg_mileage)
        liquidity = round((sample_f + mileage_f) / 2.0, 4)

        try:
            db.upsert_market_statistics({
                "brand":          brand,
                "model":          model,
                "avg_price":      avg_price,
                "avg_mileage":    avg_mileage,
                "sample_count":   sample_count,
                "liquidity_score": liquidity,
                "updated_at":     now,
            })
            updated += 1
        except Exception as exc:
            logger.error(
                "Failed to upsert stats for '%s %s': %s", brand, model, exc,
                exc_info=True,
            )

    logger.info(
        "rebuild_market_statistics: %d brand/model pair(s) updated.", updated
    )
    return updated
