from app import init_db


class FakeConnection:
    def __init__(self) -> None:
        self.statements: list[str] = []

    def __enter__(self) -> "FakeConnection":
        return self

    def __exit__(self, exc_type, exc, traceback) -> None:
        return None

    def execute(self, statement: str) -> None:
        self.statements.append(statement)


def test_initialize_database_uses_runtime_audit_schema(monkeypatch) -> None:
    fake_connection = FakeConnection()
    seen_urls: list[str] = []

    def fake_connect(database_url: str) -> FakeConnection:
        seen_urls.append(database_url)
        return fake_connection

    monkeypatch.setattr(init_db.psycopg, "connect", fake_connect)

    init_db.initialize_database("postgresql://example/voice")

    assert seen_urls == ["postgresql://example/voice"]
    schema = fake_connection.statements[0]
    assert "CREATE TABLE IF NOT EXISTS system_events" in schema
    assert "id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY" in schema
    assert "CREATE TABLE IF NOT EXISTS job_queue" in schema
    assert "failure_fingerprint TEXT" in schema
    assert "idx_job_queue_pending" in schema
    assert "WHERE status = 'pending'" in schema
    assert "idx_job_queue_failure_fingerprint" in schema
    assert "CREATE TABLE IF NOT EXISTS transcript_chunks" in schema
    assert "UNIQUE(session_id, seq)" in schema
    assert "idx_transcript_chunks_session_seq" in schema
    assert "CREATE TABLE IF NOT EXISTS worker_heartbeats" in schema
    assert "metadata JSONB NOT NULL" in schema
    assert "event_id UUID PRIMARY KEY" in schema
    assert "idempotency_key TEXT UNIQUE NOT NULL" in schema
    assert "event_type TEXT NOT NULL" in schema
    assert "duplicate BOOLEAN NOT NULL DEFAULT FALSE" in schema
    assert "idx_voice_agent_idempotency" in schema
