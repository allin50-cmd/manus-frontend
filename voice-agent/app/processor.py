from app.audit import AuditLog
from app.intent import classify_intent
from app.models import EventType, PolicyDecision, ProcessTranscriptResponse, TranscriptRequest
from app.policy import evaluate_policy


def process_transcript_request(
    request: TranscriptRequest,
    audit_log: AuditLog,
) -> ProcessTranscriptResponse:
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
