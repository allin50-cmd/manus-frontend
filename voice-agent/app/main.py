import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.audit import AuditLog
from app.intent import classify_intent
from app.models import EventType, PolicyDecision, ProcessTranscriptResponse, TranscriptRequest
from app.policy import evaluate_policy

app = FastAPI(title="SME Voice Agent MVP", version="0.1.0")
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
    return {"status": status, "service": "voice-agent", "database": database}


@app.post("/process-transcript", response_model=ProcessTranscriptResponse)
def process_transcript(request: TranscriptRequest) -> ProcessTranscriptResponse:
    audit_log.record(
        EventType.SESSION_STARTED,
        request.session_id,
        request.caller,
        {"caller": request.caller},
    )
    audit_log.record(
        EventType.TRANSCRIPT_RECEIVED,
        request.session_id,
        request.caller,
        {"transcript": request.transcript},
    )

    intent = classify_intent(request.transcript)
    audit_log.record(
        EventType.INTENT_CLASSIFIED,
        request.session_id,
        request.caller,
        {"intent": intent.value},
    )

    policy = evaluate_policy(intent, request.transcript)
    audit_log.record(
        EventType.POLICY_CHECK_REQUIRED,
        request.session_id,
        request.caller,
        {
            "intent": intent.value,
            "risk_level": policy.risk_level.value,
            "policy_decision": policy.decision.value,
        },
    )

    if policy.decision == PolicyDecision.ESCALATE:
        audit_log.record(
            EventType.HUMAN_ESCALATION_REQUIRED,
            request.session_id,
            request.caller,
            {
                "intent": intent.value,
                "reason": policy.next_action,
            },
        )

    completed = audit_log.record(
        EventType.SESSION_COMPLETED,
        request.session_id,
        request.caller,
        {
            "intent": intent.value,
            "risk_level": policy.risk_level.value,
            "policy_decision": policy.decision.value,
            "next_action": policy.next_action,
        },
    )

    return ProcessTranscriptResponse(
        intent=intent,
        risk_level=policy.risk_level,
        policy_decision=policy.decision,
        next_action=policy.next_action,
        audit_event_id=completed.event_id,
    )
