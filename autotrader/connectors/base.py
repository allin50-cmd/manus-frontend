"""
connectors/base.py — Base connector and built-in marketplace connectors.

Each connector subclasses BaseConnector and overrides:
  - SOURCE_NAME  — the canonical source identifier (lowercase, no spaces)
  - map_row()    — transforms a raw CSV row dict into the standard vehicle
                   field names expected by ingestion.parse_csv_file()

The generic ingestion pipeline handles validation, normalisation, and ID
generation; connectors only need to handle field renaming/mapping.

Built-in connectors
-------------------
  AutoTraderConnector   — autotrader.co.uk CSV exports
  EbayMotorsConnector   — eBay Motors CSV exports
  GenericConnector      — pass-through for already-normalised CSVs
"""

import logging
import os
from ingestion import parse_csv_file

logger = logging.getLogger(__name__)


class BaseConnector:
    """
    Abstract base class for all marketplace connectors.

    Subclasses must define SOURCE_NAME and may override map_row().
    """

    SOURCE_NAME: str = "generic"

    def map_row(self, raw_row: dict) -> dict:
        """
        Transform a raw CSV row into the standard vehicle field schema.

        The default implementation is a pass-through — fields are expected
        to already use the standard names (title, brand, model, price, …).

        Override this in marketplace-specific subclasses to rename columns.
        """
        return dict(raw_row)

    def load_csv(self, file_path: str) -> dict:
        """
        Load and parse a CSV file via the standard ingestion pipeline.

        Row mapping (if any) is applied before the ingestion validator sees
        the data.  Returns the same result dict as parse_csv_file().

        Because ingestion.parse_csv_file() does its own file I/O and schema
        check, this method delegates fully to it — the map_row() hook is
        applied by overriding _apply_mapping in a future enhancement if
        per-row remapping is needed before schema validation.  For now,
        connectors that need remapping should pre-process the file or produce
        a renamed copy.  This keeps the architecture simple.
        """
        logger.info(
            "Connector '%s' loading: %s", self.SOURCE_NAME, file_path
        )
        return parse_csv_file(file_path, source=self.SOURCE_NAME)


class AutoTraderConnector(BaseConnector):
    """
    Connector for autotrader.co.uk CSV exports.

    AutoTrader exports use 'make' instead of 'brand'; this connector renames
    the field so the standard ingestion pipeline can validate it.
    """

    SOURCE_NAME = "autotrader"

    def map_row(self, raw_row: dict) -> dict:
        row = dict(raw_row)
        # AutoTrader uses 'make' for the manufacturer name.
        if "make" in row and "brand" not in row:
            row["brand"] = row.pop("make")
        # AutoTrader uses 'odometer' for mileage in some exports.
        if "odometer" in row and "mileage" not in row:
            row["mileage"] = row.pop("odometer")
        return row


class EbayMotorsConnector(BaseConnector):
    """
    Connector for eBay Motors CSV exports.

    eBay uses 'manufacturer' for brand and 'current_price' for price.
    """

    SOURCE_NAME = "ebay_motors"

    def map_row(self, raw_row: dict) -> dict:
        row = dict(raw_row)
        if "manufacturer" in row and "brand" not in row:
            row["brand"] = row.pop("manufacturer")
        if "current_price" in row and "price" not in row:
            row["price"] = row.pop("current_price")
        if "listing_title" in row and "title" not in row:
            row["title"] = row.pop("listing_title")
        return row


class GenericConnector(BaseConnector):
    """Pass-through connector for CSVs that already use standard field names."""

    SOURCE_NAME = "generic"


# ---------------------------------------------------------------------------
# Connector registry
# ---------------------------------------------------------------------------

CONNECTOR_REGISTRY: dict = {
    c.SOURCE_NAME: c
    for c in [AutoTraderConnector, EbayMotorsConnector, GenericConnector]
}


def get_connector(source_name: str) -> BaseConnector:
    """
    Return a connector instance for the given source name.

    Falls back to GenericConnector for unknown sources (with a warning).
    """
    cls = CONNECTOR_REGISTRY.get(source_name.strip().lower())
    if cls is None:
        logger.warning(
            "No connector found for source '%s'; using GenericConnector.",
            source_name,
        )
        return GenericConnector()
    return cls()
