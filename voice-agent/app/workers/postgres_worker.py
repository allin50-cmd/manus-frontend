import os
import time
import uuid
from typing import Callable

from app.audit import AuditLog
from app.models import TranscriptRequest
from app.processor import process_transcript_request
from app.workflow import WorkflowStore


def run_once(
    store: WorkflowStore,
    *,
    worker_id: str,
    processor: Callable[[TranscriptRequest], dict] | None = None,
) -> bool:
    store.heartbeat(worker_id, metadata={"mode": "postgres"})
    job = store.lease_next_job(worker_id)
    if job is None:
        return False

    try:
        request = TranscriptRequest.model_validate(job.payload)
        if processor:
            result = processor(request)
        else:
            response = process_transcript_request(request, AuditLog.from_env())
            result = response.model_dump(mode="json")
        return store.complete_job(job.id, worker_id, result)
    except Exception as exc:
        store.fail_job(job, exc)
        raise


def main() -> None:
    worker_id = os.getenv("VOICE_AGENT_WORKER_ID", f"voice-worker-{uuid.uuid4()}")
    poll_seconds = float(os.getenv("VOICE_AGENT_WORKER_POLL_SECONDS", "2"))
    store = WorkflowStore.from_env()
    store.initialize()
    while True:
        try:
            ran_job = run_once(store, worker_id=worker_id)
        except Exception:
            ran_job = True
        if not ran_job:
            time.sleep(poll_seconds)


if __name__ == "__main__":
    main()
