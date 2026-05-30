import re

from app.models import Intent


CONSTRUCTION_TERMS = {
    "build",
    "builder",
    "construction",
    "contractor",
    "extension",
    "loft",
    "renovation",
    "refurb",
    "site",
}

LEGAL_COMPLIANCE_TERMS = {
    "compliance",
    "court",
    "fine",
    "gdpr",
    "legal",
    "policy",
    "regulation",
    "regulatory",
    "solicitor",
}

URGENT_TERMS = {
    "asap",
    "deadline today",
    "emergency",
    "immediately",
    "right now",
    "same day",
    "today",
    "urgent",
}


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def classify_intent(transcript: str) -> Intent:
    text = transcript.strip().lower()
    if not text:
        return Intent.UNKNOWN

    words = _tokens(text)
    if any(term in text for term in URGENT_TERMS):
        return Intent.URGENT_ISSUE
    if words & LEGAL_COMPLIANCE_TERMS:
        return Intent.LEGAL_OR_COMPLIANCE
    if words & CONSTRUCTION_TERMS:
        return Intent.CONSTRUCTION_LEAD
    if len(words) >= 3:
        return Intent.GENERAL_ENQUIRY
    return Intent.UNKNOWN

