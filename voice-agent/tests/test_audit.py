import json

from app.audit import AuditLog
from app.models import EventType


def test_audit_logging_appends_file_event(tmp_path) -> None:
    path = tmp_path / "audit.jsonl"
    audit = AuditLog(path)

    event = audit.record(
        EventType.TRANSCRIPT_RECEIVED,
        "session-1",
        "+442000000000",
        {"transcript": "hello"},
    )

    lines = path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1
    stored = json.loads(lines[0])
    assert stored["event_id"] == event.event_id
    assert stored["event_type"] == "transcript_received"
    assert stored["session_id"] == "session-1"


def test_duplicate_event_is_idempotent_and_not_appended(tmp_path) -> None:
    path = tmp_path / "audit.jsonl"
    audit = AuditLog(path)

    first = audit.record(EventType.SESSION_STARTED, "session-1", "caller", {"caller": "caller"})
    second = audit.record(EventType.SESSION_STARTED, "session-1", "caller", {"caller": "caller"})

    lines = path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1
    assert second.event_id == first.event_id
    assert second.duplicate is True

