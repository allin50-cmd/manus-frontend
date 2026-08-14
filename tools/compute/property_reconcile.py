#!/usr/bin/env python3
import argparse
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256(value: Any) -> str:
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def parse_date(value: str | None):
    if not value:
        return None
    text = value.replace("Z", "+00:00")
    dt = datetime.fromisoformat(text)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def duplicate_source_ids(rows: list[dict]) -> list[str]:
    ids = [str(r.get("sourceId")) for r in rows if r.get("sourceId") not in (None, "")]
    return sorted(k for k, v in Counter(ids).items() if v > 1)


def analyse(payload: dict, now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    properties = payload.get("properties", [])
    tenancies = payload.get("tenancies", [])
    certificates = payload.get("certificates", [])
    maintenance = payload.get("maintenance", [])

    property_ids = {str(p.get("sourceId")) for p in properties if p.get("sourceId")}

    def orphans(rows: list[dict]) -> list[str]:
        out = []
        for row in rows:
            parent = str(row.get("propertySourceId") or "")
            if parent and parent not in property_ids:
                out.append(str(row.get("sourceId") or "unknown"))
        return sorted(out)

    active_tenancies = [t for t in tenancies if str(t.get("status", "Active")).lower() == "active"]
    monthly_rent_pence = sum(int(t.get("monthlyRentPence") or 0) for t in active_tenancies)

    expired = []
    expiring_30 = []
    for cert in certificates:
        expiry = parse_date(cert.get("expiresAt"))
        if not expiry:
            continue
        days = (expiry - now).days
        item = {
            "sourceId": cert.get("sourceId"),
            "propertySourceId": cert.get("propertySourceId"),
            "type": cert.get("certificateType"),
            "expiresAt": expiry.isoformat().replace("+00:00", "Z"),
            "daysRemaining": days,
        }
        if days < 0:
            expired.append(item)
        elif days <= 30:
            expiring_30.append(item)

    urgent_open = [
        {
            "sourceId": j.get("sourceId"),
            "propertySourceId": j.get("propertySourceId"),
            "title": j.get("title"),
            "priority": j.get("priority"),
            "status": j.get("status"),
        }
        for j in maintenance
        if str(j.get("status", "Open")).lower() not in {"completed", "closed", "cancelled"}
        and str(j.get("priority", "Medium")).lower() in {"high", "urgent"}
    ]

    duplicates = {
        "properties": duplicate_source_ids(properties),
        "tenancies": duplicate_source_ids(tenancies),
        "certificates": duplicate_source_ids(certificates),
        "maintenance": duplicate_source_ids(maintenance),
    }
    orphan_map = {
        "tenancies": orphans(tenancies),
        "certificates": orphans(certificates),
        "maintenance": orphans(maintenance),
    }

    issues = []
    if any(duplicates.values()):
        issues.append("duplicate_source_ids")
    if any(orphan_map.values()):
        issues.append("orphaned_property_relations")
    if expired:
        issues.append("expired_certificates")
    if expiring_30:
        issues.append("certificates_expiring_within_30_days")
    if urgent_open:
        issues.append("high_priority_open_maintenance")

    result = {
        "asOf": now.isoformat().replace("+00:00", "Z"),
        "counts": {
            "properties": len(properties),
            "tenancies": len(tenancies),
            "activeTenancies": len(active_tenancies),
            "certificates": len(certificates),
            "maintenance": len(maintenance),
        },
        "financials": {
            "activeMonthlyRentPence": monthly_rent_pence,
            "activeMonthlyRentGBP": round(monthly_rent_pence / 100, 2),
            "annualisedRentGBP": round(monthly_rent_pence * 12 / 100, 2),
        },
        "compliance": {
            "expired": expired,
            "expiringWithin30Days": expiring_30,
        },
        "maintenance": {"highPriorityOpen": urgent_open},
        "dataQuality": {"duplicates": duplicates, "orphans": orphan_map},
        "issues": issues,
        "status": "PASS" if not issues else "REVIEW_REQUIRED",
    }

    return {
        "receiptVersion": "ultracore.compute.v0.1",
        "engine": "property-reconcile-python",
        "inputHash": sha256(payload),
        "resultHash": sha256(result),
        "result": result,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Reconcile a property portfolio export and emit a hashed evidence receipt.")
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--as-of", help="ISO timestamp for deterministic runs")
    args = parser.parse_args()

    payload = json.loads(args.input.read_text(encoding="utf-8"))
    now = parse_date(args.as_of) if args.as_of else None
    receipt = analyse(payload, now=now)
    text = json.dumps(receipt, indent=2, sort_keys=True)
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
