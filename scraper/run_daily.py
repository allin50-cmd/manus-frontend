#!/usr/bin/env python3
"""
================================================================================
IDOX SCRAPER - DAILY CRON WRAPPER
Runs the scraper, captures output, emails results.
================================================================================

USAGE:
    Called by cron daily. Reads SMTP config from .env file.

EXIT CODES:
    0 = success (records found OR zero records, both valid)
    1 = scraper failure (config, network, fatal error)
    2 = email failure (scrape OK but email send failed)

================================================================================
"""

import os
import sys
import smtplib
import subprocess
import logging
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR = Path(__file__).parent.resolve()
ENV_FILE = SCRIPT_DIR / '.env'
LOG_DIR = SCRIPT_DIR / 'logs'
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
SEEN_REFS = SCRIPT_DIR / 'seen_refs.json'

LOG_FILE = LOG_DIR / f"scraper_{datetime.now().strftime('%Y-%m-%d')}.log"


# =============================================================================
# LOGGING SETUP
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


# =============================================================================
# SCRAPER EXECUTION
# =============================================================================

def run_scraper() -> tuple[bool, str, int]:
    """Run the scraper subprocess. Returns (success, output, new_record_count)."""
    logger.info("Starting scraper run...")

    python_bin = str(VENV_PYTHON) if VENV_PYTHON.exists() else 'python3'

    cmd = [python_bin, str(SCRAPER_SCRIPT), '--output', 'csv']
    logger.info(f"Command: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=1800,  # 30 minute hard timeout
            cwd=str(SCRIPT_DIR)
        )

        output = result.stdout + '\n' + result.stderr
        success = result.returncode == 0

        # Count records only if CSV was written this run (within last hour)
        new_records = 0
        if OUTPUT_CSV.exists():
            csv_age_seconds = (datetime.now().timestamp() - OUTPUT_CSV.stat().st_mtime)
            if csv_age_seconds < 3600:
                with open(OUTPUT_CSV, 'r') as f:
                    new_records = sum(1 for _ in f) - 1  # Exclude header
                logger.info(f"CSV updated this run: {new_records} records")
            else:
                logger.info(f"CSV is stale ({int(csv_age_seconds/60)} min old) - zero new records today")

        logger.info(f"Scraper completed. Exit code: {result.returncode}")
        logger.info(f"New records this run: {new_records}")

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

def send_email(
    success: bool,
    output: str,
    record_count: int,
    attach_csv: bool = True
) -> bool:
    """Send email notification with scraper results and CSV attachment."""
    if not SMTP_USER or not EMAIL_TO:
        logger.error("SMTP_USER or EMAIL_TO not configured in .env")
        return False

    logger.info(f"Preparing email to {EMAIL_TO}...")

    status_icon = "✓" if success else "✗"
    date_str = datetime.now().strftime('%Y-%m-%d')
    subject = f"{status_icon} Planning Scraper - {date_str} - {record_count} records"

    msg = MIMEMultipart('mixed')
    msg['Subject'] = subject
    msg['From'] = EMAIL_FROM
    msg['To'] = EMAIL_TO

    status_color = "#2ecc71" if success else "#e74c3c"
    status_text = "SUCCESS" if success else "FAILURE"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'IBM Plex Mono', monospace; background: #0a0e27; color: #e8eaf6; padding: 20px; }}
            .container {{ max-width: 700px; margin: 0 auto; }}
            .header {{ background: linear-gradient(135deg, #FF4F00, #ff8c42); padding: 25px; border-radius: 12px 12px 0 0; color: white; }}
            .header h1 {{ margin: 0; font-size: 22px; }}
            .header .date {{ margin-top: 8px; font-size: 13px; opacity: 0.9; }}
            .status-banner {{ background: {status_color}; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 16px; letter-spacing: 2px; }}
            .stats {{ background: #1a1f3a; padding: 25px; }}
            .stat-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a2f4a; }}
            .stat-label {{ color: #a0a4c0; font-size: 13px; }}
            .stat-value {{ color: #FF4F00; font-weight: bold; font-size: 15px; }}
            .log-output {{ background: #050811; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.5; color: #a0a4c0; white-space: pre-wrap; max-height: 500px; overflow-y: auto; border: 1px solid #2a2f4a; margin-top: 20px; }}
            .footer {{ background: #1a1f3a; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 11px; color: #a0a4c0; }}
            .accuracy {{ color: #FF4F00; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Planning Scraper Report</h1>
                <div class="date">{date_str} | UltAi Group / Accuracy Developments</div>
            </div>
            <div class="status-banner">{status_text}</div>
            <div class="stats">
                <div class="stat-row">
                    <span class="stat-label">Records Extracted</span>
                    <span class="stat-value">{record_count}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Run Time</span>
                    <span class="stat-value">{datetime.now().strftime('%H:%M:%S')}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Status</span>
                    <span class="stat-value">{status_text}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Output File</span>
                    <span class="stat-value">{'planning_records.csv (attached)' if attach_csv and OUTPUT_CSV.exists() else 'No file generated'}</span>
                </div>
            </div>
            <div style="background: #1a1f3a; padding: 20px;">
                <div style="color: #FF4F00; font-weight: bold; margin-bottom: 10px; font-size: 12px; text-transform: uppercase;">Scraper Output Log</div>
                <div class="log-output">{output[:10000]}</div>
            </div>
            <div class="footer">
                <span class="accuracy">Accuracy Developments Ltd</span> &middot; TenderFlow Pipeline &middot; Auto-generated report
            </div>
        </div>
    </body>
    </html>
    """

    text_body = f"""
Planning Scraper Report - {date_str}
Status: {status_text}
Records Extracted: {record_count}
Run Time: {datetime.now().strftime('%H:%M:%S')}

--- SCRAPER OUTPUT ---
{output[:5000]}

--- END ---
Accuracy Developments Ltd · TenderFlow Pipeline
    """

    alternative = MIMEMultipart('alternative')
    alternative.attach(MIMEText(text_body, 'plain'))
    alternative.attach(MIMEText(html_body, 'html'))
    msg.attach(alternative)

    if attach_csv and OUTPUT_CSV.exists() and record_count > 0:
        logger.info(f"Attaching {OUTPUT_CSV.name}...")
        with open(OUTPUT_CSV, 'rb') as f:
            attachment = MIMEBase('application', 'octet-stream')
            attachment.set_payload(f.read())
        encoders.encode_base64(attachment)
        attachment.add_header(
            'Content-Disposition',
            f'attachment; filename="planning_records_{date_str}.csv"'
        )
        msg.attach(attachment)

    try:
        logger.info(f"Connecting to {SMTP_HOST}:{SMTP_PORT}...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email sent to {EMAIL_TO}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP authentication failed: {e}")
        logger.error("Check SMTP_USER and SMTP_PASSWORD in .env")
        return False

    except Exception as e:
        logger.error(f"Email send failed: {e}", exc_info=True)
        return False


# =============================================================================
# MAIN
# =============================================================================

def main():
    logger.info("=" * 80)
    logger.info(f"Daily scraper run - {datetime.now().isoformat()}")
    logger.info("=" * 80)

    if not SCRAPER_SCRIPT.exists():
        logger.error(f"Scraper not found: {SCRAPER_SCRIPT}")
        sys.exit(1)

    if not ENV_FILE.exists():
        logger.error(f".env file not found: {ENV_FILE}")
        logger.error("Copy .env.example to .env and configure SMTP credentials")
        sys.exit(1)

    success, output, record_count = run_scraper()

    email_sent = send_email(success, output, record_count, attach_csv=success)

    if not success:
        logger.error("Scraper failed")
        sys.exit(1)

    if not email_sent:
        logger.error("Email failed")
        sys.exit(2)

    logger.info("Daily run complete")
    sys.exit(0)


if __name__ == '__main__':
    main()
