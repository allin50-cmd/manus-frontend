import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.audit import AuditLog
from app.models import EnqueueTranscriptResponse, ProcessTranscriptResponse, TranscriptRequest
from app.processor import process_transcript_request
from app.queue import enqueue_transcript_processing

app = FastAPI(title="FineGuard AI Voice Reception", version="0.1.0")
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "VOICE_AGENT_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,https://manus-frontend-zeta.vercel.app",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=os.getenv("VOICE_AGENT_CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app"),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["content-type"],
)
audit_log = AuditLog.from_env()


@app.get("/health")
def health() -> dict[str, str]:
    database = audit_log.database_status()
    status = "healthy" if database in {"connected", "unconfigured"} else "degraded"
    return {"status": status, "service": "voice-reception", "database": database}


@app.post("/process-transcript", response_model=ProcessTranscriptResponse)
def process_transcript(request: TranscriptRequest) -> ProcessTranscriptResponse:
    return process_transcript_request(request, audit_log)


@app.post("/voice/events", response_model=EnqueueTranscriptResponse, status_code=202)
def enqueue_voice_event(request: TranscriptRequest) -> EnqueueTranscriptResponse:
    return enqueue_transcript_processing(request)
