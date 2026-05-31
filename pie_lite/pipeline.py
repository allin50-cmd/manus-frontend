import os
import sys
import json
import urllib.request
from dataclasses import asdict

from .crm import process_new_leads
from .config import VERCEL_API_URL


def _push_leads(leads):
    """POST scored leads to the Vercel API ingest endpoint."""
    payload = [
        {
            "ref": d["ref"],
            "address": d["address"],
            "description": d["description"],
            "source": d["source"],
            "date_scraped": d["date_scraped"],
        }
        for d in (asdict(lead) for lead in leads)
    ]

    url = f"{VERCEL_API_URL}/api/pie/ingest"
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    admin_key = os.environ.get("ADMIN_API_KEY", "")
    if admin_key:
        headers["x-admin-key"] = admin_key

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            print(f"Push complete: {result.get('ingested', 0)} ingested, {result.get('skipped', 0)} skipped.")
    except urllib.error.HTTPError as e:
        print(f"Push failed — HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"Push failed: {exc}", file=sys.stderr)
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m pie_lite.pipeline [process|push|start]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "process":
        print("Processing new leads...")
        try:
            new = process_new_leads()
        except FileNotFoundError as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
        print(f"Added {len(new)} new leads.")
    elif command == "push":
        print("Processing new leads...")
        try:
            new = process_new_leads()
        except FileNotFoundError as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
        print(f"Scored {len(new)} new leads. Pushing to Vercel API...")
        if new:
            _push_leads(new)
        else:
            print("Nothing new to push.")
    elif command == "start":
        print("Processing new leads...")
        try:
            new = process_new_leads()
        except FileNotFoundError as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
        print(f"Added {len(new)} new leads.")
        if new:
            print("Pushing to Vercel API...")
            _push_leads(new)
    else:
        print(f"Unknown command: {command!r}")
        print("Usage: python -m pie_lite.pipeline [process|push|start]")
        sys.exit(1)


if __name__ == "__main__":
    main()
