#!/usr/bin/env bash
# =============================================================================
# PIE Lite Pass 1 — Self-Extracting Installer
# Accuracy Developments Ltd / UltAi Group
# =============================================================================
# USAGE:
#   chmod +x install_pie_lite_pass1.sh
#   ./install_pie_lite_pass1.sh
#
# REQUIRES:
#   ~/idox-scraper/ already installed (install_idox_pipeline.sh ran first)
#   Python 3.11+
# =============================================================================
set -euo pipefail

TARGET="$HOME/idox-scraper"
VENV_PY="$TARGET/venv/bin/python3"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo -e "${BOLD}"
echo "======================================================================"
echo "  PIE Lite Pass 1 — Planning Intelligence Engine"
echo "  Accuracy Developments Ltd"
echo "======================================================================"
echo -e "${NC}"

[[ -d "$TARGET" ]] || error "~/idox-scraper not found. Run install_idox_pipeline.sh first."
[[ -f "$VENV_PY" ]] || error "venv not found at $TARGET/venv. Run install_idox_pipeline.sh first."

# ── pie_lite package ──────────────────────────────────────────────────────────
info "Creating pie_lite package..."
mkdir -p "$TARGET/pie_lite/config"

# __init__.py
cat > "$TARGET/pie_lite/__init__.py" << 'EOF'
"""PIE Lite — Planning Intelligence Engine (Pass 1)."""
__version__ = "1.0-pass1"
EOF

# store.py
cat > "$TARGET/pie_lite/store.py" << 'EOF'
"""
PIE Lite — Central JSON store.
projects.json is the single source of truth. Atomic writes via tmp-then-rename.
"""
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

_BASE = Path(__file__).parent.parent
STORE_PATH = _BASE / "projects.json"


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _load() -> Dict[str, Any]:
    if not STORE_PATH.exists():
        return {"projects": {}, "meta": {"created": _now(), "version": "1.0-pass1"}}
    with open(STORE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(data: Dict[str, Any]) -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = STORE_PATH.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp.replace(STORE_PATH)


def get_project(reference: str) -> Optional[Dict[str, Any]]:
    return _load()["projects"].get(reference)


def upsert_project(reference: str, data: Dict[str, Any]) -> Dict[str, Any]:
    store = _load()
    existing = store["projects"].get(reference, {})
    existing.update(data)
    existing["reference"] = reference
    existing["last_updated"] = _now()
    if "created_at" not in existing:
        existing["created_at"] = _now()
    store["projects"][reference] = existing
    _save(store)
    return existing


def set_crm_stage(reference: str, stage: str) -> Dict[str, Any]:
    valid = {"NEW", "CONTACTED", "SITE_VISIT", "QUOTED", "WON", "LOST"}
    if stage not in valid:
        raise ValueError(f"Invalid CRM stage '{stage}'. Must be one of {valid}")
    now = _now()
    existing = get_project(reference) or {}
    history = existing.get("crm_history", [])
    history.append({"stage": stage, "timestamp": now})
    return upsert_project(reference, {"crm_stage": stage, "crm_history": history})


def all_projects() -> List[Dict[str, Any]]:
    return list(_load()["projects"].values())


def store_path() -> Path:
    return STORE_PATH
EOF

# m1_approval.py
cat > "$TARGET/pie_lite/m1_approval.py" << 'EOF'
"""
Module 1 — Approval Intelligence Layer.
Reads real_council_leads.csv, returns only APPROVED records.
"""
import csv
import logging
from pathlib import Path
from typing import Any, Dict, List

log = logging.getLogger("pie.m1")

CSV_PATH = Path(__file__).parent.parent / "real_council_leads.csv"

APPROVED_TOKENS = {
    "approved", "grant", "granted", "permission granted",
    "approval granted", "application permitted", "approve",
}
EXCLUDE_SUBSTRINGS = {
    "pre-application", "prior approval not required",
    "refused", "withdrawn", "invalid",
}


def _is_approved(status: str) -> bool:
    norm = status.strip().lower()
    if any(ex in norm for ex in EXCLUDE_SUBSTRINGS):
        return False
    return any(tok in norm for tok in APPROVED_TOKENS)


def load_approved(csv_path: Path = CSV_PATH) -> List[Dict[str, Any]]:
    if not csv_path.exists():
        raise FileNotFoundError(f"Planning CSV not found: {csv_path}")
    approved = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if not _is_approved(row.get("status", "")):
                continue
            ref = row.get("reference", "").strip()
            if not ref:
                continue
            approved.append({
                "application_reference": ref,
                "address":        row.get("address", "").strip(),
                "borough":        row.get("council", "").strip(),
                "status":         row.get("status", "").strip(),
                "description":    row.get("description", "").strip(),
                "date_validated": row.get("date_validated", "").strip(),
                "url":            row.get("url", "").strip(),
            })
    log.info(f"M1: {len(approved)} approved from {csv_path.name}")
    return approved
EOF

# config/build_rates.json
cat > "$TARGET/pie_lite/config/build_rates.json" << 'EOF'
{
  "_comment": "Accuracy Developments build rates £/m². Every value is PLACEHOLDER — replace with Accuracy validated figures, then set _validated to true.",
  "_validated": false,
  "_last_updated": "",
  "_contact": "Daygon White +44 7825 600471",
  "rates": {
    "rear_extension":    { "low": 1800, "expected": 2400, "high": 3200, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "side_extension":    { "low": 1800, "expected": 2400, "high": 3200, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "loft_conversion":   { "low": 1200, "expected": 1600, "high": 2200, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "garage_conversion": { "low": 1000, "expected": 1400, "high": 1900, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "new_dwelling":      { "low": 2000, "expected": 2600, "high": 3500, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "change_of_use":     { "low": 1400, "expected": 1900, "high": 2600, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "refurbishment":     { "low": 900,  "expected": 1300, "high": 1800, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "basement":          { "low": 3000, "expected": 4000, "high": 5500, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "outbuilding":       { "low": 1200, "expected": 1700, "high": 2300, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "mixed":             { "low": 1600, "expected": 2200, "high": 3000, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "other":             { "low": 1400, "expected": 1900, "high": 2600, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" },
    "default":           { "low": 1400, "expected": 1900, "high": 2600, "source": "PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION" }
  },
  "default_floor_area_m2": {
    "_comment": "Assumed floor areas used in Pass 1 (no AI drawing extraction yet).",
    "rear_extension": 20, "side_extension": 18, "loft_conversion": 30,
    "garage_conversion": 15, "new_dwelling": 90, "change_of_use": 70,
    "refurbishment": 80, "basement": 40, "outbuilding": 25,
    "mixed": 60, "other": 40, "default": 40
  }
}
EOF

# m4_scoring.py
cat > "$TARGET/pie_lite/m4_scoring.py" << 'EOF'
"""
Module 4 — Opportunity Scoring Engine (Pass 1).
Infers build type from description keywords.
Applies placeholder rates from build_rates.json.
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, Tuple

log = logging.getLogger("pie.m4")

RATES_PATH = Path(__file__).parent / "config" / "build_rates.json"

TYPE_KEYWORDS: Tuple[Tuple[str, str], ...] = (
    ("loft conversion",   "loft_conversion"),
    ("dormer",            "loft_conversion"),
    ("basement",          "basement"),
    ("garage conversion", "garage_conversion"),
    ("change of use",     "change_of_use"),
    ("rear extension",    "rear_extension"),
    ("side extension",    "side_extension"),
    ("single storey",     "rear_extension"),
    ("two storey",        "rear_extension"),
    ("outbuilding",       "outbuilding"),
    ("new dwelling",      "new_dwelling"),
    ("erection of",       "new_dwelling"),
    ("new build",         "new_dwelling"),
    ("dwellinghouse",     "new_dwelling"),
    ("apartments",        "new_dwelling"),
    ("flats",             "new_dwelling"),
    ("refurbishment",     "refurbishment"),
    ("extension",         "rear_extension"),
    ("dwelling",          "new_dwelling"),
    ("house",             "refurbishment"),
)

TYPE_DESIRABILITY = {
    "new_dwelling": 25,  "basement": 22,      "loft_conversion": 20,
    "mixed": 18,         "rear_extension": 16, "side_extension": 16,
    "change_of_use": 15, "garage_conversion": 12, "refurbishment": 10,
    "outbuilding": 8,    "other": 5,
}


def _load_rates_doc() -> Dict[str, Any]:
    if not RATES_PATH.exists():
        raise FileNotFoundError(f"build_rates.json not found: {RATES_PATH}")
    with open(RATES_PATH, encoding="utf-8") as f:
        return json.load(f)


def infer_build_type(description: str) -> str:
    low = (description or "").lower()
    for kw, t in TYPE_KEYWORDS:
        if kw in low:
            return t
    return "other"


def _build_value(build_type: str, doc: Dict[str, Any]) -> Dict[str, Any]:
    rates = doc["rates"]
    areas = doc.get("default_floor_area_m2", {})
    rate  = rates.get(build_type) or rates["default"]
    area  = areas.get(build_type) or areas.get("default") or 40
    validated = bool(doc.get("_validated", False))
    return {
        "low":                   round(area * rate["low"]),
        "expected":              round(area * rate["expected"]),
        "high":                  round(area * rate["high"]),
        "assumed_floor_area_m2": area,
        "rate_per_m2_expected":  rate["expected"],
        "rate_source":           rate.get("source", ""),
        "rate_validated":        validated,
        "basis":                 "keyword-inferred type, assumed floor area (Pass 1)",
    }


def _score(build_type: str, application: Dict[str, Any]) -> int:
    s = 40
    s += TYPE_DESIRABILITY.get(build_type, 5)
    if application.get("date_validated"): s += 10
    if application.get("url"):            s += 10
    dl = len(application.get("description", ""))
    if   dl > 120: s += 15
    elif dl > 60:  s += 10
    elif dl > 0:   s += 5
    return max(0, min(100, s))


def _grade(score: int) -> str:
    if score >= 80: return "A"
    if score >= 60: return "B"
    if score >= 40: return "C"
    return "D"


def score_opportunity(application: Dict[str, Any]) -> Dict[str, Any]:
    doc        = _load_rates_doc()
    build_type = infer_build_type(application.get("description", ""))
    value      = _build_value(build_type, doc)
    s          = _score(build_type, application)
    grade      = _grade(s)
    flag = "" if value["rate_validated"] else " [PLACEHOLDER RATES]"
    log.info(
        f"M4: {application.get('application_reference')} — "
        f"{build_type} | {s}/100 ({grade}) | ~£{value['expected']:,}{flag}"
    )
    return {
        "estimated_build_type":  build_type,
        "estimated_build_value": value,
        "opportunity_score":     s,
        "opportunity_grade":     grade,
    }
EOF

# m8_crm.py
cat > "$TARGET/pie_lite/m8_crm.py" << 'EOF'
"""
Module 8 — CRM State Machine.
Valid stages: NEW → CONTACTED → SITE_VISIT → QUOTED → WON | LOST
"""
import logging
from typing import Any, Dict, List

from .store import get_project, set_crm_stage, all_projects

log = logging.getLogger("pie.m8")

STAGES = ["NEW", "CONTACTED", "SITE_VISIT", "QUOTED", "WON", "LOST"]

TRANSITIONS: Dict[str, List[str]] = {
    "NEW":        ["CONTACTED", "LOST"],
    "CONTACTED":  ["SITE_VISIT", "LOST"],
    "SITE_VISIT": ["QUOTED",    "LOST"],
    "QUOTED":     ["WON",       "LOST"],
    "WON":        [],
    "LOST":       [],
}


def advance(reference: str, to_stage: str) -> Dict[str, Any]:
    project = get_project(reference)
    if project is None:
        raise KeyError(f"Project {reference} not found in store")
    current = project.get("crm_stage", "NEW")
    allowed = TRANSITIONS.get(current, [])
    if to_stage not in allowed:
        raise ValueError(
            f"Cannot move {reference} from {current} to {to_stage}. "
            f"Allowed: {allowed or ['(terminal)']}"
        )
    result = set_crm_stage(reference, to_stage)
    log.info(f"M8: {reference} {current} → {to_stage}")
    return result


def summary() -> Dict[str, int]:
    counts = {s: 0 for s in STAGES}
    for p in all_projects():
        stage = p.get("crm_stage", "NEW")
        if stage in counts:
            counts[stage] += 1
    return counts


def conversion_rate() -> Dict[str, Any]:
    projects = all_projects()
    total    = len(projects)
    if total == 0:
        return {"total": 0, "note": "No projects yet"}
    counts = summary()
    won    = counts.get("WON", 0)
    lost   = counts.get("LOST", 0)
    closed = won + lost
    return {
        "total":          total,
        "by_stage":       counts,
        "win_rate":       round(won  / closed * 100, 1) if closed else None,
        "loss_rate":      round(lost / closed * 100, 1) if closed else None,
        "close_rate":     round(closed / total * 100,  1),
        "pipeline_value": sum(
            p.get("estimated_build_value", {}).get("expected", 0) or 0
            for p in projects
            if p.get("crm_stage") not in ("WON", "LOST")
        ),
    }
EOF

# pipeline.py
cat > "$TARGET/pie_lite/pipeline.py" << 'EOF'
"""
PIE Lite — Pass 1 Pipeline.

Run:
    cd ~/idox-scraper
    python3 -m pie_lite.pipeline
"""
import logging
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("pie.pipeline")


def run(csv_path: Path = None) -> None:
    from .m1_approval import load_approved
    from .m4_scoring  import score_opportunity
    from .m8_crm      import summary
    from .store       import get_project, upsert_project, store_path

    if csv_path is None:
        csv_path = Path(__file__).parent.parent / "real_council_leads.csv"

    log.info("=" * 60)
    log.info("PIE Lite — Pass 1 Pipeline")
    log.info("=" * 60)

    try:
        approved = load_approved(csv_path)
    except FileNotFoundError as e:
        log.error(str(e))
        log.error("Run the scraper first:  python3 idox_scraper_v3_final.py")
        sys.exit(1)

    if not approved:
        log.info("No approved applications in CSV — nothing to process.")
        return

    new_count = updated_count = 0

    for app in approved:
        ref      = app["application_reference"]
        existing = get_project(ref)
        scoring  = score_opportunity(app)
        record   = {
            "application_reference": ref,
            "address":               app["address"],
            "borough":               app["borough"],
            "status":                app["status"],
            "description":           app["description"],
            "date_validated":        app["date_validated"],
            "url":                   app["url"],
            **scoring,
        }
        if existing is None:
            record["crm_stage"] = "NEW"
            upsert_project(ref, record)
            new_count += 1
        else:
            record["crm_stage"] = existing.get("crm_stage", "NEW")
            upsert_project(ref, record)
            updated_count += 1

    log.info("=" * 60)
    log.info(f"  Approved found : {len(approved)}")
    log.info(f"  New records    : {new_count}")
    log.info(f"  Updated        : {updated_count}")
    log.info("")
    for stage, count in summary().items():
        log.info(f"  {stage:<12} {count:>3}  {'█' * count}")
    log.info("")
    log.info(f"Store → {store_path()}")
    log.info(
        "Dashboard:\n"
        "    cd ~/idox-scraper && python3 -m http.server 8090\n"
        "    open http://localhost:8090/dashboard.html"
    )
    log.info("=" * 60)


if __name__ == "__main__":
    run()
EOF

success "pie_lite package written (6 files)"

# ── dashboard.html ────────────────────────────────────────────────────────────
info "Writing dashboard.html..."
cat > "$TARGET/dashboard.html" << 'DASHBOARD_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PIE Lite — Accuracy Developments</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --orange:#FF4F00;--dark:#0a0e27;--card:#111630;--border:#1e2444;
  --grey:#a0a4c0;--white:#e8eaf6;--green:#2ecc71;--red:#e74c3c;
  --blue:#3498db;--yellow:#f39c12;
}
body{background:var(--dark);color:var(--white);font-family:'IBM Plex Mono',monospace;min-height:100vh}
nav{background:#07091a;border-bottom:2px solid var(--orange);padding:14px 28px;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:100}
.brand{font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:var(--orange);letter-spacing:1px}
.brand span{color:var(--white);font-weight:400}
.nav-meta{font-size:11px;color:var(--grey);margin-left:auto;display:flex;gap:20px;align-items:center}
#pipeline-value{color:var(--orange);font-weight:700}
.refresh-btn{background:var(--orange);color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700}
.refresh-btn:hover{background:#e04400}
.filters{padding:14px 28px;background:#07091a;border-bottom:1px solid var(--border);display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.filters label{font-size:11px;color:var(--grey)}
.filters select,.filters input{background:var(--card);color:var(--white);border:1px solid var(--border);padding:5px 10px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:11px}
.filter-count{font-size:11px;color:var(--grey);margin-left:auto}
.board{display:flex;gap:0;overflow-x:auto;min-height:calc(100vh - 120px);align-items:flex-start}
.col{flex:0 0 280px;border-right:1px solid var(--border);display:flex;flex-direction:column;min-height:calc(100vh - 120px)}
.col-header{padding:14px 16px;background:#07091a;border-bottom:1px solid var(--border);position:sticky;top:61px;z-index:10}
.col-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;display:flex;align-items:center;gap:8px}
.col-count{background:var(--border);color:var(--grey);border-radius:10px;padding:2px 8px;font-size:10px}
.col-value{font-size:10px;color:var(--grey);margin-top:4px}
.col-body{padding:10px;flex:1;overflow-y:auto}
.col[data-stage="NEW"]       .col-title{color:#7c83ff}
.col[data-stage="CONTACTED"] .col-title{color:var(--blue)}
.col[data-stage="SITE_VISIT"].col-title{color:var(--yellow)}
.col[data-stage="QUOTED"]    .col-title{color:var(--orange)}
.col[data-stage="WON"]       .col-title{color:var(--green)}
.col[data-stage="LOST"]      .col-title{color:var(--red)}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:10px;transition:border-color .15s}
.card:hover{border-color:var(--orange)}
.card-ref{font-size:11px;color:var(--orange);font-weight:700;margin-bottom:4px}
.card-addr{font-size:12px;color:var(--white);margin-bottom:3px;line-height:1.4}
.card-borough{font-size:10px;color:var(--grey);margin-bottom:8px}
.card-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.badge{font-size:10px;padding:2px 8px;border-radius:3px;font-weight:700}
.badge-grade-A{background:#2ecc71;color:#000}
.badge-grade-B{background:#3498db;color:#fff}
.badge-grade-C{background:#f39c12;color:#000}
.badge-grade-D{background:#e74c3c;color:#fff}
.badge-type{background:var(--border);color:var(--grey)}
.badge-placeholder{background:#2a1505;color:#f39c12;border:1px solid #f39c12}
.card-value{font-size:12px;margin-bottom:10px}
.card-value .expected{color:var(--orange);font-weight:700}
.card-value .range{color:var(--grey);font-size:10px}
.card-desc{font-size:10px;color:var(--grey);margin-bottom:10px;line-height:1.5;max-height:48px;overflow:hidden}
.card-actions{display:flex;flex-wrap:wrap;gap:5px}
.action-btn{font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 9px;border-radius:4px;cursor:pointer;font-weight:700;border:1px solid}
.btn-CONTACTED{background:#1a2a3a;color:var(--blue);border-color:var(--blue)}.btn-CONTACTED:hover{background:var(--blue);color:#fff}
.btn-SITE_VISIT{background:#1a1a05;color:var(--yellow);border-color:var(--yellow)}.btn-SITE_VISIT:hover{background:var(--yellow);color:#000}
.btn-QUOTED{background:#1a0f05;color:var(--orange);border-color:var(--orange)}.btn-QUOTED:hover{background:var(--orange);color:#fff}
.btn-WON{background:#051a0f;color:var(--green);border-color:var(--green)}.btn-WON:hover{background:var(--green);color:#000}
.btn-LOST{background:#1a0505;color:var(--red);border-color:var(--red)}.btn-LOST:hover{background:var(--red);color:#fff}
.btn-VIEW{background:var(--border);color:var(--grey);border-color:var(--border)}.btn-VIEW:hover{border-color:var(--grey);color:var(--white)}
.empty-col{text-align:center;color:var(--border);font-size:11px;padding:30px 10px}
#toast{position:fixed;bottom:24px;right:24px;background:#1a2a1a;color:var(--green);border:1px solid var(--green);padding:10px 18px;border-radius:6px;font-size:12px;opacity:0;transition:opacity .3s;z-index:999;pointer-events:none}
#toast.show{opacity:1}
#toast.error{background:#2a1a1a;color:var(--red);border-color:var(--red)}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;display:none;align-items:center;justify-content:center}
.modal-bg.open{display:flex}
.modal{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:28px;max-width:600px;width:90%;max-height:85vh;overflow-y:auto}
.modal h2{font-family:'Syne',sans-serif;color:var(--orange);font-size:18px;margin-bottom:16px}
.modal-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px}
.modal-row .k{color:var(--grey)}
.modal-row .v{color:var(--white);text-align:right;max-width:60%;word-break:break-word}
.modal-close{margin-top:18px;background:var(--border);color:var(--grey);border:none;padding:8px 18px;border-radius:4px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:12px}
.modal-close:hover{color:var(--white)}
</style>
</head>
<body>
<nav>
  <div class="brand">PIE <span>Lite</span></div>
  <div style="font-size:10px;color:var(--grey)">Accuracy Developments Ltd</div>
  <div class="nav-meta">
    <span>Pipeline: <span id="pipeline-value">£—</span></span>
    <span id="total-count" style="color:var(--grey)">0 opportunities</span>
    <button class="refresh-btn" onclick="loadData()">↻ Refresh</button>
  </div>
</nav>
<div class="filters">
  <label>Borough: <select id="filter-borough" onchange="applyFilters()"><option value="">All</option></select></label>
  <label>Grade: <select id="filter-grade" onchange="applyFilters()"><option value="">All</option><option>A</option><option>B</option><option>C</option><option>D</option></select></label>
  <label>Type: <select id="filter-type" onchange="applyFilters()"><option value="">All</option></select></label>
  <label>Search: <input id="filter-search" type="text" placeholder="ref / address…" oninput="applyFilters()" style="width:180px"></label>
  <span class="filter-count" id="filter-count"></span>
</div>
<div class="board" id="board"></div>
<div id="toast"></div>
<div class="modal-bg" id="modal-bg" onclick="closeModal(event)">
  <div class="modal" id="modal-content"></div>
</div>
<script>
const STAGES=[
  {id:"NEW",label:"New Approvals"},{id:"CONTACTED",label:"Contacted"},
  {id:"SITE_VISIT",label:"Site Visit"},{id:"QUOTED",label:"Quoted"},
  {id:"WON",label:"Won"},{id:"LOST",label:"Lost"}
];
const NEXT={NEW:["CONTACTED","LOST"],CONTACTED:["SITE_VISIT","LOST"],SITE_VISIT:["QUOTED","LOST"],QUOTED:["WON","LOST"],WON:[],LOST:[]};
const BTN_LABEL={CONTACTED:"Mark Contacted",SITE_VISIT:"Book Site Visit",QUOTED:"Issue Quote",WON:"Mark Won",LOST:"Mark Lost"};
let ALL=[],FILTERED=[];

async function loadData(){
  try{
    const r=await fetch("projects.json?t="+Date.now());
    if(!r.ok)throw new Error("HTTP "+r.status);
    const d=await r.json();
    ALL=Object.values(d.projects||{});
    populateFilters();applyFilters();updatePipelineValue();
  }catch(e){toast("Cannot load projects.json — "+e.message,true);}
}

function populateFilters(){
  const bs=[...new Set(ALL.map(p=>p.borough).filter(Boolean))].sort();
  const ts=[...new Set(ALL.map(p=>p.estimated_build_type).filter(Boolean))].sort();
  const bSel=document.getElementById("filter-borough");
  const tSel=document.getElementById("filter-type");
  const bv=bSel.value,tv=tSel.value;
  bSel.innerHTML='<option value="">All</option>'+bs.map(b=>`<option>${b}</option>`).join("");
  tSel.innerHTML='<option value="">All</option>'+ts.map(t=>`<option>${t}</option>`).join("");
  bSel.value=bv;tSel.value=tv;
}

function applyFilters(){
  const b=document.getElementById("filter-borough").value;
  const g=document.getElementById("filter-grade").value;
  const t=document.getElementById("filter-type").value;
  const s=document.getElementById("filter-search").value.toLowerCase();
  FILTERED=ALL.filter(p=>{
    if(b&&p.borough!==b)return false;
    if(g&&p.opportunity_grade!==g)return false;
    if(t&&p.estimated_build_type!==t)return false;
    if(s&&!JSON.stringify(p).toLowerCase().includes(s))return false;
    return true;
  });
  document.getElementById("filter-count").textContent=
    FILTERED.length===ALL.length?`${ALL.length} records`:`${FILTERED.length} of ${ALL.length}`;
  renderBoard();
}

function updatePipelineValue(){
  const active=["NEW","CONTACTED","SITE_VISIT","QUOTED"];
  const total=ALL.filter(p=>active.includes(p.crm_stage))
    .reduce((s,p)=>s+((p.estimated_build_value||{}).expected||0),0);
  document.getElementById("pipeline-value").textContent=total?"£"+total.toLocaleString():"£—";
  document.getElementById("total-count").textContent=ALL.length+" opportunities";
}

function fc(v){if(!v&&v!==0)return"—";return"£"+Number(v).toLocaleString();}
function ft(t){return(t||"—").replace(/_/g," ");}

function renderBoard(){
  const board=document.getElementById("board");
  board.innerHTML="";
  STAGES.forEach(({id,label})=>{
    const cards=FILTERED.filter(p=>(p.crm_stage||"NEW")===id);
    const colVal=cards.reduce((s,p)=>s+((p.estimated_build_value||{}).expected||0),0);
    const col=document.createElement("div");
    col.className="col";col.dataset.stage=id;
    const body=document.createElement("div");
    body.className="col-body";body.id="col-"+id;
    if(!cards.length){body.innerHTML='<div class="empty-col">No opportunities</div>';}
    else{cards.sort((a,b)=>(b.opportunity_score||0)-(a.opportunity_score||0)).forEach(p=>body.appendChild(buildCard(p)));}
    col.innerHTML=`<div class="col-header"><div class="col-title">${label}<span class="col-count">${cards.length}</span></div>${colVal?`<div class="col-value">~${fc(colVal)}</div>`:""}</div>`;
    col.appendChild(body);board.appendChild(col);
  });
}

function buildCard(p){
  const card=document.createElement("div");
  card.className="card";card.dataset.ref=p.reference;
  const grade=p.opportunity_grade||"D";
  const bv=p.estimated_build_value||{};
  const ph=bv.rate_source&&bv.rate_source.includes("PLACEHOLDER");
  const next=(NEXT[p.crm_stage||"NEW"]||[]);
  const actions=next.map(s=>`<button class="action-btn btn-${s}" onclick="moveStage('${p.reference}','${s}')">${BTN_LABEL[s]||s}</button>`).join("");
  card.innerHTML=`
    <div class="card-ref">${p.reference}</div>
    <div class="card-addr">${p.address||"—"}</div>
    <div class="card-borough">${p.borough||""}${p.date_validated?" · "+p.date_validated:""}</div>
    <div class="card-meta">
      <span class="badge badge-grade-${grade}">${grade} ${p.opportunity_score||0}</span>
      <span class="badge badge-type">${ft(p.estimated_build_type)}</span>
      ${ph?'<span class="badge badge-placeholder">⚠ PLACEHOLDER RATES</span>':""}
    </div>
    <div class="card-value"><span class="expected">${fc(bv.expected)}</span>${bv.low&&bv.high?`<span class="range"> (${fc(bv.low)} – ${fc(bv.high)})</span>`:""}</div>
    <div class="card-desc">${p.description||""}</div>
    <div class="card-actions"><button class="action-btn btn-VIEW" onclick="showDetail('${p.reference}')">View</button>${actions}</div>`;
  return card;
}

async function moveStage(ref,stage){
  try{
    const r=await fetch(`/crm/${encodeURIComponent(ref)}/${stage}`,{method:"POST"});
    if(!r.ok)throw new Error(await r.text());
    toast(ref+" → "+stage);await loadData();
  }catch(e){
    const p=ALL.find(x=>x.reference===ref);
    if(p){
      p.crm_stage=stage;p.last_updated=new Date().toISOString().slice(0,19);
      (p.crm_history=p.crm_history||[]).push({stage,timestamp:p.last_updated});
      toast(ref+" → "+stage+" (local — re-run pipeline to persist)");
      applyFilters();updatePipelineValue();
    }
  }
}

function showDetail(ref){
  const p=ALL.find(x=>x.reference===ref);if(!p)return;
  const bv=p.estimated_build_value||{};
  const rows=[
    ["Reference",p.reference],["Address",p.address],["Borough",p.borough],
    ["Status",p.status],["Date Validated",p.date_validated],
    ["Build Type",ft(p.estimated_build_type)],
    ["Floor Area (assumed)",bv.assumed_floor_area_m2?bv.assumed_floor_area_m2+"m²":"—"],
    ["Build Low",fc(bv.low)],["Build Expected",fc(bv.expected)],["Build High",fc(bv.high)],
    ["Rate/m² Expected",bv.rate_per_m2_expected?"£"+bv.rate_per_m2_expected:"—"],
    ["Rate Source",bv.rate_source||"—"],
    ["Rate Validated",bv.rate_validated?"✓ Yes":"✗ No — PLACEHOLDER"],
    ["Score",(p.opportunity_score||0)+"/100 (Grade "+(p.opportunity_grade||"D")+")"],
    ["CRM Stage",p.crm_stage||"NEW"],["Created",p.created_at],["Last Updated",p.last_updated],
    ["Portal URL",p.url?`<a href="${p.url}" target="_blank" style="color:var(--orange)">${p.url}</a>`:"—"],
    ["Description",p.description],
  ];
  const modal=document.getElementById("modal-content");
  modal.innerHTML=`<h2>${p.reference}</h2>`
    +rows.map(([k,v])=>`<div class="modal-row"><span class="k">${k}</span><span class="v">${v||"—"}</span></div>`).join("")
    +((p.crm_history||[]).length?`<h2 style="margin-top:20px;font-size:14px">CRM History</h2>`
      +p.crm_history.map(h=>`<div class="modal-row"><span class="k">${h.stage}</span><span class="v">${h.timestamp}</span></div>`).join(""):"")
    +`<button class="modal-close" onclick="closeModal()">Close</button>`;
  document.getElementById("modal-bg").classList.add("open");
}

function closeModal(e){if(!e||e.target.id==="modal-bg")document.getElementById("modal-bg").classList.remove("open");}
function toast(msg,isError=false){
  const t=document.getElementById("toast");t.textContent=msg;
  t.className="show"+(isError?" error":"");
  clearTimeout(t._t);t._t=setTimeout(()=>t.className="",3000);
}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
loadData();
setInterval(loadData,60000);
</script>
</body>
</html>
DASHBOARD_EOF
success "dashboard.html written"

# ── Patch run_daily.py to call pipeline ──────────────────────────────────────
info "Patching run_daily.py to call PIE Lite pipeline after scrape..."
if ! grep -q "pie_lite" "$TARGET/run_daily.py"; then
  python3 - << 'PATCHEOF'
import re, pathlib, os
p = pathlib.Path(os.path.expanduser('~/idox-scraper/run_daily.py'))
txt = p.read_text()
inject = '''
    # PIE Lite Pass 1: convert approvals to opportunities
    try:
        import sys as _sys
        _sys.path.insert(0, str(SCRIPT_DIR))
        from pie_lite.pipeline import run as pie_run
        pie_run()
    except Exception as _e:
        log.warning(f"PIE Lite pipeline warning: {_e}")
'''
txt2 = txt.replace(
    '    email_ok = send_email(success, output, count)',
    inject + '    email_ok = send_email(success, output, count)',
    1
)
p.write_text(txt2)
print("Patched")
PATCHEOF
  success "run_daily.py patched"
else
  warn "run_daily.py already references pie_lite — skipping patch"
fi

# ── Final structure ───────────────────────────────────────────────────────────
echo ""
info "Final file structure:"
echo ""
echo "  ~/idox-scraper/"
echo "  ├── idox_scraper_v3_final.py    (scraper — UNCHANGED)"
echo "  ├── run_daily.py                (patched: calls pie_lite.pipeline)"
echo "  ├── dashboard.html              (NEW — kanban CRM dashboard)"
echo "  ├── projects.json               (created on first pipeline run)"
echo "  ├── real_council_leads.csv      (scraper output)"
echo "  ├── pie_lite/"
echo "  │   ├── __init__.py"
echo "  │   ├── store.py                (JSON store, atomic writes)"
echo "  │   ├── m1_approval.py          (CSV → approved filter)"
echo "  │   ├── m4_scoring.py           (build type inference + scoring)"
echo "  │   ├── m8_crm.py               (state machine + analytics)"
echo "  │   ├── pipeline.py             (M1→M4→M8 orchestrator)"
echo "  │   └── config/"
echo "  │       └── build_rates.json    (PLACEHOLDER rates — fill in)"
echo "  ├── seen_refs.json"
echo "  ├── venv/"
echo "  └── logs/"
echo ""

# ── Run pipeline now ──────────────────────────────────────────────────────────
echo ""
info "Running pipeline against real_council_leads.csv..."
echo ""
cd "$TARGET"
if [[ -f "real_council_leads.csv" ]]; then
  "$VENV_PY" -m pie_lite.pipeline
else
  warn "real_council_leads.csv not found — run the scraper first:"
  warn "  cd ~/idox-scraper && ./venv/bin/python3 idox_scraper_v3_final.py"
fi

echo ""
echo -e "${BOLD}======================================================================"
echo "  PIE Lite Pass 1 — Installed"
echo "======================================================================"
echo -e "${NC}"
echo "  Run pipeline:    cd ~/idox-scraper && ./venv/bin/python3 -m pie_lite.pipeline"
echo ""
echo "  Open dashboard:"
echo "    cd ~/idox-scraper && python3 -m http.server 8090"
echo "    open http://localhost:8090/dashboard.html"
echo ""
echo -e "${YELLOW}  Next: edit pie_lite/config/build_rates.json"
echo -e "  Replace every PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION value"
echo -e "  with Accuracy's actual £/m² figures, then set _validated to true.${NC}"
echo ""
