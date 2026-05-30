from app.workers.transcript_worker import process_transcript_task


def test_process_transcript_task_runs_pipeline(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("AUDIT_LOG_PATH", str(tmp_path / "audit.jsonl"))

    result = process_transcript_task.run(
        {
            "session_id": "worker-session-1",
            "caller": "+442000000000",
            "transcript": "Urgent legal compliance deadline today",
        }
    )

    assert result["intent"] == "urgent_issue"
    assert result["risk_level"] == "high"
    assert result["policy_decision"] == "ESCALATE"
    assert result["audit_event_id"]
    assert "human_escalation_required" in (tmp_path / "audit.jsonl").read_text(encoding="utf-8")
