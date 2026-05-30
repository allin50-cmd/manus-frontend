from app.audit import AuditLog
from app.models import TranscriptRequest
from app.processor import process_transcript_request
from app.workers.celery_app import celery


@celery.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def process_transcript_task(self, payload: dict) -> dict:
    request = TranscriptRequest.model_validate(payload)
    result = process_transcript_request(request, AuditLog.from_env())
    return result.model_dump(mode="json")
