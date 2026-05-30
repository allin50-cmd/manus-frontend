import json
from concurrent.futures import ThreadPoolExecutor

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


def test_concurrent_duplicate_events_return_same_id_and_append_once(tmp_path) -> None:
    path = tmp_path / "audit.jsonl"
    audit = AuditLog(path)

    def record_duplicate():
        return audit.record(
            EventType.SESSION_COMPLETED,
            "session-concurrent",
            "+442000000000",
            {
                "intent": "urgent_issue",
                "risk_level": "high",
                "policy_decision": "ESCALATE",
            },
        )

    with ThreadPoolExecutor(max_workers=20) as executor:
        events = list(executor.map(lambda _: record_duplicate(), range(50)))

    lines = path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1
    assert len({event.event_id for event in events}) == 1
    assert sum(event.duplicate for event in events) == 49
