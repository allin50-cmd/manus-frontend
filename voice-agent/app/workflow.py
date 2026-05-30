import hashlib
import json
import os
import time
import uuid
from dataclasses import dataclass
from typing import Any, Callable

import psycopg
from psycopg.rows import dict_row

from app.init_db import get_database_url, initialize_database
from app.models import EnqueueTranscriptResponse, TranscriptRequest

QUEUE_CHANNEL = "voice_agent_jobs"
DEFAULT_QUEUE_NAME = "voice_transcripts"


@dataclass(frozen=True)
class LeasedJob:
    id: str
    idempotency_key: str
    queue_name: str
    payload: dict[str, Any]
    attempts: int
    max_attempts: int
    leased_by: str


class WorkflowStore:
    def __init__(self, database_url: str | None = None) -> None:
        self.database_url = database_url or get_database_url()

    @classmethod
    def from_env(cls) -> "WorkflowStore":
        return cls(os.getenv("DATABASE_URL") or get_database_url())

    def initialize(self) -> None:
        initialize_database(self.database_url)

    def enqueue_transcript(
        self,
        request: TranscriptRequest,
        correlation_id: str,
        *,
        priority: int = 0,
        max_attempts: int = 3,
    ) -> EnqueueTranscriptResponse:
        job_id = stable_uuid(correlation_id)
        payload = request.model_dump()
        with psycopg.connect(self.database_url) as conn:
            row = conn.execute(
                """
                WITH inserted AS (
                    INSERT INTO job_queue
                        (id, idempotency_key, queue_name, priority, payload, max_attempts)
                    VALUES
                        (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (idempotency_key) DO NOTHING
                    RETURNING id, TRUE AS inserted
                )
                SELECT id, inserted FROM inserted
                UNION ALL
                SELECT id, FALSE AS inserted
                FROM job_queue
                WHERE idempotency_key = %s
                  AND NOT EXISTS (SELECT 1 FROM inserted)
                LIMIT 1
                """,
                (
                    job_id,
                    correlation_id,
                    DEFAULT_QUEUE_NAME,
                    priority,
                    json.dumps(payload),
                    max_attempts,
                    correlation_id,
                ),
            ).fetchone()
            if row[1]:
                self.append_system_event(
                    conn,
                    "job_enqueued",
                    "job",
                    str(row[0]),
                    {
                        "correlation_id": correlation_id,
                        "queue_name": DEFAULT_QUEUE_NAME,
                        "session_id": request.session_id,
                    },
                )
                conn.execute("SELECT pg_notify(%s, %s)", (QUEUE_CHANNEL, str(row[0])))

        return EnqueueTranscriptResponse(
            status="accepted",
            correlation_id=correlation_id,
            task_id=str(row[0]),
        )

    def lease_next_job(
        self,
        worker_id: str,
        *,
        queue_name: str = DEFAULT_QUEUE_NAME,
        lease_seconds: int = 60,
    ) -> LeasedJob | None:
        with psycopg.connect(self.database_url, row_factory=dict_row) as conn:
            row = conn.execute(
                """
                WITH next_job AS (
                    SELECT id
                    FROM job_queue
                    WHERE queue_name = %s
                      AND status = 'pending'
                      AND available_at <= now()
                    ORDER BY priority DESC, available_at ASC, id ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1
                )
                UPDATE job_queue AS job
                SET status = 'processing',
                    leased_by = %s,
                    lease_expires_at = now() + (%s || ' seconds')::interval,
                    attempts = attempts + 1,
                    updated_at = now()
                FROM next_job
                WHERE job.id = next_job.id
                RETURNING job.id, job.idempotency_key, job.queue_name, job.payload,
                          job.attempts, job.max_attempts, job.leased_by
                """,
                (queue_name, worker_id, lease_seconds),
            ).fetchone()
            if not row:
                return None
            self.append_system_event(
                conn,
                "job_leased",
                "job",
                str(row["id"]),
                {"worker_id": worker_id, "attempts": row["attempts"]},
            )
            return _leased_job_from_row(row)

    def complete_job(self, job_id: str, worker_id: str, result: dict[str, Any]) -> bool:
        with psycopg.connect(self.database_url) as conn:
            row = conn.execute(
                """
                UPDATE job_queue
                SET status = 'completed',
                    completed_at = now(),
                    lease_expires_at = NULL,
                    updated_at = now()
                WHERE id = %s
                  AND status = 'processing'
                  AND leased_by = %s
                RETURNING attempts
                """,
                (job_id, worker_id),
            ).fetchone()
            if not row:
                return False
            conn.execute(
                """
                INSERT INTO job_attempts (job_id, worker_id, attempt_number, status)
                VALUES (%s, %s, %s, 'completed')
                """,
                (job_id, worker_id, row[0]),
            )
            self.append_system_event(
                conn,
                "job_completed",
                "job",
                job_id,
                {"worker_id": worker_id, "result": result},
            )
            return True

    def fail_job(
        self,
        job: LeasedJob,
        error: Exception | str,
        *,
        retry_delay_seconds: int = 30,
    ) -> bool:
        message = str(error)
        fingerprint = failure_fingerprint(message)
        next_status = "dead_letter" if job.attempts >= job.max_attempts else "pending"
        with psycopg.connect(self.database_url) as conn:
            row = conn.execute(
                """
                UPDATE job_queue
                SET status = %s,
                    available_at = CASE
                        WHEN %s = 'pending'
                        THEN now() + (%s || ' seconds')::interval
                        ELSE available_at
                    END,
                    failed_at = CASE WHEN %s = 'dead_letter' THEN now() ELSE failed_at END,
                    lease_expires_at = NULL,
                    failure_fingerprint = %s,
                    last_error = %s,
                    updated_at = now()
                WHERE id = %s
                  AND status = 'processing'
                  AND leased_by = %s
                RETURNING attempts
                """,
                (
                    next_status,
                    next_status,
                    retry_delay_seconds,
                    next_status,
                    fingerprint,
                    message,
                    job.id,
                    job.leased_by,
                ),
            ).fetchone()
            if not row:
                return False
            conn.execute(
                """
                INSERT INTO job_attempts (job_id, worker_id, attempt_number, status, error)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (job.id, job.leased_by, row[0], next_status, message),
            )
            self.append_system_event(
                conn,
                "job_failed",
                "job",
                job.id,
                {
                    "worker_id": job.leased_by,
                    "status": next_status,
                    "failure_fingerprint": fingerprint,
                },
            )
            return True

    def reclaim_expired_leases(self) -> int:
        with psycopg.connect(self.database_url) as conn:
            rows = conn.execute(
                """
                UPDATE job_queue
                SET status = 'pending',
                    leased_by = NULL,
                    lease_expires_at = NULL,
                    updated_at = now()
                WHERE status = 'processing'
                  AND lease_expires_at < now()
                RETURNING id
                """
            ).fetchall()
            for row in rows:
                self.append_system_event(
                    conn,
                    "job_lease_reclaimed",
                    "job",
                    str(row[0]),
                    {},
                )
            return len(rows)

    def append_transcript_chunk(
        self,
        session_id: str,
        seq: int,
        transcript: str,
        payload: dict[str, Any] | None = None,
    ) -> int | None:
        with psycopg.connect(self.database_url) as conn:
            row = conn.execute(
                """
                INSERT INTO transcript_chunks (session_id, seq, transcript, payload)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (session_id, seq) DO NOTHING
                RETURNING id
                """,
                (session_id, seq, transcript, json.dumps(payload or {})),
            ).fetchone()
            if row:
                self.append_system_event(
                    conn,
                    "transcript_chunk_received",
                    "session",
                    session_id,
                    {"seq": seq, "transcript_chunk_id": row[0]},
                )
                return row[0]
            return None

    def heartbeat(
        self,
        worker_id: str,
        *,
        status: str = "running",
        metadata: dict[str, Any] | None = None,
    ) -> None:
        with psycopg.connect(self.database_url) as conn:
            conn.execute(
                """
                INSERT INTO worker_heartbeats (worker_id, status, metadata)
                VALUES (%s, %s, %s)
                ON CONFLICT (worker_id) DO UPDATE
                SET status = EXCLUDED.status,
                    metadata = EXCLUDED.metadata,
                    last_seen_at = now()
                """,
                (worker_id, status, json.dumps(metadata or {})),
            )

    def append_system_event(
        self,
        conn: psycopg.Connection,
        event_type: str,
        aggregate_type: str,
        aggregate_id: str,
        payload: dict[str, Any],
    ) -> int:
        row = conn.execute(
            """
            INSERT INTO system_events (event_type, aggregate_type, aggregate_id, payload)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (event_type, aggregate_type, aggregate_id, json.dumps(payload)),
        ).fetchone()
        if isinstance(row, dict):
            return int(row["id"])
        return int(row[0])

    def listen_for_wakeups(
        self,
        handler: Callable[[], None],
        *,
        timeout_seconds: float = 30.0,
        reconnect_delay_seconds: float = 1.0,
        should_stop: Callable[[], bool] | None = None,
    ) -> None:
        should_stop = should_stop or (lambda: False)
        while not should_stop():
            try:
                with psycopg.connect(self.database_url, autocommit=True) as conn:
                    conn.execute(f"LISTEN {QUEUE_CHANNEL}")
                    while not should_stop():
                        notified = False
                        for _notify in conn.notifies(timeout=timeout_seconds, stop_after=1):
                            notified = True
                            handler()
                        if not notified:
                            handler()
            except psycopg.Error:
                time.sleep(reconnect_delay_seconds)


def stable_uuid(value: str) -> str:
    return str(uuid.UUID(hashlib.sha256(value.encode("utf-8")).hexdigest()[:32], version=5))


def failure_fingerprint(message: str) -> str:
    return hashlib.sha256(message.encode("utf-8")).hexdigest()


def _leased_job_from_row(row: dict[str, Any]) -> LeasedJob:
    payload = row["payload"]
    if isinstance(payload, str):
        payload = json.loads(payload)
    return LeasedJob(
        id=str(row["id"]),
        idempotency_key=row["idempotency_key"],
        queue_name=row["queue_name"],
        payload=payload,
        attempts=row["attempts"],
        max_attempts=row["max_attempts"],
        leased_by=row["leased_by"],
    )
