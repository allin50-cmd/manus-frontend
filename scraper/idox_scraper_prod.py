#!/usr/bin/env python3
"""
================================================================================
COUNCIL PLANNING APPLICATIONS SCRAPER (v2 - Production Grade)
Bromley & Lewisham - Last 7 Days Residential Applications
Config-Driven | Resilient Extraction | Deduplication | Dry-Run Support
================================================================================

REQUIREMENTS:
    pip install playwright pandas python-dateutil click

USAGE:
    python3 idox_scraper_prod.py --start-date 2024-05-11 --end-date 2024-05-18 --output csv
    python3 idox_scraper_prod.py --dry-run
    python3 idox_scraper_prod.py --council Bromley --output json

================================================================================
"""

import asyncio
import logging
import json
import csv
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any, Set
from dataclasses import dataclass, asdict
import re

import pandas as pd
import click
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from playwright.async_api import TimeoutError as PlaywrightTimeoutError


# =============================================================================
# CONFIGURATION & CONSTANTS
# =============================================================================

CONFIG_FILE = Path(__file__).parent / 'councils_config.json'
SEEN_REFS_FILE = Path.cwd() / 'seen_refs.json'
OUTPUT_FILE = Path.cwd() / 'planning_records.csv'
OUTPUT_JSON_FILE = Path.cwd() / 'planning_records.json'

RETRY_ATTEMPTS = 3
RETRY_DELAY = 2.0
PAGE_TIMEOUT = 30000
NETWORK_IDLE_TIMEOUT = 20000

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

VIEWPORTS = [
    {"width": 1920, "height": 1080},
    {"width": 1366, "height": 768},
    {"width": 1280, "height": 720},
]


# =============================================================================
# LOGGING
# =============================================================================

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    return logging.getLogger(__name__)

logger = setup_logging()


# =============================================================================
# DATA MODELS
# =============================================================================

@dataclass
class PlanningRecord:
    """Represents a planning application record."""
    council: str
    reference: str
    address: str
    description: str
    status: str
    date_validated: str
    date_decision: str = ""
    url: str = ""

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)

    def dedupe_key(self) -> str:
        """Return unique key for deduplication (council + reference)."""
        return f"{self.council}:{self.reference}"


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def load_config() -> Dict[str, Any]:
    """Load councils configuration from JSON file."""
    if not CONFIG_FILE.exists():
        logger.error(f"Config file not found: {CONFIG_FILE}")
        sys.exit(1)

    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)

    logger.info(f"Loaded config with {len(config.get('councils', []))} councils")
    return config


def load_seen_refs() -> Set[str]:
    """Load previously seen reference keys from JSON file."""
    if not SEEN_REFS_FILE.exists():
        return set()

    with open(SEEN_REFS_FILE, 'r') as f:
        seen = json.load(f)

    logger.debug(f"Loaded {len(seen)} previously seen references")
    return set(seen)


def save_seen_refs(seen_refs: Set[str]) -> None:
    """Save seen reference keys to JSON file."""
    with open(SEEN_REFS_FILE, 'w') as f:
        json.dump(sorted(list(seen_refs)), f, indent=2)

    logger.debug(f"Saved {len(seen_refs)} references to {SEEN_REFS_FILE}")


async def realistic_delay(min_sec: float = 0.5, max_sec: float = 2.5) -> None:
    """Insert realistic human-like delay between actions."""
    delay = random.uniform(min_sec, max_sec)
    await asyncio.sleep(delay)


def clean_text(raw_text: Optional[str]) -> str:
    """Strip whitespace, newlines, null bytes, normalize spaces."""
    if not raw_text:
        return ""

    cleaned = ''.join(char for char in raw_text if char.isprintable() or char.isspace())
    cleaned = ' '.join(cleaned.split())
    return cleaned


def calculate_date_range(start_date: Optional[str], end_date: Optional[str]) -> tuple[str, str]:
    """
    Calculate date range. If not provided, default to last 7 days.
    Returns: (start_date, end_date) as 'DD/MM/YYYY' strings
    """
    if end_date:
        to_date = datetime.strptime(end_date, '%Y-%m-%d')
    else:
        to_date = datetime.now()

    if start_date:
        from_date = datetime.strptime(start_date, '%Y-%m-%d')
    else:
        from_date = to_date - timedelta(days=7)

    start_str = from_date.strftime('%d/%m/%Y')
    end_str = to_date.strftime('%d/%m/%Y')

    logger.info(f"Date range: {start_str} to {end_str}")
    return start_str, end_str


def parse_date(date_str: str) -> str:
    """Normalize date string to YYYY-MM-DD format."""
    if not date_str:
        return ""

    date_str = clean_text(date_str)

    for fmt in ['%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%d %b %Y', '%d %B %Y']:
        try:
            parsed = datetime.strptime(date_str, fmt)
            return parsed.strftime('%Y-%m-%d')
        except ValueError:
            pass

    return date_str


# =============================================================================
# DYNAMIC SELECTOR DISCOVERY
# =============================================================================

async def try_selector_group(page: Page, selectors: List[str], timeout: int = 5000) -> Optional[str]:
    """Try a list of selectors in order, return first working one."""
    for selector in selectors:
        try:
            element = page.locator(selector).first
            if await element.is_visible(timeout=timeout):
                return selector
        except Exception:
            pass

    return None


async def discover_selectors(page: Page, council_config: Dict[str, Any]) -> Dict[str, Optional[str]]:
    """
    Validate council selectors by attempting to locate elements.
    Returns dict with selector -> discovered_selector mapping.
    """
    discovered = {}
    selectors = council_config.get('selectors', {})

    for field, selector_group in selectors.items():
        if isinstance(selector_group, str):
            selector_list = [selector_group]
        else:
            selector_list = selector_group.split(', ')

        found = await try_selector_group(page, selector_list, timeout=3000)
        discovered[field] = found

        if found:
            logger.debug(f"  ✓ {field}: {found}")
        else:
            logger.warning(f"  ✗ {field}: no selector found")

    return discovered


# =============================================================================
# EXTRACTION LOGIC
# =============================================================================

async def extract_cell_content(cell_element, field_name: str, regex_pattern: Optional[str] = None) -> str:
    """Extract text from a cell element with optional regex parsing."""
    try:
        text = await cell_element.text_content()
        text = clean_text(text)

        if regex_pattern and text:
            match = re.search(regex_pattern, text)
            if match:
                return match.group(1) if match.groups() else match.group(0)

        return text
    except Exception as e:
        logger.debug(f"Error extracting {field_name}: {e}")
        return ""


async def extract_results(
    page: Page,
    council_name: str,
    discovered_selectors: Dict[str, Optional[str]]
) -> List[PlanningRecord]:
    """Extract all visible planning application rows from current page."""
    records = []

    try:
        await page.wait_for_load_state('networkidle', timeout=NETWORK_IDLE_TIMEOUT)
    except PlaywrightTimeoutError:
        logger.warning(f"{council_name}: Page load timeout - proceeding")

    results_selector = discovered_selectors.get('results_container')
    if not results_selector:
        logger.warning(f"{council_name}: No results container selector found")
        return records

    try:
        row_count = await page.locator(results_selector).count()
        logger.info(f"{council_name}: Found {row_count} result rows")

        for i in range(row_count):
            try:
                row = page.locator(results_selector).nth(i)

                ref = await extract_cell_content(
                    row.locator(discovered_selectors.get('reference_cell', 'td:first-child')).first,
                    'reference'
                )

                addr = await extract_cell_content(
                    row.locator(discovered_selectors.get('address_cell', 'td:nth-child(2)')).first,
                    'address'
                )

                desc = await extract_cell_content(
                    row.locator(discovered_selectors.get('description_cell', 'td:nth-child(3)')).first,
                    'description'
                )

                status = await extract_cell_content(
                    row.locator(discovered_selectors.get('status_cell', 'td:nth-child(4)')).first,
                    'status'
                )

                date_val = await extract_cell_content(
                    row.locator(discovered_selectors.get('date_validated_cell', 'td:nth-child(5)')).first,
                    'date_validated'
                )

                if not ref or len(ref.strip()) < 3:
                    logger.debug(f"Skipping row {i}: invalid reference")
                    continue

                record = PlanningRecord(
                    council=council_name,
                    reference=ref,
                    address=addr,
                    description=desc,
                    status=status,
                    date_validated=parse_date(date_val),
                    date_decision="",
                    url=""
                )

                records.append(record)
                logger.debug(f"Extracted: {ref} | {addr}")

            except Exception as e:
                logger.debug(f"Error extracting row {i}: {e}")
                continue

    except Exception as e:
        logger.error(f"Error extracting results: {e}")

    return records


async def navigate_next_page(page: Page, council_config: Dict[str, Any]) -> bool:
    """
    Attempt to navigate to next results page.
    Returns True if next page was found and clicked, False otherwise.
    """
    next_selector = council_config.get('selectors', {}).get('next_page')

    if not next_selector:
        logger.debug("No next page selector configured")
        return False

    try:
        next_button = page.locator(next_selector).first
        if await next_button.is_visible(timeout=5000):
            logger.info("Found next page button, clicking...")
            await next_button.click()
            await realistic_delay(1.0, 2.5)
            return True
    except Exception as e:
        logger.debug(f"No next page found: {e}")

    return False


# =============================================================================
# DRY-RUN MODE
# =============================================================================

async def dry_run_council(
    browser: Browser,
    council_config: Dict[str, Any],
    start_date: str,
    end_date: str
) -> Dict[str, Any]:
    """Validate council configuration without scraping records."""
    council_name = council_config.get('name')
    url = council_config.get('url')

    logger.info(f"\n{'='*80}")
    logger.info(f"DRY-RUN: {council_name}")
    logger.info(f"{'='*80}")

    report = {
        'council': council_name,
        'url': url,
        'selectors_valid': {},
        'errors': [],
        'timestamp': datetime.now().isoformat()
    }

    context = await browser.new_context(
        user_agent=random.choice(USER_AGENTS),
        viewport=random.choice(VIEWPORTS),
        locale='en-GB',
        timezone_id='Europe/London'
    )

    page = await context.new_page()

    try:
        logger.info(f"Navigating to {url}...")
        try:
            await page.goto(url, timeout=PAGE_TIMEOUT, wait_until='domcontentloaded')
        except PlaywrightTimeoutError:
            report['errors'].append(f"Page load timeout: {url}")
            return report

        await realistic_delay(1.0, 2.0)

        adv_search_selector = council_config.get('selectors', {}).get('advanced_search')
        if adv_search_selector:
            try:
                adv = page.locator(adv_search_selector).first
                if await adv.is_visible(timeout=3000):
                    logger.info("Found Advanced Search link")
                    await adv.click()
                    await realistic_delay(1.0, 2.0)
            except Exception as e:
                logger.debug(f"Could not find/click Advanced Search: {e}")

        logger.info("Validating selectors...")
        discovered = await discover_selectors(page, council_config)
        report['selectors_valid'] = discovered

        missing = [k for k, v in discovered.items() if not v]
        if missing:
            report['errors'].append(f"Missing selectors: {', '.join(missing)}")

        logger.info(f"Validation complete. Errors: {len(report['errors'])}")

    except Exception as e:
        logger.error(f"Dry-run error: {e}")
        report['errors'].append(str(e))

    finally:
        await page.close()
        await context.close()

    return report


# =============================================================================
# SCRAPE LOGIC
# =============================================================================

async def scrape_council(
    browser: Browser,
    council_config: Dict[str, Any],
    start_date: str,
    end_date: str,
    seen_refs: Set[str]
) -> tuple[List[PlanningRecord], Dict[str, int]]:
    """Scrape a single council with retry logic and deduplication."""
    council_name = council_config.get('name')
    url = council_config.get('url')

    logger.info(f"\n{'='*80}")
    logger.info(f"SCRAPING: {council_name}")
    logger.info(f"{'='*80}")

    stats = {
        'total_found': 0,
        'new_records': 0,
        'duplicates_skipped': 0,
        'errors': 0
    }

    all_records = []

    context = await browser.new_context(
        user_agent=random.choice(USER_AGENTS),
        viewport=random.choice(VIEWPORTS),
        locale='en-GB',
        timezone_id='Europe/London'
    )

    page = await context.new_page()

    try:
        for attempt in range(RETRY_ATTEMPTS):
            try:
                logger.info(f"Navigating to {url}... (attempt {attempt + 1})")
                await page.goto(url, timeout=PAGE_TIMEOUT, wait_until='domcontentloaded')
                break
            except PlaywrightTimeoutError:
                if attempt < RETRY_ATTEMPTS - 1:
                    logger.warning(f"Timeout, retrying in {RETRY_DELAY}s...")
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    logger.error(f"Failed to load page after {RETRY_ATTEMPTS} attempts")
                    stats['errors'] += 1
                    return all_records, stats

        await realistic_delay(1.5, 2.5)

        adv_search_selector = council_config.get('selectors', {}).get('advanced_search')
        if adv_search_selector:
            try:
                adv = page.locator(adv_search_selector).first
                if await adv.is_visible(timeout=5000):
                    logger.info("Clicking Advanced Search...")
                    await adv.click()
                    await realistic_delay(1.0, 2.0)
            except Exception as e:
                logger.debug(f"Could not click Advanced Search: {e}")

        logger.info("Discovering/validating selectors...")
        discovered_selectors = await discover_selectors(page, council_config)

        for attempt in range(RETRY_ATTEMPTS):
            try:
                date_from_selector = discovered_selectors.get('date_from')
                date_to_selector = discovered_selectors.get('date_to')

                if date_from_selector:
                    logger.info(f"Filling start date: {start_date}")
                    await page.fill(date_from_selector, start_date)
                    await realistic_delay(0.3, 0.8)

                if date_to_selector:
                    logger.info(f"Filling end date: {end_date}")
                    await page.fill(date_to_selector, end_date)
                    await realistic_delay(0.3, 0.8)

                break
            except Exception as e:
                logger.warning(f"Error filling dates (attempt {attempt + 1}): {e}")
                if attempt < RETRY_ATTEMPTS - 1:
                    await asyncio.sleep(RETRY_DELAY)

        for attempt in range(RETRY_ATTEMPTS):
            try:
                submit_selector = discovered_selectors.get('submit_button')
                if submit_selector:
                    logger.info("Submitting search...")
                    await page.click(submit_selector)
                    await realistic_delay(1.5, 3.0)
                    await page.wait_for_load_state('networkidle', timeout=NETWORK_IDLE_TIMEOUT)
                break
            except Exception as e:
                logger.warning(f"Error submitting search (attempt {attempt + 1}): {e}")
                if attempt < RETRY_ATTEMPTS - 1:
                    await asyncio.sleep(RETRY_DELAY)

        page_num = 1
        while True:
            logger.info(f"Extracting page {page_num}...")

            records = await extract_results(page, council_name, discovered_selectors)
            logger.info(f"Page {page_num}: {len(records)} raw records")

            for record in records:
                key = record.dedupe_key()
                stats['total_found'] += 1

                if key in seen_refs:
                    logger.debug(f"Skipping duplicate: {record.reference}")
                    stats['duplicates_skipped'] += 1
                else:
                    all_records.append(record)
                    seen_refs.add(key)
                    stats['new_records'] += 1

            has_next = False
            for attempt in range(RETRY_ATTEMPTS):
                try:
                    has_next = await navigate_next_page(page, council_config)
                    break
                except Exception as e:
                    logger.warning(f"Error navigating next page (attempt {attempt + 1}): {e}")
                    if attempt < RETRY_ATTEMPTS - 1:
                        await asyncio.sleep(RETRY_DELAY)

            if not has_next:
                break

            page_num += 1
            if page_num > 50:
                logger.warning("Reached pagination safety limit (50 pages)")
                break

        logger.info(
            f"{council_name} complete: {stats['new_records']} new records "
            f"(total found: {stats['total_found']}, duplicates: {stats['duplicates_skipped']})"
        )

    except Exception as e:
        logger.error(f"Critical error scraping {council_name}: {e}", exc_info=True)
        stats['errors'] += 1

    finally:
        await page.close()
        await context.close()

    return all_records, stats


# =============================================================================
# MAIN ORCHESTRATION
# =============================================================================

async def run_scraper(
    start_date: Optional[str],
    end_date: Optional[str],
    output_format: str,
    dry_run: bool,
    council_filter: Optional[str]
):
    """Main async orchestration function."""

    logger.info("=" * 80)
    logger.info(f"Council Planning Scraper v2 - {'DRY-RUN MODE' if dry_run else 'LIVE MODE'}")
    logger.info(f"Start time: {datetime.now().isoformat()}")
    logger.info("=" * 80)

    config = load_config()

    councils = config.get('councils', [])
    if council_filter:
        councils = [c for c in councils if c.get('name').lower() == council_filter.lower()]
        if not councils:
            logger.error(f"Council not found: {council_filter}")
            sys.exit(1)

    enabled_councils = [c for c in councils if c.get('enabled', True)]
    logger.info(f"Processing {len(enabled_councils)} council(s)")

    start_date_str, end_date_str = calculate_date_range(start_date, end_date)

    seen_refs = load_seen_refs()

    all_records = []
    all_stats = {}
    dry_run_reports = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled', '--disable-gpu']
        )

        try:
            for council_config in enabled_councils:
                council_name = council_config.get('name')

                try:
                    if dry_run:
                        report = await dry_run_council(browser, council_config, start_date_str, end_date_str)
                        dry_run_reports.append(report)
                    else:
                        records, stats = await scrape_council(
                            browser, council_config, start_date_str, end_date_str, seen_refs
                        )
                        all_records.extend(records)
                        all_stats[council_name] = stats

                except Exception as e:
                    logger.error(f"Failed to process {council_name}: {e}", exc_info=True)
                    all_stats[council_name] = {'error': str(e)}

                await realistic_delay(1.0, 2.0)

        finally:
            await browser.close()

    if dry_run:
        logger.info("\n" + "=" * 80)
        logger.info("DRY-RUN VALIDATION REPORT")
        logger.info("=" * 80)

        for report in dry_run_reports:
            logger.info(f"\n{report['council']}:")
            logger.info(f"  URL: {report['url']}")
            logger.info(
                f"  Selectors Valid: "
                f"{sum(1 for v in report['selectors_valid'].values() if v)} / "
                f"{len(report['selectors_valid'])}"
            )

            if report['errors']:
                logger.info(f"  Errors:")
                for err in report['errors']:
                    logger.info(f"    - {err}")
            else:
                logger.info(f"  All validations passed")
    else:
        save_seen_refs(seen_refs)

        if all_records:
            if output_format == 'csv':
                df = pd.DataFrame([r.to_dict() for r in all_records])
                df.to_csv(OUTPUT_FILE, index=False, quoting=csv.QUOTE_ALL, encoding='utf-8')
                logger.info(f"\nData saved to: {OUTPUT_FILE}")
                logger.info(f"  Rows: {len(df)} | Columns: {list(df.columns)}")

            elif output_format == 'json':
                with open(OUTPUT_JSON_FILE, 'w') as f:
                    json.dump([r.to_dict() for r in all_records], f, indent=2)
                logger.info(f"\nData saved to: {OUTPUT_JSON_FILE}")
                logger.info(f"  Records: {len(all_records)}")
        else:
            logger.warning("No new records found")

        logger.info("\n" + "=" * 80)
        logger.info("SUMMARY STATISTICS")
        logger.info("=" * 80)

        total_new = 0
        total_found = 0
        total_dups = 0

        for council_name, stats in all_stats.items():
            if 'error' in stats:
                logger.error(f"{council_name}: FAILED - {stats['error']}")
            else:
                logger.info(f"{council_name}:")
                logger.info(f"  Total Found: {stats['total_found']}")
                logger.info(f"  New Records: {stats['new_records']}")
                logger.info(f"  Duplicates Skipped: {stats['duplicates_skipped']}")

                total_new += stats['new_records']
                total_found += stats['total_found']
                total_dups += stats['duplicates_skipped']

        logger.info(f"\nGrand Total:")
        logger.info(f"  Records Found: {total_found}")
        logger.info(f"  New Records: {total_new}")
        logger.info(f"  Duplicates Skipped: {total_dups}")

    logger.info(f"\nEnd time: {datetime.now().isoformat()}")
    logger.info("=" * 80)


# =============================================================================
# CLI
# =============================================================================

@click.command()
@click.option(
    '--start-date',
    type=str,
    default=None,
    help='Start date (YYYY-MM-DD). Default: 7 days ago.'
)
@click.option(
    '--end-date',
    type=str,
    default=None,
    help='End date (YYYY-MM-DD). Default: today.'
)
@click.option(
    '--output',
    type=click.Choice(['csv', 'json']),
    default='csv',
    help='Output format.'
)
@click.option(
    '--dry-run',
    is_flag=True,
    help='Validate council configs without scraping.'
)
@click.option(
    '--council',
    type=str,
    default=None,
    help='Scrape only one council by name (e.g., Bromley).'
)
def main(
    start_date: Optional[str],
    end_date: Optional[str],
    output: str,
    dry_run: bool,
    council: Optional[str]
):
    """Production-grade council planning scraper with config-driven extraction."""
    try:
        asyncio.run(run_scraper(start_date, end_date, output, dry_run, council))
    except KeyboardInterrupt:
        logger.info("\nScraper interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
