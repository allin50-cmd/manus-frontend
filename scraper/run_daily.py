#!/usr/bin/env python3
"""
================================================================================
IDOX SCRAPER - DAILY CRON WRAPPER  (v2 - Hardened)

Fixes vs v1:
  - PID lockfile prevents overlapping launchd invocations.
  - Record count parsed from scraper's NEW_RECORDS=N stdout line instead
    of the fragile CSV mtime check (which broke if the run took >1 h).
  - SMTP send retried up to 3 times with exponential backoff before giving up.
  - Removed unused `Optional` import.

EXIT CODES:
    0 = success
    1 = scraper failure  (config / network / fatal)
    2 = email failure    (scrape OK but all SMTP attempts failed)
================================================================================
"""

import os
import re
import sys
import time
import smtplib
import subprocess
import logging
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path

from dotenv import load_dotenv

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR = Path(__file__).parent.resolve()
ENV_FILE = SCRIPT_DIR / '.env'
LOG_DIR = SCRIPT_DIR / 'logs'
PID_FILE = SCRIPT_DIR / 'scraper.pid'
LOG_DIR.mkdir(exist_ok=True)

load_dotenv(ENV_FILE)

SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
EMAIL_FROM = os.getenv('EMAIL_FROM', SMTP_USER)
EMAIL_TO = os.getenv('EMAIL_TO', '')

SCRAPER_SCRIPT = SCRIPT_DIR / 'idox_scraper_prod.py'
VENV_PYTHON = SCRIPT_DIR / 'venv' / 'bin' / 'python3'
OUTPUT_CSV = SCRIPT_DIR / 'planning_records.csv'

SMTP_RETRY_ATTEMPTS = 3
SMTP_BASE_DELAY = 5   # seconds; doubled each attempt

LOG_FILE = LOG_DIR / f"scraper_{datetime.now().strftime('%Y-%m-%d')}.log"

# =============================================================================
# LOGGING
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# =============================================================================
# LOCKFILE — prevent concurrent runs
# =============================================================================

def acquire_lock() -> bool:
    """
    Write a PID file and return True. Returns False (without writing) if
    another instance appears to be running. Stale files from crashed processes
    are cleaned up automatically.
    """
    if PID_FILE.exists():
        try:
            existing_pid = int(PID_FILE.read_text().strip())
            os.kill(existing_pid, 0)  # signal 0 = probe only
            logger.error(f"Another instance is already running (PID {existing_pid}). Exiting.")
            return False
        except (ProcessLookupError, PermissionError):
            logger.warning("Removing stale lockfile from previous crashed run")
            PID_FILE.unlink(missing_ok=True)
        except (ValueError, OSError):
            PID_FILE.unlink(missing_ok=True)

    PID_FILE.write_text(str(os.getpid()))
    return True


def release_lock() -> None:
    PID_FILE.unlink(missing_ok=True)


# =============================================================================
# SCRAPER EXECUTION
# =============================================================================

def run_scraper() -> tuple[bool, str, int]:
    """
    Run the scraper subprocess.
    Returns (success, combined_output, new_record_count).

    Record count is parsed from the NEW_RECORDS=N line that the scraper
    prints to stdout — reliable regardless of file timestamps or timezones.
    """
    logger.info("Starting scraper run…")
    python_bin = str(VENV_PYTHON) if VENV_PYTHON.exists() else 'python3'
    cmd = [python_bin, str(SCRAPER_SCRIPT), '--output', 'csv']
    logger.info(f"Command: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=1800,
            cwd=str(SCRIPT_DIR),
        )

        output = result.stdout + '\n' + result.stderr
        success = result.returncode == 0

        new_records = 0
        match = re.search(r'^NEW_RECORDS=(\d+)', result.stdout, re.MULTILINE)
        if match:
            new_records = int(match.group(1))
            logger.info(f"Scraper reported {new_records} new records")
        elif success:
            logger.warning("NEW_RECORDS not found in scraper output — defaulting to 0")

        logger.info(f"Exit code: {result.returncode} | New records: {new_records}")
        return success, output, new_records

    except subprocess.TimeoutExpired:
        logger.error("Scraper timed out after 30 minutes")
        return False, "Scraper timed out (30 min limit)", 0

    except Exception as e:
        logger.error(f"Scraper execution failed: {e}", exc_info=True)
        return False, f"Execution error: {e}", 0


# =============================================================================
# EMAIL DELIVERY
# =============================================================================

def _build_message(success: bool, output: str, record_count: int) -> MIMEMultipart:
    status_text = "SUCCESS" if success else "FAILURE"
    status_color = "#2ecc71" if success else "#e74c3c"
    date_str = datetime.now().strftime('%Y-%m-%d')

    msg = MIMEMultipart('mixed')
    msg['Subject'] = f"{'✓' if success else '✗'} Planning Scraper — {date_str} — {record_count} records"
    msg['From'] = EMAIL_FROM
    msg['To'] = EMAIL_TO

    html = f"""<!DOCTYPE html>
<html><head><style>
body{{font-family:'IBM Plex Mono',monospace;background:#0a0e27;color:#e8eaf6;padding:20px}}
.container{{max-width:700px;margin:0 auto}}
.header{{background:linear-gradient(135deg,#FF4F00,#ff8c42);padding:25px;border-radius:12px 12px 0 0;color:white}}
.header h1{{margin:0;font-size:22px}}
.banner{{background:{status_color};color:white;padding:15px;text-align:center;font-weight:bold;font-size:16px;letter-spacing:2px}}
.stats{{background:#1a1f3a;padding:25px}}
.row{{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #2a2f4a}}
.label{{color:#a0a4c0;font-size:13px}}.value{{color:#FF4F00;font-weight:bold;font-size:15px}}
.log{{background:#050811;padding:20px;border-radius:8px;font-family:'Courier New',monospace;font-size:11px;line-height:1.5;color:#a0a4c0;white-space:pre-wrap;max-height:500px;overflow-y:auto;border:1px solid #2a2f4a;margin-top:20px}}
.footer{{background:#1a1f3a;padding:20px;border-radius:0 0 12px 12px;text-align:center;font-size:11px;color:#a0a4c0}}
.brand{{color:#FF4F00;font-weight:bold}}
</style></head><body><div class="container">
<div class="header"><h1>Planning Scraper Report</h1><div>{date_str} | UltAi Group / Accuracy Developments</div></div>
<div class="banner">{status_text}</div>
<div class="stats">
  <div class="row"><span class="label">Records Extracted</span><span class="value">{record_count}</span></div>
  <div class="row"><span class="label">Run Time</span><span class="value">{datetime.now().strftime('%H:%M:%S')}</span></div>
  <div class="row"><span class="label">Status</span><span class="value">{status_text}</span></div>
  <div class="row"><span class="label">Attachment</span><span class="value">{'planning_records.csv' if success and record_count > 0 else 'none'}</span></div>
</div>
<div style="background:#1a1f3a;padding:20px">
  <div style="color:#FF4F00;font-weight:bold;margin-bottom:10px;font-size:12px;text-transform:uppercase">Scraper Log</div>
  <div class="log">{output[:10000]}</div>
</div>
<div class="footer"><span class="brand">Accuracy Developments Ltd</span> &middot; TenderFlow Pipeline</div>
</div></body></html>"""

    text = (
        f"Planning Scraper — {date_str}\n"
        f"Status: {status_text}\n"
        f"Records: {record_count}\n\n"
        f"--- SCRAPER OUTPUT ---\n{output[:5000]}\n--- END ---\n"
        f"Accuracy Developments Ltd · TenderFlow Pipeline"
    )

    alt = MIMEMultipart('alternative')
    alt.attach(MIMEText(text, 'plain'))
    alt.attach(MIMEText(html, 'html'))
    msg.attach(alt)

    if success and OUTPUT_CSV.exists() and record_count > 0:
        date_str_file = datetime.now().strftime('%Y-%m-%d')
        logger.info(f"Attaching {OUTPUT_CSV.name}…")
        with open(OUTPUT_CSV, 'rb') as f:
            att = MIMEBase('application', 'octet-stream')
            att.set_payload(f.read())
        encoders.encode_base64(att)
        att.add_header('Content-Disposition',
                       f'attachment; filename="planning_records_{date_str_file}.csv"')
        msg.attach(att)

    return msg


def send_email(success: bool, output: str, record_count: int) -> bool:
    """Send report email, retrying up to SMTP_RETRY_ATTEMPTS times."""
    if not SMTP_USER or not EMAIL_TO:
        logger.error("SMTP_USER or EMAIL_TO not set in .env")
        return False

    msg = _build_message(success, output, record_count)

    for attempt in range(SMTP_RETRY_ATTEMPTS):
        try:
            logger.info(f"Sending email (attempt {attempt + 1}/{SMTP_RETRY_ATTEMPTS})…")
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Email sent to {EMAIL_TO}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP auth failed — check credentials: {e}")
            return False  # Retrying bad credentials is pointless

        except Exception as e:
            logger.warning(f"Email attempt {attempt + 1} failed: {e}")
            if attempt < SMTP_RETRY_ATTEMPTS - 1:
                delay = SMTP_BASE_DELAY * (2 ** attempt)
                logger.info(f"Retrying in {delay}s…")
                time.sleep(delay)

    logger.error(f"All {SMTP_RETRY_ATTEMPTS} email attempts failed")
    return False


# =============================================================================
# MAIN
# =============================================================================

def main() -> None:
    logger.info("=" * 80)
    logger.info(f"Daily scraper run — {datetime.now().isoformat()}")
    logger.info("=" * 80)

    if not acquire_lock():
        sys.exit(1)

    try:
        if not SCRAPER_SCRIPT.exists():
            logger.error(f"Scraper script not found: {SCRAPER_SCRIPT}")
            sys.exit(1)

        if not ENV_FILE.exists():
            logger.error(f".env not found: {ENV_FILE}  (copy .env.example and fill in credentials)")
            sys.exit(1)

        success, output, record_count = run_scraper()
        email_sent = send_email(success, output, record_count)

        if not success:
            logger.error("Scraper run failed")
            sys.exit(1)

        if not email_sent:
            logger.error("Email delivery failed after all retries")
            sys.exit(2)

        logger.info("Daily run complete")
        sys.exit(0)

    finally:
        release_lock()


if __name__ == '__main__':
    main()
