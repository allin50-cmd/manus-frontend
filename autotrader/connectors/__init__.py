"""
connectors — Marketplace-specific CSV connector registry.

Each connector knows how to locate CSV exports from a particular source
(e.g. AutoTrader, eBay Motors, Facebook Marketplace) and can apply
source-specific field mappings before the generic ingestion pipeline runs.

Usage::

    from connectors import get_connector
    connector = get_connector("autotrader")
    rows = connector.load_csv("path/to/export.csv")

Connectors are registered by name in the CONNECTOR_REGISTRY dict in base.py.
"""

from connectors.base import BaseConnector, get_connector, CONNECTOR_REGISTRY

__all__ = ["BaseConnector", "get_connector", "CONNECTOR_REGISTRY"]
