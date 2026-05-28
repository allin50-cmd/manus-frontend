from app.intent import classify_intent
from app.models import Intent


def test_classifies_construction_lead() -> None:
    assert classify_intent("Need a builder for a loft extension") == Intent.CONSTRUCTION_LEAD


def test_classifies_legal_or_compliance() -> None:
    assert classify_intent("We need compliance help with a regulatory fine") == Intent.LEGAL_OR_COMPLIANCE


def test_classifies_urgent_issue_first() -> None:
    assert classify_intent("Urgent legal deadline today") == Intent.URGENT_ISSUE


def test_classifies_general_enquiry() -> None:
    assert classify_intent("Can someone call me tomorrow please") == Intent.GENERAL_ENQUIRY


def test_classifies_unknown_for_empty_text() -> None:
    assert classify_intent("   ") == Intent.UNKNOWN

