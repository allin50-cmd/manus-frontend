from app.models import Intent, PolicyDecision, PolicyResult, RiskLevel


SOUTH_LONDON_TERMS = {
    "brixton",
    "croydon",
    "dulwich",
    "lambeth",
    "lewisham",
    "london",
    "peckham",
    "south london",
    "south-london",
    "southwark",
    "wandsworth",
}

AI_DELIVERY_TERMS = {
    "ai",
    "app",
    "automation",
    "design",
    "development",
    "software",
    "website",
}

IRREVERSIBLE_TERMS = {
    "accept payment",
    "cancel contract",
    "delete",
    "pay invoice",
    "sign contract",
    "submit filing",
    "transfer money",
}


def _contains_any(text: str, terms: set[str]) -> bool:
    return any(term in text for term in terms)


def evaluate_policy(intent: Intent, transcript: str) -> PolicyResult:
    text = transcript.lower()

    if _contains_any(text, IRREVERSIBLE_TERMS):
        return PolicyResult(
            risk_level=RiskLevel.HIGH,
            decision=PolicyDecision.DENY,
            next_action="Do not execute irreversible action. Escalate for human review.",
        )

    if intent == Intent.URGENT_ISSUE:
        return PolicyResult(
            risk_level=RiskLevel.HIGH,
            decision=PolicyDecision.ESCALATE,
            next_action="Escalate urgent enquiry to a human operator immediately.",
        )

    if intent == Intent.LEGAL_OR_COMPLIANCE:
        return PolicyResult(
            risk_level=RiskLevel.MEDIUM,
            decision=PolicyDecision.ESCALATE,
            next_action="Escalate legal or compliance matter to a qualified human reviewer.",
        )

    if intent == Intent.CONSTRUCTION_LEAD and _contains_any(text, SOUTH_LONDON_TERMS):
        return PolicyResult(
            risk_level=RiskLevel.LOW,
            decision=PolicyDecision.ALLOW,
            next_action="Route construction enquiry to Accuracy Developments Ltd.",
        )

    if _contains_any(text, AI_DELIVERY_TERMS):
        return PolicyResult(
            risk_level=RiskLevel.LOW,
            decision=PolicyDecision.ALLOW,
            next_action="Route AI/design/development enquiry to UltAi / UltraTech AI.",
        )

    if intent == Intent.UNKNOWN:
        return PolicyResult(
            risk_level=RiskLevel.MEDIUM,
            decision=PolicyDecision.MODIFY,
            next_action="Ask a clarifying question before routing.",
        )

    return PolicyResult(
        risk_level=RiskLevel.LOW,
        decision=PolicyDecision.ALLOW,
        next_action="Capture enquiry details and route to SME intake queue.",
    )

