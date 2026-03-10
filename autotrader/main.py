"""
main.py — Entry point for AutoTrader Intelligence AI.

Iteration 4: Hardened Production Version

Usage:
    python main.py                          # start continuous background scanner
    python main.py scan-once                # run exactly one scan cycle and exit
    python main.py record-flip              # interactively record a vehicle flip
    python main.py rebuild-stats            # recalculate market statistics from DB
    python main.py show-stats               # print DB summary counts and top deals

All commands respect the DATA_DIR and DB_PATH environment variables, falling
back to the defaults below.  Set SCAN_INTERVAL_SECONDS to change the polling
interval for the continuous scanner.

No external dependencies — standard library only.
"""

import logging
import os
import signal
import sys
import time
from datetime import datetime

# ---------------------------------------------------------------------------
# Logging configuration — set up before importing project modules so that
# any module-level code (e.g. cache initialisation) is already covered.
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("main")

# ---------------------------------------------------------------------------
# Project imports (after logging is ready)
# ---------------------------------------------------------------------------

from database import Database
from scanner  import ScannerThread, run_scan_cycle
from reporting import print_summary
from stats    import rebuild_market_statistics

# ---------------------------------------------------------------------------
# Configuration (environment variables with defaults)
# ---------------------------------------------------------------------------

# Directory where CSV files are placed by the user.
DATA_DIR: str = os.environ.get(
    "AUTOTRADER_DATA_DIR",
    os.path.join(os.path.dirname(__file__), "data"),
)

# SQLite database file path.
DB_PATH: str = os.environ.get(
    "AUTOTRADER_DB_PATH",
    os.path.join(os.path.dirname(__file__), "autotrader.db"),
)

# Seconds between scan cycles when running in continuous mode.
SCAN_INTERVAL: int = int(os.environ.get("SCAN_INTERVAL_SECONDS", "300"))


# ---------------------------------------------------------------------------
# Helper: shared DB setup
# ---------------------------------------------------------------------------

def _open_db() -> Database:
    """Open the database and ensure the schema is present."""
    db = Database(DB_PATH)
    db.init_schema()
    return db


# ---------------------------------------------------------------------------
# CLI command implementations
# ---------------------------------------------------------------------------

def cmd_scan_once() -> None:
    """
    Run exactly one scan cycle over all CSVs in DATA_DIR and then exit.

    Useful for cron jobs or one-shot imports.
    """
    logger.info("Command: scan-once  (data_dir=%s)", DATA_DIR)
    db = _open_db()
    try:
        summary = run_scan_cycle(DATA_DIR, db)
        print("\nscan-once complete:")
        for key, value in summary.items():
            print(f"  {key:<28}: {value}")
    finally:
        db.close()


def cmd_record_flip() -> None:
    """
    Interactively record a completed vehicle flip.

    Prompts the user for vehicle_id, buy price, sell price, and optional notes.
    Calculates profit automatically.
    """
    print("\n--- Record Vehicle Flip ---")
    db = _open_db()
    try:
        vehicle_id = input("Vehicle ID (from the database): ").strip()
        if not vehicle_id:
            print("Error: vehicle_id is required.")
            return

        buy_str  = input("Buy price (£): ").strip()
        sell_str = input("Sell price (£): ").strip()
        notes    = input("Notes (optional): ").strip()

        try:
            buy_price  = float(buy_str)
            sell_price = float(sell_str)
        except ValueError:
            print("Error: buy price and sell price must be numeric values.")
            return

        profit = round(sell_price - buy_price, 2)

        flip_id = db.insert_flip({
            "vehicle_id":  vehicle_id,
            "buy_price":   buy_price,
            "sell_price":  sell_price,
            "profit":      profit,
            "notes":       notes or None,
            "recorded_at": datetime.utcnow().isoformat(),
        })

        print(f"\nFlip recorded (id={flip_id}):")
        print(f"  Vehicle : {vehicle_id}")
        print(f"  Buy     : £{buy_price:,.2f}")
        print(f"  Sell    : £{sell_price:,.2f}")
        print(f"  Profit  : £{profit:,.2f}")
    finally:
        db.close()


def cmd_rebuild_stats() -> None:
    """
    Recalculate market statistics from all vehicle records in the database.

    Upserts results into the market_statistics table.
    """
    logger.info("Command: rebuild-stats")
    db = _open_db()
    try:
        n = rebuild_market_statistics(db)
        print(f"\nrebuild-stats: {n} brand/model pair(s) updated.")
    finally:
        db.close()


def cmd_show_stats() -> None:
    """
    Print a summary of counts and top-deal vehicles from the database.
    """
    db = _open_db()
    try:
        print_summary(db)
    finally:
        db.close()


def cmd_start_scanner() -> None:
    """
    Start the continuous background scanner.

    Runs ScannerThread on SCAN_INTERVAL-second intervals.
    Handles SIGINT / SIGTERM for a clean shutdown.
    """
    logger.info(
        "Starting continuous scanner (interval=%ds, data_dir=%s, db=%s).",
        SCAN_INTERVAL, DATA_DIR, DB_PATH,
    )

    db = _open_db()
    scanner = ScannerThread(DATA_DIR, db, interval_seconds=SCAN_INTERVAL)

    # Allow Ctrl-C / kill to shut down cleanly.
    shutdown_requested = {"flag": False}

    def _handle_signal(signum, frame):
        if not shutdown_requested["flag"]:
            logger.info("Shutdown signal received; stopping scanner …")
            shutdown_requested["flag"] = True
            scanner.stop()

    signal.signal(signal.SIGINT,  _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    scanner.start()
    logger.info("Scanner running. Press Ctrl-C to stop.")

    # Keep the main thread alive so daemon thread can do its work.
    try:
        while scanner.is_alive():
            time.sleep(1)
    except KeyboardInterrupt:
        _handle_signal(None, None)

    scanner.join(timeout=30)
    db.close()
    logger.info("AutoTrader Intelligence AI stopped.")


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

_COMMANDS: dict = {
    "scan-once":     cmd_scan_once,
    "record-flip":   cmd_record_flip,
    "rebuild-stats": cmd_rebuild_stats,
    "show-stats":    cmd_show_stats,
}

_USAGE = """\
AutoTrader Intelligence AI — Iteration 4

Usage:
  python main.py                  Start continuous background scanner
  python main.py scan-once        Run one scan cycle and exit
  python main.py record-flip      Interactively record a vehicle flip
  python main.py rebuild-stats    Recalculate market statistics from DB
  python main.py show-stats       Print summary counts and top deals

Environment variables:
  AUTOTRADER_DATA_DIR        Directory containing CSV files  (default: ./data)
  AUTOTRADER_DB_PATH         SQLite database file path       (default: ./autotrader.db)
  SCAN_INTERVAL_SECONDS      Seconds between scan cycles     (default: 300)
"""


def main() -> None:
    args = sys.argv[1:]

    if not args:
        # No sub-command → start continuous scanner.
        cmd_start_scanner()
        return

    command = args[0].lower()

    if command in ("--help", "-h", "help"):
        print(_USAGE)
        return

    handler = _COMMANDS.get(command)
    if handler is None:
        print(f"Unknown command: '{command}'\n")
        print(_USAGE)
        sys.exit(1)

    handler()


if __name__ == "__main__":
    main()
