"""
ingestion.py — CSV ingestion with validation, normalization, and safe parsing.

Iteration 4 hardening:
  - CSV schema validator checks required columns before processing any rows
  - Explicit per-row validation: missing/blank required fields are logged and
    the row is skipped; the rest of the file continues normally
  - Required fields: title, brand, model, price, mileage, year
  - Numeric fields (price, mileage, year) are parsed defensively with
    context-rich warning logs on failure
  - All string fields are whitespace-stripped
  - brand, model, fuel are normalized to lowercase
  - Images are split on semicolons and rejoined after stripping each URL
  - A stable, deterministic SHA-256 ID is generated for rows with no 'id'
  - Returns a structured result dict so callers (scanner) can aggregate stats
"""

import csv
import hashlib
import logging
import os
import re
from datetime import datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Field definitions
# ---------------------------------------------------------------------------

# Every row must supply a non-empty value for each of these.
REQUIRED_FIELDS: frozenset = frozenset(
    {"title", "brand", "model", "price", "mileage", "year"}
)

# Optional fields and the default value used when absent from the CSV.
OPTIONAL_FIELD_DEFAULTS: dict = {
    "id":           None,
    "fuel":         "",
    "transmission": "",
    "color":        "",
    "location":     "",
    "images":       "",
    "url":          "",
    "source":       "",
}

# Maximum plausible model year (current year + 1 for next-year releases).
_MAX_YEAR = datetime.now().year + 1


# ---------------------------------------------------------------------------
# Schema validation
# ---------------------------------------------------------------------------

def validate_csv_schema(fieldnames: list) -> tuple:
    """
    Check that *fieldnames* (the CSV header row) includes every required field.

    Comparison is case-insensitive and whitespace-tolerant.

    Returns:
        (is_valid: bool, missing: set)  — missing is empty when is_valid is True.
    """
    normalised = {f.strip().lower() for f in (fieldnames or [])}
    missing = REQUIRED_FIELDS - normalised
    return len(missing) == 0, missing


# ---------------------------------------------------------------------------
# Safe numeric parsers
# ---------------------------------------------------------------------------

def _safe_float(raw: str, field: str, row_num: int, filepath: str) -> float | None:
    """
    Parse *raw* as a float, stripping currency symbols and commas.

    Returns None and emits a WARNING when parsing fails so the caller can
    decide whether to skip the row.
    """
    try:
        cleaned = re.sub(r"[^\d.\-]", "", str(raw).strip())
        return float(cleaned) if cleaned else None
    except (ValueError, TypeError):
        logger.warning(
            "%s row %d: cannot parse float for '%s' — raw value: %r",
            filepath, row_num, field, raw,
        )
        return None


def _safe_int(raw: str, field: str, row_num: int, filepath: str) -> int | None:
    """
    Parse *raw* as an integer, stripping non-digit characters.

    Returns None on failure (logged as a WARNING).
    """
    try:
        cleaned = re.sub(r"[^\d\-]", "", str(raw).strip())
        return int(cleaned) if cleaned else None
    except (ValueError, TypeError):
        logger.warning(
            "%s row %d: cannot parse int for '%s' — raw value: %r",
            filepath, row_num, field, raw,
        )
        return None


# ---------------------------------------------------------------------------
# Stable ID generation
# ---------------------------------------------------------------------------

def _generate_stable_id(row: dict, source: str) -> str:
    """
    Produce a deterministic 16-character hex ID from vehicle key fields.

    The hash input is: source | title | brand | model | year | price | url
    This ensures the same physical listing always receives the same ID across
    re-imports, preventing duplicate insertion.
    """
    parts = "|".join([
        str(source or ""),
        str(row.get("title", "")),
        str(row.get("brand", "")),
        str(row.get("model", "")),
        str(row.get("year", "")),
        str(row.get("price", "")),
        str(row.get("url", "")),
    ])
    return hashlib.sha256(parts.encode("utf-8")).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Image normalisation
# ---------------------------------------------------------------------------

def _normalise_images(raw: str) -> str:
    """
    Split a semicolon-delimited image string, strip each URL, and rejoin.

    Empty segments are dropped.
    """
    if not raw:
        return ""
    parts = [img.strip() for img in raw.split(";") if img.strip()]
    return ";".join(parts)


# ---------------------------------------------------------------------------
# Main parser
# ---------------------------------------------------------------------------

def parse_csv_file(file_path: str, source: str = None) -> dict:
    """
    Parse one CSV file and return validated, normalised vehicle dicts.

    A single malformed row never aborts the whole file — the row is skipped
    and the reason is logged.

    Args:
        file_path: Absolute or relative path to the CSV file.
        source:    Human-readable source label (defaults to the filename).

    Returns a dict::

        {
            "rows":            list[dict],   # validated vehicle records
            "total_read":      int,           # rows read (excluding header)
            "skipped_invalid": int,           # rows dropped due to errors
            "source_file":     str,           # the file_path argument
        }
    """
    if source is None:
        source = os.path.basename(file_path)

    result: dict = {
        "rows":            [],
        "total_read":      0,
        "skipped_invalid": 0,
        "source_file":     file_path,
    }

    try:
        # utf-8-sig handles files exported from Excel that carry a BOM.
        with open(file_path, newline="", encoding="utf-8-sig") as fh:
            reader = csv.DictReader(fh)

            # ---- Schema check before touching any data rows ----
            if not reader.fieldnames:
                logger.error(
                    "%s: file appears empty or has no header row — skipped.",
                    file_path,
                )
                return result

            ok, missing = validate_csv_schema(reader.fieldnames)
            if not ok:
                logger.error(
                    "%s: missing required columns %s — entire file skipped.",
                    file_path, sorted(missing),
                )
                return result

            # ---- Row-level processing ----
            for row_num, raw_row in enumerate(reader, start=2):
                result["total_read"] += 1

                # Normalise all keys to lowercase + strip all string values.
                row: dict = {
                    k.strip().lower(): (v.strip() if v else "")
                    for k, v in raw_row.items()
                }

                # --- Required-field presence check ---
                skip_reason: str | None = None
                for field in REQUIRED_FIELDS:
                    if not row.get(field):
                        skip_reason = f"missing required field '{field}'"
                        break

                if skip_reason:
                    logger.warning(
                        "%s row %d skipped: %s  |  row snapshot: %s",
                        file_path, row_num, skip_reason,
                        {f: row.get(f, "") for f in REQUIRED_FIELDS},
                    )
                    result["skipped_invalid"] += 1
                    continue

                # --- Numeric parsing ---
                price   = _safe_float(row["price"],   "price",   row_num, file_path)
                mileage = _safe_float(row["mileage"], "mileage", row_num, file_path)
                year    = _safe_int(  row["year"],    "year",    row_num, file_path)

                # --- Numeric value validation ---
                if price is None or price <= 0:
                    logger.warning(
                        "%s row %d skipped: invalid price %r",
                        file_path, row_num, row["price"],
                    )
                    result["skipped_invalid"] += 1
                    continue

                if mileage is None or mileage < 0:
                    logger.warning(
                        "%s row %d skipped: invalid mileage %r",
                        file_path, row_num, row["mileage"],
                    )
                    result["skipped_invalid"] += 1
                    continue

                if year is None or year < 1900 or year > _MAX_YEAR:
                    logger.warning(
                        "%s row %d skipped: invalid year %r",
                        file_path, row_num, row["year"],
                    )
                    result["skipped_invalid"] += 1
                    continue

                # --- Build the normalised vehicle dict ---
                vehicle: dict = {
                    # Use provided ID if present; otherwise generate a stable hash.
                    "id":           row.get("id") or _generate_stable_id(row, source),
                    "title":        row["title"],
                    # Normalise categorical text fields to lowercase.
                    "brand":        row["brand"].lower(),
                    "model":        row["model"].lower(),
                    "fuel":         row.get("fuel", "").lower(),
                    "transmission": row.get("transmission", ""),
                    "color":        row.get("color", ""),
                    "location":     row.get("location", ""),
                    # Numeric fields already validated above.
                    "year":         year,
                    "price":        price,
                    "mileage":      mileage,
                    # Images split and rejoined after stripping.
                    "images":       _normalise_images(row.get("images", "")),
                    "url":          row.get("url", ""),
                    "source":       source,
                    # raw_json can be populated by callers that want to store
                    # the entire original row; not used by the scanner.
                    "raw_json":     None,
                    "inserted_at":  datetime.utcnow().isoformat(),
                }

                result["rows"].append(vehicle)

    except FileNotFoundError:
        logger.error("CSV file not found: %s", file_path)
    except csv.Error as exc:
        logger.error("CSV parsing error in %s: %s", file_path, exc)
    except OSError as exc:
        logger.error("OS error while reading %s: %s", file_path, exc)

    return result
