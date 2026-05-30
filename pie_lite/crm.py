import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Set, List

from .config import CRM_STAGES, LEADS_JSON_PATH, SEEN_REFS_PATH, CSV_INPUT_PATH
from .models import Lead, load_leads, save_leads
from .scoring import (
    infer_build_type,
    extract_floor_area,
    calculate_opportunity_score,
    calculate_estimated_value,
)


def _load_seen_refs(path: Path) -> Set[str]:
    """Load seen refs from a JSON file containing a list of strings."""
    if not path.exists():
        return set()
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return set(data)


def _save_seen_refs(refs: Set[str], path: Path) -> None:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(sorted(refs), f, indent=2)


def process_new_leads(
    csv_path: Path = Path(CSV_INPUT_PATH),
    seen_refs_path: Path = Path(SEEN_REFS_PATH),
    leads_path: Path = Path(LEADS_JSON_PATH),
) -> List[Lead]:
    """
    Read the council leads CSV, deduplicate, infer building attributes,
    assign placeholder scores, and append to the leads store.
    Returns list of newly created Leads.
    """
    if not csv_path.exists():
        raise FileNotFoundError(
            f"CSV input not found: {csv_path}\n"
            "Run the scraper first: python3 run_daily.py"
        )

    existing_leads = load_leads(leads_path)
    seen_refs = _load_seen_refs(seen_refs_path)

    new_leads: List[Lead] = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ref = row.get("ref", "").strip()
            if not ref or ref in seen_refs:
                continue

            address = row.get("address", "").strip()
            description = row.get("description", "").strip()
            source = row.get("source", "").strip()
            date_scraped = row.get("date_scraped", datetime.now(timezone.utc).isoformat()).strip()

            build_type = infer_build_type(description)
            floor_area, area_source, area_conf = extract_floor_area(description, build_type)
            opp_score = calculate_opportunity_score(build_type, floor_area)
            est_value = calculate_estimated_value(build_type, floor_area)

            lead = Lead(
                ref=ref,
                address=address,
                description=description,
                source=source,
                date_scraped=date_scraped,
                inferred_build_type=build_type,
                inferred_floor_area_m2=floor_area,
                estimate_confidence="low",
                rate_source="placeholder",
                rate_validation_status="PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION",
                floor_area_source=area_source,
                floor_area_confidence=area_conf,
                opportunity_score=opp_score,
                estimated_build_value=est_value,
                crm_stage="New",
                last_updated=datetime.now(timezone.utc).isoformat(),
            )
            new_leads.append(lead)
            seen_refs.add(ref)

    if not new_leads:
        return []

    all_leads = existing_leads + new_leads
    save_leads(all_leads, leads_path)
    _save_seen_refs(seen_refs, seen_refs_path)

    return new_leads


def update_stage(ref: str, new_stage: str) -> Lead:
    """
    Update the CRM stage of a lead identified by 'ref'.
    Returns the updated Lead. Raises ValueError if not found or invalid stage.
    """
    if new_stage not in CRM_STAGES:
        raise ValueError(f"Invalid stage: {new_stage!r}. Must be one of: {CRM_STAGES}")

    leads_path = Path(LEADS_JSON_PATH)
    leads = load_leads(leads_path)
    for lead in leads:
        if lead.ref == ref:
            lead.crm_stage = new_stage
            lead.last_updated = datetime.now(timezone.utc).isoformat()
            save_leads(leads, leads_path)
            return lead
    raise ValueError(f"Lead ref {ref!r} not found")
