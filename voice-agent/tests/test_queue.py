from app.models import TranscriptRequest
from app.queue import enqueue_transcript_processing, make_correlation_id


class FakeTaskResult:
    def __init__(self, task_id: str) -> None:
        self.id = task_id


def test_make_correlation_id_is_deterministic() -> None:
    request = TranscriptRequest(
        session_id="session-1",
        caller="+442000000000",
        transcript="Urgent legal compliance deadline today",
    )

    assert make_correlation_id(request) == make_correlation_id(request)
    assert len(make_correlation_id(request)) == 32


def test_enqueue_transcript_processing_returns_immediate_ack(monkeypatch) -> None:
    seen_payloads: list[dict] = []
    seen_task_ids: list[str] = []

    def fake_apply_async(args: list[dict], task_id: str) -> FakeTaskResult:
        seen_payloads.extend(args)
        seen_task_ids.append(task_id)
        return FakeTaskResult(task_id)

    monkeypatch.setattr("app.queue.process_transcript_task.apply_async", fake_apply_async)
    request = TranscriptRequest(
        session_id="session-async-1",
        caller="+442000000000",
        transcript="I need a builder for a renovation in South London",
    )

    response = enqueue_transcript_processing(request)

    assert response.status == "accepted"
    assert response.correlation_id == make_correlation_id(request)
    assert response.task_id == response.correlation_id
    assert seen_payloads == [request.model_dump()]
    assert seen_task_ids == [response.correlation_id]
