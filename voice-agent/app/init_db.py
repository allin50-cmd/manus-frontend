import os

import psycopg

DEFAULT_DATABASE_URL = "postgresql://voice_agent:change-me-local@postgres:5432/voice_agent"

SCHEMA = """
CREATE TABLE IF NOT EXISTS system_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_events_type_id
ON system_events(event_type, id);

CREATE TABLE IF NOT EXISTS job_queue (
    id UUID PRIMARY KEY,
    idempotency_key TEXT UNIQUE NOT NULL,
    queue_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 0,
    payload JSONB NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    leased_by TEXT,
    lease_expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_fingerprint TEXT,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('pending', 'processing', 'completed', 'dead_letter'))
);

CREATE INDEX IF NOT EXISTS idx_job_queue_pending
ON job_queue(priority DESC, available_at ASC, id ASC)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_job_queue_failure_fingerprint
ON job_queue(failure_fingerprint)
WHERE failure_fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS job_attempts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id UUID NOT NULL,
    worker_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_attempts_job_id
ON job_attempts(job_id, id);

CREATE TABLE IF NOT EXISTS transcript_chunks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id TEXT NOT NULL,
    seq INTEGER NOT NULL,
    transcript TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_transcript_chunks_session_seq
ON transcript_chunks(session_id, seq);

CREATE INDEX IF NOT EXISTS idx_transcript_chunks_created
ON transcript_chunks(created_at);

CREATE TABLE IF NOT EXISTS worker_heartbeats (
    worker_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_agent_audit_events (
    event_id UUID PRIMARY KEY,
    idempotency_key TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    caller TEXT,
    payload JSONB NOT NULL,
    duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_voice_agent_session
ON voice_agent_audit_events(session_id);

CREATE INDEX IF NOT EXISTS idx_voice_agent_idempotency
ON voice_agent_audit_events(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_voice_agent_created
ON voice_agent_audit_events(created_at DESC);
"""


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)


def initialize_database(database_url: str | None = None) -> None:
    with psycopg.connect(database_url or get_database_url()) as conn:
        conn.execute(SCHEMA)


def main() -> None:
    initialize_database()
    print("database initialized")


if __name__ == "__main__":
    main()
