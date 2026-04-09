"""
FineGuard Pro — Company Research Agent
=======================================
Automates GDPR/PECR contact route research for prospect companies.

SOP steps covered:
  2 & 3 — Find official site, extract contact routes (email, phone, form)
  4     — Capture evidence screenshot per domain
  5     — Filter personal emails; keep only generic prefixes
  6     — Classify compliance status (OK corporate route / Review required)

Usage
-----
  # Install dependencies (once):
  pip install playwright
  playwright install chromium

  # Run with the built-in example list:
  python scripts/company-research.py

  # Run against a custom CSV (company_name, website columns):
  python scripts/company-research.py --input prospects.csv

Output
------
  fineguard_research_results.csv  — one row per company
  evidence_<CompanyName>.png      — full-page screenshot per domain
"""

import re
import asyncio
import csv
import argparse
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright, Browser

# ---------------------------------------------------------------------------
# SOP settings
# ---------------------------------------------------------------------------

GENERIC_PREFIXES = [
    'info', 'hello', 'admin', 'support', 'sales',
    'accounts', 'contact', 'enquiries',
]

OUTPUT_FILE = "fineguard_research_results.csv"

FIELDNAMES = [
    "company_name",
    "website",
    "contact_page_url",
    "generic_email",
    "main_phone",
    "contact_form_available",
    "notes_public_source",
    "evidence_url_1",
    "last_checked_date",
    "checked_by",
    "gdpr_pecr_status",
    "do_not_contact",
    "next_action",
]

# ---------------------------------------------------------------------------
# Pure extraction / classification helpers
# ---------------------------------------------------------------------------

_EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
_PHONE_RE = re.compile(r'(?:\+44|0)[\d\s]{9,13}')
_FORM_RE  = re.compile(r'type=["\']submit["\']|<form[\s>]', re.IGNORECASE)


def extract_basic_info(html: str) -> tuple[list[str], list[str], bool]:
    """Return (emails, phones, has_contact_form) from raw HTML."""
    emails    = list(dict.fromkeys(_EMAIL_RE.findall(html)))   # preserve order, dedupe
    phones    = list(dict.fromkeys(_PHONE_RE.findall(html)))
    has_form  = bool(_FORM_RE.search(html))
    return emails, phones, has_form


def classify_email(emails: list[str]) -> tuple[str | None, int]:
    """
    SOP steps 3 & 5: split generic vs personal addresses.

    Returns (first_generic_email_or_None, personal_count).
    """
    generics  = [e for e in emails if e.split('@')[0].lower() in GENERIC_PREFIXES]
    personals = [e for e in emails if e not in generics]
    return (generics[0] if generics else None), len(personals)


def build_contact_url(base_url: str) -> str:
    """Try /contact first; caller falls back to base_url on 404."""
    base = base_url.rstrip('/')
    return f"{base}/contact"

# ---------------------------------------------------------------------------
# Per-company researcher
# ---------------------------------------------------------------------------

async def research_company(browser: Browser, company_name: str, url: str) -> dict:
    """Navigate to the company website, extract contacts, screenshot as evidence."""
    page = await browser.new_page()

    result: dict = {k: "" for k in FIELDNAMES}
    result.update({
        "company_name":    company_name,
        "website":         url,
        "last_checked_date": datetime.now().strftime("%Y-%m-%d"),
        "checked_by":      "FG_AUTO_AGENT",
        "do_not_contact":  "No",
    })

    try:
        # ── Step 2 & 3: load site, try /contact page first ──────────────────
        contact_url = build_contact_url(url)
        try:
            response = await page.goto(contact_url, wait_until="networkidle", timeout=20_000)
            active_url = contact_url if (response and response.ok) else url
        except Exception:
            await page.goto(url, wait_until="networkidle", timeout=30_000)
            active_url = url

        result["contact_page_url"] = active_url
        content = await page.content()

        emails, phones, has_form = extract_basic_info(content)
        generic_email, personal_count = classify_email(emails)

        # ── Step 4: evidence screenshot ──────────────────────────────────────
        safe_name     = re.sub(r'[^\w]', '_', company_name)
        screenshot    = f"evidence_{safe_name}.png"
        await page.screenshot(path=screenshot, full_page=True)

        # ── Step 6: compliance classification ───────────────────────────────
        if generic_email:
            status      = "OK corporate route"
            next_action = "Approved"
        elif has_form:
            status      = "OK corporate route (form only)"
            next_action = "Approved — use contact form"
        else:
            status      = "Review required"
            next_action = "Manual Review Required"

        result.update({
            "generic_email":         generic_email or "",
            "main_phone":            phones[0] if phones else "None Found",
            "contact_form_available": "Yes" if has_form else "No",
            "evidence_url_1":        active_url,
            "gdpr_pecr_status":      status,
            "notes_public_source":   (
                f"Found {len(emails)} email(s) total; "
                f"{personal_count} personal address(es) excluded."
            ),
            "next_action": next_action,
        })

    except Exception as exc:
        result["notes_public_source"] = f"Error: {exc}"
        result["gdpr_pecr_status"]    = "Review required"
        result["next_action"]         = "Manual Review Required"

    finally:
        await page.close()

    return result

# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------

async def run(company_list: list[tuple[str, str]]) -> None:
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        results: list[dict] = []
        for name, url in company_list:
            print(f"  Researching: {name} ({url})")
            data = await research_company(browser, name, url)
            results.append(data)
            status = data.get("gdpr_pecr_status", "?")
            print(f"    → {status}")

        await browser.close()

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(results)

    print(f"\nDone. {len(results)} record(s) written to {OUTPUT_FILE}")


def load_csv_input(path: str) -> list[tuple[str, str]]:
    """Read a CSV with at least 'company_name' and 'website' columns."""
    rows = []
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            name = row.get("company_name", "").strip()
            url  = row.get("website", "").strip()
            if name and url:
                rows.append((name, url))
    if not rows:
        raise ValueError(f"No valid rows found in {path} (need 'company_name' and 'website' columns)")
    return rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="FineGuard Pro company research agent")
    parser.add_argument(
        "--input", "-i",
        metavar="CSV",
        help="Path to input CSV with 'company_name' and 'website' columns",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    if args.input:
        companies = load_csv_input(args.input)
        print(f"Loaded {len(companies)} companies from {args.input}")
    else:
        # Built-in example list — replace or pass --input to use your own
        companies = [
            ("Example Corp",   "https://example.com"),
            ("FineGuard Test", "https://www.google.com"),
        ]
        print("Using built-in example list (pass --input <file.csv> to use your own)")

    print(f"Starting research for {len(companies)} company/companies...\n")
    asyncio.run(run(companies))
