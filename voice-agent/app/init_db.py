import os

import psycopg

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://voice_agent:change-me-local@postgres:5432/voice_agent",
)

SCHEMA = """
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


def main():
    with psycopg.connect(DATABASE_URL) as conn:
        conn.execute(SCHEMA)
    print("database initialized")


if __name__ == "__main__":
    main()
