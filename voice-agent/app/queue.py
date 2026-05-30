import hashlib
import os

from app.models import EnqueueTranscriptResponse, TranscriptRequest
from app.workflow import WorkflowStore
from app.workers.transcript_worker import process_transcript_task


def make_correlation_id(request: TranscriptRequest) -> str:
    raw = f"{request.session_id}:{request.caller}:{request.transcript}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def enqueue_transcript_processing(request: TranscriptRequest) -> EnqueueTranscriptResponse:
    correlation_id = make_correlation_id(request)
    if os.getenv("VOICE_AGENT_QUEUE_BACKEND", "celery").lower() == "postgres":
        store = WorkflowStore.from_env()
        store.initialize()
        return store.enqueue_transcript(request, correlation_id)

    task = process_transcript_task.apply_async(args=[request.model_dump()], task_id=correlation_id)
    return EnqueueTranscriptResponse(
        status="accepted",
        correlation_id=correlation_id,
        task_id=task.id,
    )
