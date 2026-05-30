from app.models import EnqueueTranscriptResponse, TranscriptRequest
from app.queue import enqueue_transcript_processing, make_correlation_id
from app.workflow import LeasedJob, WorkflowStore, failure_fingerprint, stable_uuid
from app.workers.postgres_worker import run_once


def test_stable_uuid_and_failure_fingerprint_are_deterministic() -> None:
    assert stable_uuid("same") == stable_uuid("same")
    assert stable_uuid("same") != stable_uuid("different")
    assert failure_fingerprint("boom") == failure_fingerprint("boom")
    assert len(failure_fingerprint("boom")) == 64


def test_lease_query_uses_skip_locked() -> None:
    names = WorkflowStore.lease_next_job.__code__.co_consts
    sql = "\n".join(const for const in names if isinstance(const, str))
    assert "FOR UPDATE SKIP LOCKED" in sql
    assert "ORDER BY priority DESC, available_at ASC, id ASC" in sql
    assert "status = 'processing'" in sql


def test_enqueue_query_is_idempotent_without_noisy_updates() -> None:
    names = WorkflowStore.enqueue_transcript.__code__.co_consts
    sql = "\n".join(const for const in names if isinstance(const, str))
    assert "ON CONFLICT (idempotency_key) DO NOTHING" in sql
    assert "TRUE AS inserted" in sql
    assert "FALSE AS inserted" in sql


def test_listen_loop_uses_psycopg_notify_generator() -> None:
    names = WorkflowStore.listen_for_wakeups.__code__.co_names
    assert "notifies" in names
    assert "wait" not in names


def test_postgres_queue_backend_returns_immediate_ack(monkeypatch) -> None:
    request = TranscriptRequest(
        session_id="session-pg-1",
        caller="+442000000000",
        transcript="Urgent compliance issue today",
    )
    calls: list[tuple[str, str]] = []

    class FakeStore:
        @classmethod
        def from_env(cls):
            return cls()

        def initialize(self) -> None:
            calls.append(("initialize", ""))

        def enqueue_transcript(self, queued_request, correlation_id):
            calls.append((queued_request.session_id, correlation_id))
            return EnqueueTranscriptResponse(
                status="accepted",
                correlation_id=correlation_id,
                task_id="job-1",
            )

    monkeypatch.setenv("VOICE_AGENT_QUEUE_BACKEND", "postgres")
    monkeypatch.setattr("app.queue.WorkflowStore", FakeStore)

    response = enqueue_transcript_processing(request)

    assert response.status == "accepted"
    assert response.correlation_id == make_correlation_id(request)
    assert response.task_id == "job-1"
    assert calls == [("initialize", ""), ("session-pg-1", response.correlation_id)]


class FakeStore:
    def __init__(self, job: LeasedJob | None) -> None:
        self.job = job
        self.completed: list[tuple[str, str, dict]] = []
        self.failed: list[tuple[str, str]] = []
        self.heartbeats: list[str] = []

    def heartbeat(self, worker_id: str, **_kwargs) -> None:
        self.heartbeats.append(worker_id)

    def lease_next_job(self, worker_id: str):
        if self.job is None:
            return None
        job = self.job
        self.job = None
        return job

    def complete_job(self, job_id: str, worker_id: str, result: dict) -> bool:
        self.completed.append((job_id, worker_id, result))
        return True

    def fail_job(self, job: LeasedJob, error: Exception) -> bool:
        self.failed.append((job.id, str(error)))
        return True


def test_postgres_worker_completes_one_leased_job() -> None:
    job = LeasedJob(
        id="job-1",
        idempotency_key="idem-1",
        queue_name="voice_transcripts",
        payload={
            "session_id": "session-worker-1",
            "caller": "+442000000000",
            "transcript": "I need a builder in South London",
        },
        attempts=1,
        max_attempts=3,
        leased_by="worker-1",
    )
    store = FakeStore(job)

    did_work = run_once(
        store,
        worker_id="worker-1",
        processor=lambda request: {"session_id": request.session_id, "ok": True},
    )

    assert did_work is True
    assert store.heartbeats == ["worker-1"]
    assert store.completed == [("job-1", "worker-1", {"session_id": "session-worker-1", "ok": True})]
    assert store.failed == []


def test_postgres_worker_records_failure_and_reraises() -> None:
    job = LeasedJob(
        id="job-2",
        idempotency_key="idem-2",
        queue_name="voice_transcripts",
        payload={
            "session_id": "session-worker-2",
            "caller": "+442000000000",
            "transcript": "hello there",
        },
        attempts=1,
        max_attempts=3,
        leased_by="worker-2",
    )
    store = FakeStore(job)

    try:
        run_once(
            store,
            worker_id="worker-2",
            processor=lambda _request: (_ for _ in ()).throw(RuntimeError("processor failed")),
        )
    except RuntimeError:
        pass
    else:
        raise AssertionError("worker failure was not raised")

    assert store.completed == []
    assert store.failed == [("job-2", "processor failed")]
