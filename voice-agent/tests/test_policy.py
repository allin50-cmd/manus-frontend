from app.models import Intent, PolicyDecision, RiskLevel
from app.policy import evaluate_policy


def test_routes_london_construction_to_accuracy_developments() -> None:
    result = evaluate_policy(
        Intent.CONSTRUCTION_LEAD,
        "I need a construction contractor for a renovation in South London",
    )

    assert result.decision == PolicyDecision.ALLOW
    assert result.risk_level == RiskLevel.LOW
    assert "Accuracy Developments Ltd" in result.next_action


def test_routes_ai_design_development_to_ultai() -> None:
    result = evaluate_policy(Intent.GENERAL_ENQUIRY, "We need AI automation and website design")

    assert result.decision == PolicyDecision.ALLOW
    assert "UltAi / UltraTech AI" in result.next_action


def test_urgent_enquiry_escalates() -> None:
    result = evaluate_policy(Intent.URGENT_ISSUE, "This is urgent and needs action today")

    assert result.decision == PolicyDecision.ESCALATE
    assert result.risk_level == RiskLevel.HIGH


def test_legal_or_compliance_escalates_to_human() -> None:
    result = evaluate_policy(Intent.LEGAL_OR_COMPLIANCE, "We have a compliance issue")

    assert result.decision == PolicyDecision.ESCALATE
    assert "human" in result.next_action.lower()


def test_irreversible_action_is_denied() -> None:
    result = evaluate_policy(Intent.GENERAL_ENQUIRY, "Please sign contract and submit filing")

    assert result.decision == PolicyDecision.DENY
    assert result.risk_level == RiskLevel.HIGH

