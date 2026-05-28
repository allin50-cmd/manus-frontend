import importlib

from fastapi.testclient import TestClient


def test_health(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("AUDIT_LOG_PATH", str(tmp_path / "audit.jsonl"))

    import app.main as main

    importlib.reload(main)
    client = TestClient(main.app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "voice-agent",
        "database": "unconfigured",
    }


def test_health_allows_local_vite_origin(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("AUDIT_LOG_PATH", str(tmp_path / "audit.jsonl"))

    import app.main as main

    importlib.reload(main)
    client = TestClient(main.app)

    response = client.get("/health", headers={"Origin": "http://127.0.0.1:5173"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"


def test_process_transcript_returns_deterministic_json(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("AUDIT_LOG_PATH", str(tmp_path / "audit.jsonl"))

    import app.main as main

    importlib.reload(main)
    client = TestClient(main.app)

    response = client.post(
        "/process-transcript",
        json={
            "session_id": "session-construction-1",
            "caller": "+442000000000",
            "transcript": "I need a builder for a renovation in South London",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["intent"] == "construction_lead"
    assert body["risk_level"] == "low"
    assert body["policy_decision"] == "ALLOW"
    assert body["next_action"] == "Route construction enquiry to Accuracy Developments Ltd."
    assert body["audit_event_id"]


def test_process_transcript_escalates_urgent_legal_matter(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("AUDIT_LOG_PATH", str(tmp_path / "audit.jsonl"))

    import app.main as main

    importlib.reload(main)
    client = TestClient(main.app)

    response = client.post(
        "/process-transcript",
        json={
            "session_id": "session-urgent-1",
            "caller": "+442000000001",
            "transcript": "Urgent legal compliance deadline today",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["intent"] == "urgent_issue"
    assert body["risk_level"] == "high"
    assert body["policy_decision"] == "ESCALATE"

    audit_lines = (tmp_path / "audit.jsonl").read_text(encoding="utf-8")
    assert "human_escalation_required" in audit_lines
