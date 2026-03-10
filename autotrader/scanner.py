"""
scanner.py — Threaded CSV scanner loop for AutoTrader Intelligence AI.

Iteration 4 hardening:
  - All bare except clauses replaced with explicit exception types
  - Scan-cycle errors are logged with full tracebacks but never abort the loop
  - Each scan cycle ends with a structured summary log covering:
      files_checked, rows_read, new_vehicles_inserted, duplicates_skipped,
      invalid_rows_skipped, analyses_performed, alerts_generated,
      scan_duration_seconds
  - Alert thresholds are module-level constants for easy tuning
  - ScannerThread is a proper daemon thread with a stop event for clean shutdown
"""

import logging
import os
import threading
import time
from datetime import datetime

from database import Database
from ingestion import parse_csv_file
from analysis import analyze_vehicle

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Alert thresholds
# ---------------------------------------------------------------------------

# Minimum deal_score that triggers a "high_deal_score" alert.
ALERT_DEAL_SCORE_THRESHOLD: float = 7.0

# Minimum damage_risk that triggers a "high_damage_risk" alert.
ALERT_DAMAGE_RISK_THRESHOLD: float = 0.5


# ---------------------------------------------------------------------------
# File discovery
# ---------------------------------------------------------------------------

def _find_csv_files(data_dir: str) -> list:
    """
    Return a sorted list of .csv file paths inside *data_dir*.

    Returns an empty list (with a warning) when the directory does not exist.
    """
    if not os.path.isdir(data_dir):
        logger.warning("Data directory not found: %s", data_dir)
        return []
    files = sorted(
        os.path.join(data_dir, f)
        for f in os.listdir(data_dir)
        if f.lower().endswith(".csv")
    )
    return files


# ---------------------------------------------------------------------------
# Alert generation
# ---------------------------------------------------------------------------

def _generate_alerts(analysis_result: dict, db: Database) -> int:
    """
    Inspect one analysis result and insert relevant alerts into the database.

    Returns the number of alerts inserted.
    """
    alerts_inserted = 0
    vid  = analysis_result["vehicle_id"]
    now  = datetime.utcnow().isoformat()
    expl = analysis_result.get("explanation", {})

    # High deal score alert
    if analysis_result["deal_score"] >= ALERT_DEAL_SCORE_THRESHOLD:
        try:
            db.insert_alert({
                "vehicle_id": vid,
                "alert_type": "high_deal_score",
                "message": (
                    f"Deal score {analysis_result['deal_score']:.2f} exceeds "
                    f"threshold {ALERT_DEAL_SCORE_THRESHOLD:.1f}. "
                    f"Recommendation: {analysis_result['recommendation']}."
                ),
                "created_at": now,
            })
            alerts_inserted += 1
        except Exception as exc:
            logger.error(
                "Failed to insert high_deal_score alert for vehicle %s: %s",
                vid, exc, exc_info=True,
            )

    # High damage risk alert
    if analysis_result["damage_risk"] >= ALERT_DAMAGE_RISK_THRESHOLD:
        matched = expl.get("matched_damage_keywords", {})
        try:
            db.insert_alert({
                "vehicle_id": vid,
                "alert_type": "high_damage_risk",
                "message": (
                    f"Damage risk {analysis_result['damage_risk']:.2f} exceeds "
                    f"threshold {ALERT_DAMAGE_RISK_THRESHOLD:.1f}. "
                    f"Keywords: {matched}."
                ),
                "created_at": now,
            })
            alerts_inserted += 1
        except Exception as exc:
            logger.error(
                "Failed to insert high_damage_risk alert for vehicle %s: %s",
                vid, exc, exc_info=True,
            )

    return alerts_inserted


# ---------------------------------------------------------------------------
# Single scan cycle
# ---------------------------------------------------------------------------

def run_scan_cycle(data_dir: str, db: Database) -> dict:
    """
    Execute one complete scan cycle over all CSVs found in *data_dir*.

    Each CSV is parsed, each valid row is inserted (or recognised as a
    duplicate), new vehicles are analysed, and alerts are generated.

    Returns a summary dict suitable for logging and the CLI show-stats command::

        {
            "files_checked":          int,
            "rows_read":              int,
            "new_vehicles_inserted":  int,
            "duplicates_skipped":     int,
            "invalid_rows_skipped":   int,
            "analyses_performed":     int,
            "alerts_generated":       int,
            "scan_duration_seconds":  float,
        }
    """
    start = time.monotonic()
    summary: dict = {
        "files_checked":         0,
        "rows_read":             0,
        "new_vehicles_inserted": 0,
        "duplicates_skipped":    0,
        "invalid_rows_skipped":  0,
        "analyses_performed":    0,
        "alerts_generated":      0,
        "scan_duration_seconds": 0.0,
    }

    csv_files = _find_csv_files(data_dir)
    summary["files_checked"] = len(csv_files)

    if not csv_files:
        logger.info("Scan cycle: no CSV files found in '%s'.", data_dir)
        summary["scan_duration_seconds"] = round(time.monotonic() - start, 3)
        return summary

    for csv_path in csv_files:
        logger.info("Scanning file: %s", csv_path)

        # ---- Parse ----
        try:
            parse_result = parse_csv_file(csv_path)
        except Exception as exc:
            logger.error(
                "Unexpected error while parsing '%s': %s",
                csv_path, exc, exc_info=True,
            )
            continue

        summary["rows_read"]          += parse_result["total_read"]
        summary["invalid_rows_skipped"] += parse_result["skipped_invalid"]

        # ---- Per-vehicle processing ----
        for vehicle in parse_result["rows"]:
            # -- Insert --
            try:
                inserted = db.insert_or_ignore_vehicle(vehicle)
            except Exception as exc:
                logger.error(
                    "DB insert error for vehicle id=%s: %s",
                    vehicle.get("id"), exc, exc_info=True,
                )
                continue

            if not inserted:
                summary["duplicates_skipped"] += 1
                continue

            summary["new_vehicles_inserted"] += 1

            # -- Fetch comparables for pricing context --
            try:
                comparables = db.fetch_market_comparables(
                    vehicle["brand"], vehicle["model"]
                )
            except Exception as exc:
                logger.error(
                    "DB comparable fetch error for vehicle id=%s: %s",
                    vehicle.get("id"), exc, exc_info=True,
                )
                comparables = []

            # -- Analyse --
            try:
                analysis = analyze_vehicle(vehicle, comparables)
                db.insert_analysis(analysis)
                summary["analyses_performed"] += 1
            except Exception as exc:
                logger.error(
                    "Analysis error for vehicle id=%s: %s",
                    vehicle.get("id"), exc, exc_info=True,
                )
                continue

            # -- Generate alerts --
            try:
                n_alerts = _generate_alerts(analysis, db)
                summary["alerts_generated"] += n_alerts
            except Exception as exc:
                logger.error(
                    "Alert generation error for vehicle id=%s: %s",
                    vehicle.get("id"), exc, exc_info=True,
                )

    summary["scan_duration_seconds"] = round(time.monotonic() - start, 3)
    _log_scan_summary(summary)
    return summary


def _log_scan_summary(s: dict) -> None:
    """Emit a nicely formatted scan-cycle summary at INFO level."""
    logger.info(
        "\n"
        "========== SCAN CYCLE COMPLETE ==========\n"
        "  Files checked         : %d\n"
        "  Rows read             : %d\n"
        "  New vehicles inserted : %d\n"
        "  Duplicates skipped    : %d\n"
        "  Invalid rows skipped  : %d\n"
        "  Analyses performed    : %d\n"
        "  Alerts generated      : %d\n"
        "  Duration              : %.3f s\n"
        "=========================================",
        s["files_checked"],
        s["rows_read"],
        s["new_vehicles_inserted"],
        s["duplicates_skipped"],
        s["invalid_rows_skipped"],
        s["analyses_performed"],
        s["alerts_generated"],
        s["scan_duration_seconds"],
    )


# ---------------------------------------------------------------------------
# Background scanner thread
# ---------------------------------------------------------------------------

class ScannerThread(threading.Thread):
    """
    Daemon thread that runs scan cycles on a fixed interval.

    Usage::

        t = ScannerThread(data_dir="autotrader/data", db=db, interval_seconds=300)
        t.start()
        # … later …
        t.stop()
        t.join(timeout=10)
    """

    def __init__(
        self,
        data_dir: str,
        db: Database,
        interval_seconds: int = 300,
    ) -> None:
        super().__init__(daemon=True, name="ScannerThread")
        self.data_dir         = data_dir
        self.db               = db
        self.interval_seconds = interval_seconds
        self._stop_event      = threading.Event()

    def run(self) -> None:
        logger.info(
            "ScannerThread started (interval=%ds, data_dir='%s').",
            self.interval_seconds, self.data_dir,
        )
        while not self._stop_event.is_set():
            try:
                run_scan_cycle(self.data_dir, self.db)
            except Exception as exc:
                # Catch anything that slipped through run_scan_cycle's own
                # handlers so the thread never crashes silently.
                logger.error(
                    "Unhandled error in ScannerThread: %s", exc, exc_info=True
                )
            # Wait for the next interval, but honour stop requests promptly.
            self._stop_event.wait(timeout=self.interval_seconds)
        logger.info("ScannerThread stopped.")

    def stop(self) -> None:
        """Signal the thread to stop after the current cycle completes."""
        self._stop_event.set()
