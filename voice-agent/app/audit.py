import hashlib
import json
import os
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import psycopg

from app.models import AuditEvent, EventType


class AuditLog:
    def __init__(self, file_path: str | Path, database_url: str | None = None) -> None:
        self.file_path = Path(file_path)
        self.database_url = database_url
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if self.database_url:
            self._ensure_table()

    @classmethod
    def from_env(cls) -> "AuditLog":
        return cls(
            file_path=os.getenv("AUDIT_LOG_PATH", "/data/voice-agent/audit.jsonl"),
            database_url=os.getenv("DATABASE_URL"),
        )

    def _ensure_table(self) -> None:
        with psycopg.connect(self.database_url) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS voice_agent_audit_events (
                    event_id UUID PRIMARY KEY,
                    idempotency_key TEXT UNIQUE NOT NULL,
                    event_type TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    caller TEXT,
                    payload JSONB NOT NULL,
                    duplicate BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMPTZ NOT NULL
                )
                """
            )

    def database_status(self) -> str:
        if not self.database_url:
            return "unconfigured"
        try:
            with psycopg.connect(self.database_url) as conn:
                conn.execute("SELECT 1")
        except psycopg.Error:
            return "unreachable"
        return "connected"

    def record(
        self,
        event_type: EventType,
        session_id: str,
        caller: str | None,
        payload: dict[str, Any],
    ) -> AuditEvent:
        idempotency_key = make_idempotency_key(event_type, session_id, payload)
        existing = self._find_existing(idempotency_key)
        if existing:
            return existing.model_copy(update={"duplicate": True})

        event = AuditEvent(
            event_id=str(uuid.uuid4()),
            idempotency_key=idempotency_key,
            event_type=event_type,
            session_id=session_id,
            caller=caller,
            payload=payload,
            created_at=datetime.now(UTC).isoformat(),
        )
        self._append_file(event)
        if self.database_url:
            self._insert_db(event)
        return event

    def _append_file(self, event: AuditEvent) -> None:
        with self.file_path.open("a", encoding="utf-8") as handle:
            handle.write(event.model_dump_json() + "\n")

    def _insert_db(self, event: AuditEvent) -> None:
        with psycopg.connect(self.database_url) as conn:
            conn.execute(
                """
                INSERT INTO voice_agent_audit_events
                    (event_id, idempotency_key, event_type, session_id, caller, payload, duplicate, created_at)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (idempotency_key) DO NOTHING
                """,
                (
                    event.event_id,
                    event.idempotency_key,
                    event.event_type.value,
                    event.session_id,
                    event.caller,
                    json.dumps(event.payload),
                    event.duplicate,
                    event.created_at,
                ),
            )

    def _find_existing(self, idempotency_key: str) -> AuditEvent | None:
        existing = self._find_existing_file(idempotency_key)
        if existing or not self.database_url:
            return existing
        return self._find_existing_db(idempotency_key)

    def _find_existing_file(self, idempotency_key: str) -> AuditEvent | None:
        if not self.file_path.exists():
            return None
        with self.file_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                if not line.strip():
                    continue
                event = AuditEvent.model_validate_json(line)
                if event.idempotency_key == idempotency_key:
                    return event
        return None

    def _find_existing_db(self, idempotency_key: str) -> AuditEvent | None:
        with psycopg.connect(self.database_url) as conn:
            row = conn.execute(
                """
                SELECT event_id, idempotency_key, event_type, session_id, caller, payload, duplicate, created_at
                FROM voice_agent_audit_events
                WHERE idempotency_key = %s
                """,
                (idempotency_key,),
            ).fetchone()
        if not row:
            return None
        return AuditEvent(
            event_id=str(row[0]),
            idempotency_key=row[1],
            event_type=EventType(row[2]),
            session_id=row[3],
            caller=row[4],
            payload=row[5],
            duplicate=row[6],
            created_at=row[7].isoformat(),
        )


def make_idempotency_key(event_type: EventType, session_id: str, payload: dict[str, Any]) -> str:
    normalized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    raw = f"{event_type.value}:{session_id}:{normalized}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
