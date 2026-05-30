import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import List


@dataclass
class Lead:
    ref: str
    address: str
    description: str
    source: str
    date_scraped: str

    # Inferred building data
    inferred_build_type: str              # one of: extension, new_build, loft_conversion, refurbishment, other
    inferred_floor_area_m2: float

    # Confidence / validation metadata
    estimate_confidence: str              # "low"
    rate_source: str                      # "placeholder"
    rate_validation_status: str           # "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION"
    floor_area_source: str                # "keyword_extraction" or "default"
    floor_area_confidence: str            # "low"

    # Scores & values
    opportunity_score: int                # 0-100
    estimated_build_value: float          # £

    # CRM pipeline
    crm_stage: str                        # one of CRM_STAGES
    last_updated: str                     # ISO 8601 datetime


def load_leads(path: Path) -> List[Lead]:
    """Load leads from a JSON file; return empty list if missing or corrupt."""
    if not path.exists():
        return []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return [Lead(**item) for item in data]
    except (json.JSONDecodeError, TypeError):
        return []


def save_leads(leads: List[Lead], path: Path) -> None:
    """Save leads as JSON array."""
    path.parent.mkdir(parents=True, exist_ok=True)
    data = [asdict(lead) for lead in leads]
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
