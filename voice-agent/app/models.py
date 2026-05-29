from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class Intent(StrEnum):
    CONSTRUCTION_LEAD = "construction_lead"
    LEGAL_OR_COMPLIANCE = "legal_or_compliance"
    URGENT_ISSUE = "urgent_issue"
    GENERAL_ENQUIRY = "general_enquiry"
    UNKNOWN = "unknown"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class PolicyDecision(StrEnum):
    ALLOW = "ALLOW"
    MODIFY = "MODIFY"
    DENY = "DENY"
    ESCALATE = "ESCALATE"


class EventType(StrEnum):
    SESSION_STARTED = "session_started"
    TRANSCRIPT_RECEIVED = "transcript_received"
    INTENT_CLASSIFIED = "intent_classified"
    POLICY_CHECK_REQUIRED = "policy_check_required"
    HUMAN_ESCALATION_REQUIRED = "human_escalation_required"
    SESSION_COMPLETED = "session_completed"


class TranscriptRequest(BaseModel):
    session_id: str = Field(min_length=1)
    caller: str = Field(min_length=1)
    transcript: str = Field(min_length=1)


class ProcessTranscriptResponse(BaseModel):
    intent: Intent
    risk_level: RiskLevel
    policy_decision: PolicyDecision
    next_action: str
    audit_event_id: str


class EnqueueTranscriptResponse(BaseModel):
    status: str
    correlation_id: str
    task_id: str


class PolicyResult(BaseModel):
    risk_level: RiskLevel
    decision: PolicyDecision
    next_action: str


class AuditEvent(BaseModel):
    event_id: str
    idempotency_key: str
    event_type: EventType
    session_id: str
    caller: str | None = None
    payload: dict[str, Any]
    duplicate: bool = False
    created_at: str
