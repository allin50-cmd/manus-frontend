"""
Azure Timer Function: dispatch_alerts
Schedule: 06:00 UTC daily  (cron: "0 0 6 * * *")

Scans every actively-monitored company, fetches its live deadline data from the
Companies House REST API, and fires outbound webhooks + emails for every crossed
alert window (60 / 30 / 14 / 7 days before due date) that has not already been
dispatched.

Environment variables required:
    DATABASE_URL                  PostgreSQL connection string (postgres://...)
    COMPANIES_HOUSE_API_KEY       Companies House REST API key
    FINEGUARD_API_BASE_URL        Base URL of the Next.js app (https://...)
    FINEGUARD_API_KEY             Internal API key (same as INTERNAL_API_KEY in app)

Optional:
    AZURE_COMMUNICATION_ENDPOINT  ACS endpoint for direct email fallback
    AZURE_COMMUNICATION_KEY       ACS access key
    EMAIL_SENDER_ADDRESS          ACS sender address
"""

import logging
import os
import json
import hashlib
import hmac
import base64
import datetime
from typing import Optional

import azure.functions as func
import psycopg2
import psycopg2.extras
import requests

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

ALERT_WINDOWS = [60, 30, 14, 7]  # days before deadline

URGENCY = {60: "low", 30: "medium", 14: "urgent", 7: "urgent"}

ALERT_LABELS = {
    "accounts_filing": "Accounts Filing",
    "confirmation_statement": "Confirmation Statement",
    "strike_off": "Strike-Off Notice",
}

CH_BASE = "https://api.company-information.service.gov.uk"


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_db():
    """Return a psycopg2 connection using DATABASE_URL."""
    url = os.environ["DATABASE_URL"]
    return psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)


def days_until(date_str: str) -> int:
    """Calendar days from today until date_str (YYYY-MM-DD). Negative = overdue."""
    due = datetime.date.fromisoformat(date_str)
    return (due - datetime.date.today()).days


def activated_windows(days_left: int) -> list[int]:
    """Return every alert window threshold that days_left has crossed."""
    return [w for w in ALERT_WINDOWS if days_left <= w]


def build_message(alert_label: str, days_left: int, due_date: str) -> str:
    from datetime import date
    d = datetime.date.fromisoformat(due_date).strftime("%-d %b %Y")
    if days_left < 0:
        n = abs(days_left)
        return f"{alert_label} is overdue by {n} day{'s' if n != 1 else ''} (was due {d}). File immediately."
    if days_left == 0:
        return f"{alert_label} is due today ({d}). File now to avoid a penalty."
    return f"{alert_label} is due in {days_left} day{'s' if days_left != 1 else ''} ({d})."


# ── Companies House API ───────────────────────────────────────────────────────

def get_company_profile(company_number: str, api_key: str) -> Optional[dict]:
    url = f"{CH_BASE}/company/{company_number}"
    resp = requests.get(url, auth=(api_key, ""), timeout=10)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()


def profile_to_deadlines(profile: dict, active_alerts: list[str]) -> list[dict]:
    deadlines = []

    if "accounts_filing" in active_alerts:
        due_on = (
            profile.get("accounts", {})
            .get("next_accounts", {})
            .get("due_on")
        )
        if due_on:
            deadlines.append({
                "alert_type": "accounts_filing",
                "due_date": due_on,
                "days_left": days_until(due_on),
            })

    if "confirmation_statement" in active_alerts:
        next_due = (
            profile.get("confirmation_statement", {})
            .get("next_due")
        )
        if next_due:
            deadlines.append({
                "alert_type": "confirmation_statement",
                "due_date": next_due,
                "days_left": days_until(next_due),
            })

    if "strike_off" in active_alerts and profile.get("company_status") != "active":
        today = datetime.date.today().isoformat()
        deadlines.append({
            "alert_type": "strike_off",
            "due_date": today,
            "days_left": 0,
        })

    return deadlines


# ── Deduplication ─────────────────────────────────────────────────────────────

def insert_dispatch_if_new(conn, dedupe_key: str, company_number: str,
                           alert_type: str, due_date: str, window_days: int) -> bool:
    """Insert dispatch record; return True if new, False if duplicate."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO dispatched_notifications
                (id, dedupe_key, company_number, alert_type, due_date, window_days, dispatched_at)
            VALUES
                (gen_random_uuid(), %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (dedupe_key) DO NOTHING
            RETURNING id
            """,
            (dedupe_key, company_number, alert_type, due_date, window_days),
        )
        row = cur.fetchone()
        conn.commit()
        return row is not None


# ── Outbound webhooks ─────────────────────────────────────────────────────────

def fire_webhooks(conn, event: str, payload: dict) -> dict:
    """POST payload to every registered webhook for the event."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, url FROM webhook_subscriptions WHERE event = %s",
            (event,),
        )
        hooks = cur.fetchall()

    if not hooks:
        return {"total": 0, "delivered": 0, "failed": 0}

    delivered = 0
    failed = 0
    for hook in hooks:
        try:
            resp = requests.post(
                hook["url"],
                json=payload,
                timeout=10,
                headers={"Content-Type": "application/json"},
            )
            if resp.ok:
                delivered += 1
            else:
                logger.warning("Webhook %s returned HTTP %d", hook["id"], resp.status_code)
                failed += 1
        except Exception as exc:
            logger.error("Webhook %s failed: %s", hook["id"], exc)
            failed += 1

    return {"total": len(hooks), "delivered": delivered, "failed": failed}


# ── Azure Email (optional fallback) ──────────────────────────────────────────

def _sign_acs(method: str, url: str, body: str, key: str) -> dict:
    from urllib.parse import urlparse
    import hashlib, hmac, base64
    parsed = urlparse(url)
    content_hash = base64.b64encode(
        hashlib.sha256(body.encode()).digest()
    ).decode()
    utc_now = datetime.datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")
    path_and_query = parsed.path + (f"?{parsed.query}" if parsed.query else "")
    string_to_sign = f"{method.upper()}\n{path_and_query}\n{utc_now};{parsed.netloc};{content_hash}"
    sig = base64.b64encode(
        hmac.new(base64.b64decode(key), string_to_sign.encode(), hashlib.sha256).digest()
    ).decode()
    return {
        "x-ms-date": utc_now,
        "x-ms-content-sha256": content_hash,
        "Authorization": (
            f"HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature={sig}"
        ),
    }


def send_email_acs(to_address: str, subject: str, html_body: str, text_body: str = "") -> bool:
    endpoint = os.environ.get("AZURE_COMMUNICATION_ENDPOINT")
    key = os.environ.get("AZURE_COMMUNICATION_KEY")
    sender = os.environ.get("EMAIL_SENDER_ADDRESS")
    if not (endpoint and key and sender):
        return False

    url = f"{endpoint}/emails:send?api-version=2023-03-31"
    body = json.dumps({
        "senderAddress": sender,
        "recipients": {"to": [{"address": to_address}]},
        "content": {"subject": subject, "html": html_body, "plainText": text_body},
    })
    auth_headers = _sign_acs("POST", url, body, key)
    try:
        resp = requests.post(
            url,
            data=body,
            headers={"Content-Type": "application/json", **auth_headers},
            timeout=15,
        )
        return resp.status_code in (200, 202)
    except Exception as exc:
        logger.error("ACS email failed: %s", exc)
        return False


# ── Main function ─────────────────────────────────────────────────────────────

def main(timer: func.TimerRequest) -> None:
    run_at = datetime.datetime.utcnow().isoformat()
    logger.info("[dispatch_alerts] Run started at %s", run_at)

    ch_key = os.environ.get("COMPANIES_HOUSE_API_KEY", "")
    if not ch_key:
        logger.error("[dispatch_alerts] COMPANIES_HOUSE_API_KEY not set — aborting")
        return

    conn = get_db()
    try:
        _run(conn, ch_key)
    finally:
        conn.close()

    logger.info("[dispatch_alerts] Run complete")


def _run(conn, ch_key: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT mc.company_number, mc.company_name,
                   ARRAY_AGG(DISTINCT ca.alert_type) AS active_alerts
            FROM monitored_companies mc
            JOIN compliance_alerts ca ON ca.company_number = mc.company_number
            WHERE mc.billing_status = 'active'
            GROUP BY mc.company_number, mc.company_name
            """
        )
        companies = cur.fetchall()

    total_fired = 0
    total_skipped = 0
    total_errors = 0

    for company in companies:
        number = company["company_number"]
        name = company["company_name"]
        active_alerts = company["active_alerts"] or []

        if not active_alerts:
            continue

        try:
            profile = get_company_profile(number, ch_key)
        except Exception as exc:
            logger.warning("[dispatch_alerts] CH API error for %s: %s", number, exc)
            total_errors += 1
            continue

        if not profile:
            logger.warning("[dispatch_alerts] Company %s not found in CH", number)
            continue

        deadlines = profile_to_deadlines(profile, active_alerts)
        if not deadlines:
            continue

        for deadline in deadlines:
            alert_type = deadline["alert_type"]
            due_date = deadline["due_date"]
            days_left = deadline["days_left"]
            alert_label = ALERT_LABELS.get(alert_type, alert_type)
            windows = activated_windows(days_left)

            for window_days in windows:
                dedupe_key = f"{number}:{alert_type}:{due_date}:w{window_days}"
                urgency = URGENCY[window_days]

                try:
                    is_new = insert_dispatch_if_new(
                        conn, dedupe_key, number, alert_type, due_date, window_days
                    )
                except Exception as exc:
                    logger.error("[dispatch_alerts] DB error for %s: %s", dedupe_key, exc)
                    total_errors += 1
                    continue

                if not is_new:
                    total_skipped += 1
                    continue

                payload = {
                    "id": dedupe_key,
                    "companyNumber": number,
                    "companyName": name,
                    "alertType": alert_type,
                    "alertLabel": alert_label,
                    "dueDate": due_date,
                    "daysRemaining": days_left,
                    "urgency": urgency,
                    "windowDays": window_days,
                    "overdue": days_left < 0,
                    "message": build_message(alert_label, days_left, due_date),
                    "firedAt": datetime.datetime.utcnow().isoformat(),
                }

                hook_result = fire_webhooks(conn, "compliance.alert", payload)
                total_fired += 1

                logger.info(
                    "[dispatch_alerts] Fired %s | %s | w%d | delivered=%d failed=%d",
                    number, alert_type, window_days,
                    hook_result["delivered"], hook_result["failed"],
                )

    logger.info(
        "[dispatch_alerts] Summary: fired=%d skipped=%d errors=%d",
        total_fired, total_skipped, total_errors,
    )
