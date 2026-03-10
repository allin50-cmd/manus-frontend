"""
reporting.py — Human-readable reporting for AutoTrader Intelligence AI.

Iteration 4: new module.

Provides print_summary(), which writes to stdout:
  - Total vehicles stored
  - Total analyses stored
  - Total alerts stored
  - Top 10 highest-scored vehicles (with key fields)
  - Most liquid brand/model combinations from market_statistics
"""

import logging

logger = logging.getLogger(__name__)

# Column widths for the top-deals table
_TITLE_W    = 40
_PRICE_W    = 10
_MILEAGE_W  = 12
_SCORE_W    = 7
_REC_W      = 7

# Column widths for the liquidity table
_BRAND_W    = 18
_MODEL_W    = 18
_AVG_P_W    = 10
_AVG_M_W    = 12
_LIQ_W      = 9


def _fmt_currency(value) -> str:
    try:
        return f"£{float(value):,.0f}"
    except (TypeError, ValueError):
        return "n/a"


def _fmt_mileage(value) -> str:
    try:
        return f"{float(value):,.0f} mi"
    except (TypeError, ValueError):
        return "n/a"


def print_summary(db) -> None:
    """
    Print a full summary report to stdout.

    Args:
        db: A Database instance (must have init_schema() already called).
    """
    # ------------------------------------------------------------------ counts
    total_vehicles = db.count_vehicles()
    total_analyses = db.count_analyses()
    total_alerts   = db.count_alerts()

    print()
    print("=" * 60)
    print("  AutoTrader Intelligence AI — Summary Report")
    print("=" * 60)
    print(f"  Vehicles stored  : {total_vehicles:,}")
    print(f"  Analyses stored  : {total_analyses:,}")
    print(f"  Alerts stored    : {total_alerts:,}")
    print()

    # --------------------------------------------------------- top 10 deals
    top_deals = db.fetch_top_deals(limit=10)
    print("--- Top 10 Highest Scored Vehicles ---")
    if not top_deals:
        print("  (no analyses recorded yet)")
    else:
        header = (
            f"  {'#':<3} "
            f"{'Title':<{_TITLE_W}} "
            f"{'Price':>{_PRICE_W}} "
            f"{'Mileage':>{_MILEAGE_W}} "
            f"{'Score':>{_SCORE_W}} "
            f"{'Rec':<{_REC_W}}"
        )
        sep = "  " + "-" * (len(header) - 2)
        print(header)
        print(sep)
        for rank, deal in enumerate(top_deals, start=1):
            title   = str(deal.get("title") or "")[:_TITLE_W]
            price   = _fmt_currency(deal.get("price"))
            mileage = _fmt_mileage(deal.get("mileage"))
            score   = deal.get("deal_score") or 0.0
            rec     = str(deal.get("recommendation") or "")[:_REC_W]
            print(
                f"  {rank:<3} "
                f"{title:<{_TITLE_W}} "
                f"{price:>{_PRICE_W}} "
                f"{mileage:>{_MILEAGE_W}} "
                f"{score:>{_SCORE_W}.2f} "
                f"{rec:<{_REC_W}}"
            )
    print()

    # ------------------------------------------------- most liquid brands
    stats = db.fetch_market_statistics()
    print("--- Most Liquid Brand/Model Combinations ---")
    if not stats:
        print("  (no statistics yet — run: python main.py rebuild-stats)")
    else:
        header2 = (
            f"  {'Brand':<{_BRAND_W}} "
            f"{'Model':<{_MODEL_W}} "
            f"{'Avg Price':>{_AVG_P_W}} "
            f"{'Avg Mileage':>{_AVG_M_W}} "
            f"{'Liquidity':>{_LIQ_W}}"
        )
        sep2 = "  " + "-" * (len(header2) - 2)
        print(header2)
        print(sep2)
        for stat in stats[:10]:
            brand   = str(stat.get("brand") or "")[:_BRAND_W]
            model   = str(stat.get("model") or "")[:_MODEL_W]
            avg_p   = _fmt_currency(stat.get("avg_price"))
            avg_m   = _fmt_mileage(stat.get("avg_mileage"))
            liq     = stat.get("liquidity_score") or 0.0
            print(
                f"  {brand:<{_BRAND_W}} "
                f"{model:<{_MODEL_W}} "
                f"{avg_p:>{_AVG_P_W}} "
                f"{avg_m:>{_AVG_M_W}} "
                f"{liq:>{_LIQ_W}.4f}"
            )
    print()
    print("=" * 60)
    print()
