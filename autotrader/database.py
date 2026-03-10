"""
database.py — Thread-safe SQLite database layer for AutoTrader Intelligence AI.

Iteration 4 hardening:
  - Per-thread connection pool via threading.local()
  - Write lock (threading.Lock) around all INSERT/UPDATE/DELETE
  - WAL journal mode for concurrent read safety
  - Idempotent schema initialization (CREATE TABLE IF NOT EXISTS)
  - Helper methods: insert_or_ignore_vehicle, insert_analysis,
    insert_alert, insert_flip, fetch_market_comparables
"""

import json
import logging
import sqlite3
import threading
from datetime import datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Schema SQL — all CREATE statements use IF NOT EXISTS for idempotency.
# ---------------------------------------------------------------------------
_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS vehicles (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    brand           TEXT NOT NULL,
    model           TEXT NOT NULL,
    year            INTEGER,
    price           REAL,
    mileage         REAL,
    fuel            TEXT,
    transmission    TEXT,
    color           TEXT,
    location        TEXT,
    images          TEXT,
    url             TEXT,
    source          TEXT,
    raw_json        TEXT,
    inserted_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analysis (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id      TEXT NOT NULL,
    damage_risk     REAL,
    deal_score      REAL,
    recommendation  TEXT,
    explanation_json TEXT,
    analyzed_at     TEXT NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_analysis_vehicle_id
    ON analysis(vehicle_id);

CREATE TABLE IF NOT EXISTS alerts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id      TEXT NOT NULL,
    alert_type      TEXT NOT NULL,
    message         TEXT,
    created_at      TEXT NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS flips (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id      TEXT NOT NULL,
    buy_price       REAL,
    sell_price      REAL,
    profit          REAL,
    notes           TEXT,
    recorded_at     TEXT NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS market_statistics (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    brand           TEXT NOT NULL,
    model           TEXT NOT NULL,
    avg_price       REAL,
    avg_mileage     REAL,
    sample_count    INTEGER,
    liquidity_score REAL,
    updated_at      TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_market_stats_brand_model
    ON market_statistics(brand, model);
"""


class Database:
    """
    Thread-safe SQLite wrapper using per-thread connections and a write lock.

    Each thread gets its own sqlite3.Connection via threading.local so that
    reads can proceed concurrently.  All write operations are serialised
    through a single threading.Lock to prevent partial-write races.

    WAL journal mode is enabled on each connection for better concurrency.
    """

    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        self._write_lock = threading.Lock()
        self._local = threading.local()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_conn(self) -> sqlite3.Connection:
        """Return the per-thread SQLite connection, creating it if needed."""
        if not getattr(self._local, "conn", None):
            conn = sqlite3.connect(
                self.db_path,
                detect_types=sqlite3.PARSE_DECLTYPES,
                check_same_thread=False,
            )
            conn.row_factory = sqlite3.Row
            # WAL mode allows concurrent readers alongside a single writer.
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")
            # Reasonable busy timeout so writers don't immediately error out.
            conn.execute("PRAGMA busy_timeout=5000")
            self._local.conn = conn
        return self._local.conn

    # ------------------------------------------------------------------
    # Schema
    # ------------------------------------------------------------------

    def init_schema(self) -> None:
        """
        Initialize all tables and indexes.  Safe to call multiple times;
        every statement uses IF NOT EXISTS.
        """
        with self._write_lock:
            conn = self._get_conn()
            conn.executescript(_SCHEMA_SQL)
            conn.commit()
        logger.info("Database schema initialised at %s (idempotent).", self.db_path)

    # ------------------------------------------------------------------
    # Vehicle helpers
    # ------------------------------------------------------------------

    def insert_or_ignore_vehicle(self, vehicle: dict) -> bool:
        """
        Insert a vehicle row only if its ID is not already present.

        Returns True when a new row was inserted, False when the vehicle
        already existed (duplicate skipped).
        """
        sql = """
            INSERT OR IGNORE INTO vehicles
                (id, title, brand, model, year, price, mileage, fuel,
                 transmission, color, location, images, url, source,
                 raw_json, inserted_at)
            VALUES
                (:id, :title, :brand, :model, :year, :price, :mileage, :fuel,
                 :transmission, :color, :location, :images, :url, :source,
                 :raw_json, :inserted_at)
        """
        with self._write_lock:
            conn = self._get_conn()
            cur = conn.execute(sql, vehicle)
            conn.commit()
            return cur.rowcount > 0

    def fetch_all_vehicles(self) -> list:
        """Return all vehicle rows as a list of dicts."""
        conn = self._get_conn()
        cur = conn.execute("SELECT * FROM vehicles ORDER BY inserted_at DESC")
        return [dict(row) for row in cur.fetchall()]

    def fetch_market_comparables(self, brand: str, model: str) -> list:
        """
        Fetch recent comparable vehicles for a given brand and model.

        Matching is case-insensitive.  Returns up to 100 rows with price,
        mileage, year, brand, and model — everything the pricing engine needs.
        """
        sql = """
            SELECT price, mileage, year, brand, model
            FROM   vehicles
            WHERE  LOWER(brand) = LOWER(:brand)
              AND  LOWER(model) = LOWER(:model)
              AND  price  IS NOT NULL
              AND  price  > 0
              AND  mileage IS NOT NULL
              AND  mileage >= 0
            ORDER  BY inserted_at DESC
            LIMIT  100
        """
        conn = self._get_conn()
        cur = conn.execute(sql, {"brand": brand, "model": model})
        return [dict(row) for row in cur.fetchall()]

    def count_vehicles(self) -> int:
        return self._get_conn().execute("SELECT COUNT(*) FROM vehicles").fetchone()[0]

    # ------------------------------------------------------------------
    # Analysis helpers
    # ------------------------------------------------------------------

    def insert_analysis(self, analysis: dict) -> int:
        """
        Persist an analysis record.  Returns the new row id.

        Expected keys: vehicle_id, damage_risk, deal_score, recommendation,
                       explanation_json, analyzed_at.
        """
        sql = """
            INSERT INTO analysis
                (vehicle_id, damage_risk, deal_score, recommendation,
                 explanation_json, analyzed_at)
            VALUES
                (:vehicle_id, :damage_risk, :deal_score, :recommendation,
                 :explanation_json, :analyzed_at)
        """
        with self._write_lock:
            conn = self._get_conn()
            cur = conn.execute(sql, analysis)
            conn.commit()
            return cur.lastrowid

    def fetch_all_analyses(self) -> list:
        conn = self._get_conn()
        cur = conn.execute("SELECT * FROM analysis ORDER BY analyzed_at DESC")
        return [dict(row) for row in cur.fetchall()]

    def fetch_top_deals(self, limit: int = 10) -> list:
        """Return top N vehicles by deal_score, joined with vehicle info."""
        sql = """
            SELECT v.id, v.title, v.brand, v.model, v.year,
                   v.price, v.mileage, v.url,
                   a.deal_score, a.recommendation, a.damage_risk
            FROM   vehicles v
            JOIN   analysis  a ON a.vehicle_id = v.id
            ORDER  BY a.deal_score DESC
            LIMIT  :limit
        """
        conn = self._get_conn()
        cur = conn.execute(sql, {"limit": limit})
        return [dict(row) for row in cur.fetchall()]

    def count_analyses(self) -> int:
        return self._get_conn().execute("SELECT COUNT(*) FROM analysis").fetchone()[0]

    # ------------------------------------------------------------------
    # Alert helpers
    # ------------------------------------------------------------------

    def insert_alert(self, alert: dict) -> int:
        """
        Persist an alert record.  Returns the new row id.

        Expected keys: vehicle_id, alert_type, message, created_at.
        """
        sql = """
            INSERT INTO alerts (vehicle_id, alert_type, message, created_at)
            VALUES (:vehicle_id, :alert_type, :message, :created_at)
        """
        with self._write_lock:
            conn = self._get_conn()
            cur = conn.execute(sql, alert)
            conn.commit()
            return cur.lastrowid

    def fetch_all_alerts(self) -> list:
        conn = self._get_conn()
        cur = conn.execute("SELECT * FROM alerts ORDER BY created_at DESC")
        return [dict(row) for row in cur.fetchall()]

    def count_alerts(self) -> int:
        return self._get_conn().execute("SELECT COUNT(*) FROM alerts").fetchone()[0]

    # ------------------------------------------------------------------
    # Flip helpers
    # ------------------------------------------------------------------

    def insert_flip(self, flip: dict) -> int:
        """
        Persist a flip record.  Returns the new row id.

        Expected keys: vehicle_id, buy_price, sell_price, profit,
                       notes, recorded_at.
        """
        sql = """
            INSERT INTO flips
                (vehicle_id, buy_price, sell_price, profit, notes, recorded_at)
            VALUES
                (:vehicle_id, :buy_price, :sell_price, :profit,
                 :notes, :recorded_at)
        """
        with self._write_lock:
            conn = self._get_conn()
            cur = conn.execute(sql, flip)
            conn.commit()
            return cur.lastrowid

    def fetch_all_flips(self) -> list:
        conn = self._get_conn()
        cur = conn.execute("SELECT * FROM flips ORDER BY recorded_at DESC")
        return [dict(row) for row in cur.fetchall()]

    def count_flips(self) -> int:
        return self._get_conn().execute("SELECT COUNT(*) FROM flips").fetchone()[0]

    # ------------------------------------------------------------------
    # Market statistics helpers
    # ------------------------------------------------------------------

    def upsert_market_statistics(self, stats: dict) -> None:
        """
        Insert or replace market statistics for a brand/model pair.

        Expected keys: brand, model, avg_price, avg_mileage, sample_count,
                       liquidity_score, updated_at.
        """
        sql = """
            INSERT INTO market_statistics
                (brand, model, avg_price, avg_mileage, sample_count,
                 liquidity_score, updated_at)
            VALUES
                (:brand, :model, :avg_price, :avg_mileage, :sample_count,
                 :liquidity_score, :updated_at)
            ON CONFLICT(brand, model) DO UPDATE SET
                avg_price       = excluded.avg_price,
                avg_mileage     = excluded.avg_mileage,
                sample_count    = excluded.sample_count,
                liquidity_score = excluded.liquidity_score,
                updated_at      = excluded.updated_at
        """
        with self._write_lock:
            conn = self._get_conn()
            conn.execute(sql, stats)
            conn.commit()

    def fetch_market_statistics(self) -> list:
        """Return all market statistics ordered by liquidity descending."""
        conn = self._get_conn()
        cur = conn.execute(
            "SELECT * FROM market_statistics ORDER BY liquidity_score DESC"
        )
        return [dict(row) for row in cur.fetchall()]

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def close(self) -> None:
        """Close the per-thread connection if it is open."""
        conn = getattr(self._local, "conn", None)
        if conn:
            try:
                conn.close()
            except sqlite3.Error as exc:
                logger.warning("Error closing DB connection: %s", exc)
            self._local.conn = None
