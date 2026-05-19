#!/usr/bin/env python3
"""
================================================================================
COUNCIL PLANNING APPLICATIONS SCRAPER (v3 - Hardened)
Bromley & Lewisham - Last 7 Days Residential Applications

Fixes vs v2:
  - Two-phase selector discovery: form selectors before submit, result
    selectors after submit (v2 always returned zero records because it
    tried to find result-table selectors on the search-form page).
  - Fixed None-default bug: dict.get(key, default) ignores default when
    the key exists with value None; replaced with `or` operator.
  - Fixed dead else-branch in discover_selectors (selector_group is always
    a str from JSON, so split was never reached).
  - Exponential backoff on retries.
  - Atomic writes for seen_refs.json and CSV (write tmp, rename).
  - seen_refs saved after each council, not just at program end.
  - navigate_next_page waits for networkidle after click.
  - URL extracted from first anchor in each result row.
  - page_has_no_results() distinguishes empty search from broken selector.
  - Per-council hard timeout via asyncio.wait_for (COUNCIL_TIMEOUT_SEC).
  - Circuit breaker: abort run after MAX_CONSECUTIVE_FAILURES.
  - Dry-run submits the form and validates result selectors too.
  - Duplicate-handler guard in logging setup.
  - --max-pages and --verbose CLI flags.
  - Prints NEW_RECORDS=N to stdout for machine-readable parsing by
    run_daily.py (replaces fragile CSV mtime check).
  - v3.1: Lewisham live-run fixes:
    - fill_date_field(): try page.fill first, fall back to JS value injection
      for portals with calendar-picker widgets that block normal interaction.
    - field_patterns in config: per-field regex applied after text extraction,
      needed when reference/status/date are packed into a single .metaInfo
      paragraph rather than separate table cells.
    - click_advanced_search() skips the click if already on advanced page.
    - parse_date() extended with '%a %d %b %Y' (e.g. 'Mon 18 May 2026').
    - ignore_https_errors=True on all browser contexts (government portals
      use certs that the cloud sandbox CA store does not trust).
================================================================================
"""

import asyncio
import logging
import json
import csv
import random
import sys
import urllib.parse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any, Set, Tuple
from dataclasses import dataclass, asdict

import pandas as pd
import click
from playwright.async_api import async_playwright, Page, Browser
from playwright.async_api import TimeoutError as PlaywrightTimeoutError


# =============================================================================
# CONFIGURATION & CONSTANTS
# =============================================================================

CONFIG_FILE = Path(__file__).parent / 'councils_config.json'
SEEN_REFS_FILE = Path.cwd() / 'seen_refs.json'
OUTPUT_FILE = Path.cwd() / 'planning_records.csv'
OUTPUT_JSON_FILE = Path.cwd() / 'planning_records.json'

RETRY_ATTEMPTS = 3
BASE_RETRY_DELAY = 1.0       # seconds; doubled each attempt
PAGE_TIMEOUT = 30_000        # ms
NETWORK_IDLE_TIMEOUT = 20_000
COUNCIL_TIMEOUT_SEC = 600    # 10 min hard limit per council
MAX_CONSECUTIVE_FAILURES = 3
DEFAULT_MAX_PAGES = 50

# Selectors expected to exist on the search form (before submit)
FORM_SELECTOR_KEYS = {'advanced_search', 'date_from', 'date_to', 'submit_button'}

# Selectors expected to exist on the results page (after submit)
RESULT_SELECTOR_KEYS = {
    'results_container', 'reference_cell', 'address_cell',
    'description_cell', 'status_cell', 'date_validated_cell', 'next_page',
}

# Playwright locators that indicate a genuine empty result set
NO_RESULTS_LOCATORS = [
    "text=No results found",
    "text=No applications found",
    "text=Your search returned no results",
    "text=0 results",
    "text=no planning applications",
    "[class*='no-result']",
    "[id*='no-result']",
]

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

def setup_logging(verbose: bool = False) -> logging.Logger:
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(
            level=logging.DEBUG if verbose else logging.INFO,
            format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S',
        )
    elif verbose:
        root.setLevel(logging.DEBUG)
    return logging.getLogger(__name__)


logger = setup_logging()


# =============================================================================
# DATA MODELS
# =============================================================================

@dataclass
class PlanningRecord:
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
        return f"{self.council}:{self.reference}"


@dataclass
class CouncilStats:
    council: str
    total_found: int = 0
    new_records: int = 0
    duplicates_skipped: int = 0
    pages_scraped: int = 0
    errors: int = 0
    error_message: str = ""
    no_results: bool = False

    def failed(self) -> bool:
        return bool(self.error_message)


# =============================================================================
# UTILITIES
# =============================================================================

def load_config() -> Dict[str, Any]:
    if not CONFIG_FILE.exists():
        logger.error(f"Config file not found: {CONFIG_FILE}")
        sys.exit(1)
    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)
    logger.info(f"Loaded config with {len(config.get('councils', []))} councils")
    return config


def load_seen_refs() -> Set[str]:
    if not SEEN_REFS_FILE.exists():
        return set()
    with open(SEEN_REFS_FILE, 'r') as f:
        seen = json.load(f)
    logger.debug(f"Loaded {len(seen)} previously seen references")
    return set(seen)


def save_seen_refs(seen_refs: Set[str]) -> None:
    """Atomic write: write to .tmp then rename so a crash never corrupts the file."""
    tmp = SEEN_REFS_FILE.with_suffix('.tmp')
    try:
        with open(tmp, 'w') as f:
            json.dump(sorted(list(seen_refs)), f, indent=2)
        tmp.replace(SEEN_REFS_FILE)
    finally:
        if tmp.exists():
            tmp.unlink(missing_ok=True)
    logger.debug(f"Saved {len(seen_refs)} references")


async def exponential_backoff(attempt: int, base: float = BASE_RETRY_DELAY, cap: float = 30.0) -> None:
    delay = min(base * (2 ** attempt) + random.uniform(0, 0.5), cap)
    logger.debug(f"Backoff {delay:.1f}s (attempt {attempt + 1})")
    await asyncio.sleep(delay)


async def realistic_delay(min_sec: float = 0.5, max_sec: float = 2.5) -> None:
    await asyncio.sleep(random.uniform(min_sec, max_sec))


def clean_text(raw: Optional[str]) -> str:
    if not raw:
        return ""
    cleaned = ''.join(ch for ch in raw if ch.isprintable() or ch.isspace())
    return ' '.join(cleaned.split())


def calculate_date_range(start_date: Optional[str], end_date: Optional[str]) -> Tuple[str, str]:
    to_date = datetime.strptime(end_date, '%Y-%m-%d') if end_date else datetime.now()
    from_date = datetime.strptime(start_date, '%Y-%m-%d') if start_date else to_date - timedelta(days=7)
    start_str, end_str = from_date.strftime('%d/%m/%Y'), to_date.strftime('%d/%m/%Y')
    logger.info(f"Date range: {start_str} to {end_str}")
    return start_str, end_str


def parse_date(date_str: str) -> str:
    if not date_str:
        return ""
    date_str = clean_text(date_str)
    for fmt in [
        '%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d',
        '%d %b %Y', '%d %B %Y',
        '%a %d %b %Y', '%A %d %b %Y',   # e.g. "Mon 18 May 2026"
    ]:
        try:
            return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
        except ValueError:
            pass
    return date_str


def atomic_write_csv(records: List[PlanningRecord], output_path: Path) -> None:
    """Write CSV atomically: write to .tmp then rename."""
    tmp = output_path.with_suffix('.tmp')
    try:
        df = pd.DataFrame([r.to_dict() for r in records])
        df.to_csv(tmp, index=False, quoting=csv.QUOTE_ALL, encoding='utf-8')
        tmp.replace(output_path)
        logger.info(f"Data saved: {output_path} ({len(df)} rows)")
    except Exception:
        if tmp.exists():
            tmp.unlink(missing_ok=True)
        raise


# =============================================================================
# SELECTOR DISCOVERY
# =============================================================================

async def _selector_visible(page: Page, selector: str, timeout: int = 3000) -> bool:
    try:
        return await page.locator(selector).first.is_visible(timeout=timeout)
    except Exception:
        return False


async def discover_selectors(
    page: Page,
    council_config: Dict[str, Any],
    keys: Optional[Set[str]] = None,
) -> Dict[str, Optional[str]]:
    """
    For each field in keys (or all fields if keys is None), try each
    comma-separated fallback selector in order and return the first visible one.

    Each config value like "a:has-text('Search'), a[href*='adv']" is split on
    ", " so alternatives are tried individually rather than as a combined CSS
    selector — this lets us report exactly which sub-selector matched.
    """
    discovered: Dict[str, Optional[str]] = {}
    all_selectors = council_config.get('selectors', {})

    for field, selector_group in all_selectors.items():
        if keys and field not in keys:
            continue

        candidates = [s.strip() for s in selector_group.split(', ') if s.strip()]
        found: Optional[str] = None
        for candidate in candidates:
            if await _selector_visible(page, candidate):
                found = candidate
                break

        discovered[field] = found
        if found:
            logger.debug(f"  [ok] {field}: {found}")
        else:
            logger.debug(f"  [--] {field}: not found on current page")

    return discovered


# =============================================================================
# PAGE STATE HELPERS
# =============================================================================

async def page_has_no_results(page: Page) -> bool:
    """Return True if the page explicitly says no results were found."""
    for locator in NO_RESULTS_LOCATORS:
        try:
            if await page.locator(locator).first.is_visible(timeout=1_500):
                return True
        except Exception:
            pass
    return False


async def fill_date_field(page: Page, selector: str, value: str, use_js: bool = False) -> None:
    """
    Fill a date input. Falls back to JavaScript direct value injection when
    a date-picker widget intercepts the normal fill interaction.
    The `selector` must be an id-based selector (e.g. '#myId') for the JS
    fallback path; other selector types skip the fallback gracefully.
    """
    if use_js:
        elem_id = selector.lstrip('#')
        await page.evaluate(f"document.getElementById('{elem_id}').value = '{value}'")
        return
    try:
        await page.fill(selector, value, timeout=5_000)
    except Exception:
        elem_id = selector.lstrip('#')
        if elem_id:
            logger.debug(f"page.fill({selector}) failed — using JS injection")
            await page.evaluate(f"document.getElementById('{elem_id}').value = '{value}'")
        else:
            raise


async def click_advanced_search(page: Page, council_config: Dict[str, Any]) -> None:
    """Click the Advanced Search link if configured and not already on that page."""
    if 'action=advanced' in page.url:
        return   # already on the advanced search form
    raw = council_config.get('selectors', {}).get('advanced_search', '')
    for candidate in [s.strip() for s in raw.split(', ') if s.strip()]:
        try:
            el = page.locator(candidate).first
            if await el.is_visible(timeout=4_000):
                logger.info("Clicking Advanced Search…")
                await el.click()
                await realistic_delay(1.0, 2.0)
                return
        except Exception:
            pass


# =============================================================================
# EXTRACTION
# =============================================================================

async def _cell_text(
    row,
    selector: Optional[str],
    fallback: str,
    field: str,
    pattern: Optional[str] = None,
) -> str:
    """
    Extract text from a cell. Uses `selector or fallback` so that a None
    discovered selector falls through to the positional fallback — unlike
    dict.get(key, default) which ignores the default when the key exists
    with value None.

    If `pattern` is given, it is applied as a regex and the first capture
    group (or full match) is returned. This is needed when multiple fields
    share the same element (e.g. Idox's .metaInfo paragraph that contains
    reference number, dates, and status in a single block of text).
    """
    import re as _re
    effective = selector or fallback
    try:
        text = clean_text(await row.locator(effective).first.text_content(timeout=3_000))
        if pattern and text:
            m = _re.search(pattern, text, _re.IGNORECASE)
            if m:
                return (m.group(1) if m.groups() else m.group(0)).strip()
        return text
    except Exception as e:
        logger.debug(f"  cell[{field}] ({effective}): {e}")
        return ""


async def _row_url(row, base_url: str) -> str:
    try:
        href = await row.locator('a').first.get_attribute('href', timeout=2_000)
        return urllib.parse.urljoin(base_url, href) if href else ""
    except Exception:
        return ""


async def extract_results(
    page: Page,
    council_name: str,
    result_selectors: Dict[str, Optional[str]],
    field_patterns: Optional[Dict[str, str]] = None,
) -> List[PlanningRecord]:
    fp = field_patterns or {}
    records: List[PlanningRecord] = []

    results_selector = result_selectors.get('results_container')
    if not results_selector:
        if await page_has_no_results(page):
            logger.info(f"{council_name}: search returned no results for this date range")
        else:
            logger.warning(f"{council_name}: results_container selector not found after search")
        return records

    try:
        row_count = await page.locator(results_selector).count()
        logger.info(f"{council_name}: {row_count} rows on page")
        base_url = page.url

        for i in range(row_count):
            try:
                row = page.locator(results_selector).nth(i)

                ref = await _cell_text(row, result_selectors.get('reference_cell'), 'td:nth-child(1)', 'ref',
                                       fp.get('reference_cell'))
                if not ref or len(ref.strip()) < 3:
                    continue

                records.append(PlanningRecord(
                    council=council_name,
                    reference=ref,
                    address=await _cell_text(row, result_selectors.get('address_cell'), 'td:nth-child(2)', 'addr',
                                            fp.get('address_cell')),
                    description=await _cell_text(row, result_selectors.get('description_cell'), 'td:nth-child(3)', 'desc',
                                                fp.get('description_cell')),
                    status=await _cell_text(row, result_selectors.get('status_cell'), 'td:nth-child(4)', 'status',
                                           fp.get('status_cell')),
                    date_validated=parse_date(
                        await _cell_text(row, result_selectors.get('date_validated_cell'), 'td:nth-child(5)', 'date',
                                         fp.get('date_validated_cell'))
                    ),
                    url=await _row_url(row, base_url),
                ))
                logger.debug(f"  + {ref}")

            except Exception as e:
                logger.debug(f"  row {i}: {e}")

    except Exception as e:
        logger.error(f"{council_name}: extract_results error: {e}")

    return records


async def navigate_next_page(page: Page, council_config: Dict[str, Any]) -> bool:
    next_selector = council_config.get('selectors', {}).get('next_page')
    if not next_selector:
        return False
    try:
        btn = page.locator(next_selector).first
        if await btn.is_visible(timeout=3_000) and await btn.is_enabled(timeout=3_000):
            await btn.click()
            await realistic_delay(1.0, 2.5)
            await page.wait_for_load_state('networkidle', timeout=NETWORK_IDLE_TIMEOUT)
            return True
    except Exception as e:
        logger.debug(f"No next page: {e}")
    return False


# =============================================================================
# DRY-RUN
# =============================================================================

async def dry_run_council(
    browser: Browser,
    council_config: Dict[str, Any],
    start_date: str,
    end_date: str,
) -> Dict[str, Any]:
    """
    Validate both form and result selectors by actually submitting a test
    search (read-only — no writes anywhere).
    """
    council_name = council_config.get('name')
    url = council_config.get('url')
    logger.info(f"\n{'='*80}\nDRY-RUN: {council_name}\n{'='*80}")

    report: Dict[str, Any] = {
        'council': council_name,
        'url': url,
        'form_selectors': {},
        'result_selectors': {},
        'errors': [],
        'timestamp': datetime.now().isoformat(),
    }

    ctx = await browser.new_context(
        user_agent=random.choice(USER_AGENTS),
        viewport=random.choice(VIEWPORTS),
        locale='en-GB',
        timezone_id='Europe/London',
        ignore_https_errors=True,
    )
    page = await ctx.new_page()

    try:
        try:
            await page.goto(url, timeout=PAGE_TIMEOUT, wait_until='domcontentloaded')
        except PlaywrightTimeoutError:
            report['errors'].append(f"Page load timeout: {url}")
            return report

        await realistic_delay(1.0, 2.0)
        await click_advanced_search(page, council_config)

        # Phase 1: form selectors
        logger.info("Checking form selectors…")
        form = await discover_selectors(page, council_config, FORM_SELECTOR_KEYS)
        report['form_selectors'] = form

        missing_form = [k for k, v in form.items() if not v]
        if missing_form:
            report['errors'].append(f"Missing form selectors: {', '.join(missing_form)}")

        # Phase 2: submit test search, then check result selectors
        df_sel = form.get('date_from')
        dt_sel = form.get('date_to')
        sb_sel = form.get('submit_button')

        if df_sel and dt_sel and sb_sel:
            logger.info("Submitting test search to validate result selectors…")
            use_js = council_config.get('date_input_js', False)
            try:
                await fill_date_field(page, df_sel, start_date, use_js=use_js)
                await fill_date_field(page, dt_sel, end_date, use_js=use_js)
                await page.click(sb_sel)
                await page.wait_for_load_state('networkidle', timeout=NETWORK_IDLE_TIMEOUT)
                await realistic_delay(1.0, 2.0)
                result = await discover_selectors(page, council_config, RESULT_SELECTOR_KEYS)
                report['result_selectors'] = result
                missing_result = [k for k, v in result.items() if not v and k != 'next_page']
                if missing_result:
                    report['errors'].append(f"Missing result selectors: {', '.join(missing_result)}")
            except Exception as e:
                report['errors'].append(f"Test search failed: {e}")
        else:
            report['errors'].append("Skipped result selector check: form selectors incomplete")

        logger.info(f"Dry-run complete. Errors: {len(report['errors'])}")

    except Exception as e:
        logger.error(f"Dry-run error: {e}")
        report['errors'].append(str(e))
    finally:
        await page.close()
        await ctx.close()

    return report


# =============================================================================
# SCRAPE A SINGLE COUNCIL
# =============================================================================

async def _scrape_inner(
    browser: Browser,
    council_config: Dict[str, Any],
    start_date: str,
    end_date: str,
    seen_refs: Set[str],
    max_pages: int,
) -> Tuple[List[PlanningRecord], CouncilStats]:
    council_name = council_config.get('name', 'Unknown')
    url = council_config.get('url', '')
    logger.info(f"\n{'='*80}\nSCRAPING: {council_name}\n{'='*80}")

    stats = CouncilStats(council=council_name)
    all_records: List[PlanningRecord] = []

    ctx = await browser.new_context(
        user_agent=random.choice(USER_AGENTS),
        viewport=random.choice(VIEWPORTS),
        locale='en-GB',
        timezone_id='Europe/London',
        ignore_https_errors=True,
    )
    page = await ctx.new_page()

    try:
        # ── Phase 1: navigate ────────────────────────────────────────────── #
        loaded = False
        for attempt in range(RETRY_ATTEMPTS):
            try:
                logger.info(f"Navigating to {url}… (attempt {attempt + 1})")
                await page.goto(url, timeout=PAGE_TIMEOUT, wait_until='domcontentloaded')
                loaded = True
                break
            except PlaywrightTimeoutError:
                if attempt < RETRY_ATTEMPTS - 1:
                    await exponential_backoff(attempt)

        if not loaded:
            stats.error_message = f"Failed to load {url} after {RETRY_ATTEMPTS} attempts"
            stats.errors += 1
            return all_records, stats

        await realistic_delay(1.5, 2.5)
        await click_advanced_search(page, council_config)

        # ── Phase 2: discover FORM selectors, fill dates, submit ─────────── #
        logger.info("Discovering form selectors…")
        form_sel = await discover_selectors(page, council_config, FORM_SELECTOR_KEYS)

        submit_sel = form_sel.get('submit_button')
        if not submit_sel:
            stats.error_message = "Submit button not found"
            stats.errors += 1
            return all_records, stats

        use_js_date = council_config.get('date_input_js', False)
        field_patterns = council_config.get('field_patterns', {})

        for attempt in range(RETRY_ATTEMPTS):
            try:
                if form_sel.get('date_from'):
                    await fill_date_field(page, form_sel['date_from'], start_date, use_js=use_js_date)
                    await realistic_delay(0.2, 0.6)
                if form_sel.get('date_to'):
                    await fill_date_field(page, form_sel['date_to'], end_date, use_js=use_js_date)
                    await realistic_delay(0.2, 0.6)
                break
            except Exception as e:
                logger.warning(f"Date fill failed (attempt {attempt + 1}): {e}")
                if attempt < RETRY_ATTEMPTS - 1:
                    await exponential_backoff(attempt)

        for attempt in range(RETRY_ATTEMPTS):
            try:
                logger.info("Submitting search…")
                await page.click(submit_sel)
                await realistic_delay(1.5, 3.0)
                await page.wait_for_load_state('networkidle', timeout=NETWORK_IDLE_TIMEOUT)
                break
            except Exception as e:
                logger.warning(f"Submit failed (attempt {attempt + 1}): {e}")
                if attempt < RETRY_ATTEMPTS - 1:
                    await exponential_backoff(attempt)

        # ── Phase 3: discover RESULT selectors on the results page ───────── #
        logger.info("Discovering result selectors…")
        result_sel = await discover_selectors(page, council_config, RESULT_SELECTOR_KEYS)

        if not result_sel.get('results_container'):
            if await page_has_no_results(page):
                logger.info(f"{council_name}: no results for this date range")
                stats.no_results = True
                return all_records, stats
            logger.warning(f"{council_name}: results_container not found — will attempt extraction anyway")
            stats.errors += 1

        # ── Phase 4: paginate and extract ────────────────────────────────── #
        page_num = 1
        while True:
            logger.info(f"Extracting page {page_num}…")
            try:
                await page.wait_for_load_state('networkidle', timeout=NETWORK_IDLE_TIMEOUT)
            except PlaywrightTimeoutError:
                logger.warning(f"Page {page_num} load timeout — proceeding")

            rows = await extract_results(page, council_name, result_sel, field_patterns)
            logger.info(f"  page {page_num}: {len(rows)} raw rows")

            for rec in rows:
                key = rec.dedupe_key()
                stats.total_found += 1
                if key in seen_refs:
                    stats.duplicates_skipped += 1
                else:
                    all_records.append(rec)
                    seen_refs.add(key)
                    stats.new_records += 1

            stats.pages_scraped = page_num

            if page_num >= max_pages:
                logger.warning(f"{council_name}: reached {max_pages}-page limit")
                break
            if not await navigate_next_page(page, council_config):
                break
            page_num += 1

        logger.info(
            f"{council_name}: done — new={stats.new_records} "
            f"dupes={stats.duplicates_skipped} pages={stats.pages_scraped}"
        )

    except asyncio.CancelledError:
        stats.error_message = "Cancelled (per-council timeout)"
        stats.errors += 1
        raise
    except Exception as e:
        logger.error(f"{council_name}: critical error: {e}", exc_info=True)
        stats.error_message = str(e)
        stats.errors += 1
    finally:
        await page.close()
        await ctx.close()

    return all_records, stats


async def scrape_council(
    browser: Browser,
    council_config: Dict[str, Any],
    start_date: str,
    end_date: str,
    seen_refs: Set[str],
    max_pages: int,
) -> Tuple[List[PlanningRecord], CouncilStats]:
    """Wraps _scrape_inner with a per-council hard timeout."""
    try:
        return await asyncio.wait_for(
            _scrape_inner(browser, council_config, start_date, end_date, seen_refs, max_pages),
            timeout=COUNCIL_TIMEOUT_SEC,
        )
    except asyncio.TimeoutError:
        name = council_config.get('name', 'Unknown')
        logger.error(f"{name}: timed out after {COUNCIL_TIMEOUT_SEC}s")
        return [], CouncilStats(council=name, error_message=f"timeout after {COUNCIL_TIMEOUT_SEC}s")


# =============================================================================
# MAIN ORCHESTRATION
# =============================================================================

async def run_scraper(
    start_date: Optional[str],
    end_date: Optional[str],
    output_format: str,
    dry_run: bool,
    council_filter: Optional[str],
    max_pages: int,
    verbose: bool,
) -> None:
    setup_logging(verbose)

    logger.info("=" * 80)
    logger.info(f"Council Planning Scraper v3 — {'DRY-RUN' if dry_run else 'LIVE MODE'}")
    logger.info(f"Start: {datetime.now().isoformat()}")
    logger.info("=" * 80)

    config = load_config()
    councils = config.get('councils', [])

    if council_filter:
        councils = [c for c in councils if c.get('name', '').lower() == council_filter.lower()]
        if not councils:
            logger.error(f"Council not found: {council_filter}")
            sys.exit(1)

    enabled = [c for c in councils if c.get('enabled', True)]
    logger.info(f"Processing {len(enabled)} council(s)")

    start_str, end_str = calculate_date_range(start_date, end_date)
    seen_refs = load_seen_refs()

    all_records: List[PlanningRecord] = []
    all_stats: List[CouncilStats] = []
    dry_reports: List[Dict[str, Any]] = []
    consecutive_failures = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled', '--disable-gpu'],
        )
        try:
            for council_config in enabled:
                name = council_config.get('name', 'Unknown')
                try:
                    if dry_run:
                        report = await dry_run_council(browser, council_config, start_str, end_str)
                        dry_reports.append(report)
                    else:
                        records, stats = await scrape_council(
                            browser, council_config, start_str, end_str, seen_refs, max_pages
                        )
                        all_records.extend(records)
                        all_stats.append(stats)

                        # Persist dedup state after each council so a crash
                        # mid-run doesn't re-scrape already-processed councils.
                        if not stats.failed():
                            save_seen_refs(seen_refs)
                            consecutive_failures = 0
                        else:
                            consecutive_failures += 1
                            if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
                                logger.error(
                                    f"Aborting: {consecutive_failures} consecutive council failures"
                                )
                                break

                except Exception as e:
                    logger.error(f"Unhandled error for {name}: {e}", exc_info=True)
                    all_stats.append(CouncilStats(council=name, error_message=str(e)))
                    consecutive_failures += 1
                    if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
                        logger.error("Aborting: too many consecutive failures")
                        break

                await realistic_delay(1.0, 2.0)
        finally:
            await browser.close()

    # ── Output ────────────────────────────────────────────────────────────── #
    if dry_run:
        logger.info("\n" + "=" * 80)
        logger.info("DRY-RUN VALIDATION REPORT")
        logger.info("=" * 80)
        for report in dry_reports:
            form_ok = sum(1 for v in report.get('form_selectors', {}).values() if v)
            form_total = len(report.get('form_selectors', {}))
            res_ok = sum(1 for v in report.get('result_selectors', {}).values() if v)
            res_total = len(report.get('result_selectors', {}))
            logger.info(f"\n{report['council']}:")
            logger.info(f"  URL: {report['url']}")
            logger.info(f"  Form selectors:   {form_ok}/{form_total}")
            logger.info(f"  Result selectors: {res_ok}/{res_total}")
            for err in report['errors']:
                logger.warning(f"  ! {err}")
            if not report['errors']:
                logger.info("  All validations passed")
    else:
        save_seen_refs(seen_refs)

        total_new = total_found = total_dups = 0
        for stats in all_stats:
            if stats.failed():
                logger.error(f"{stats.council}: FAILED — {stats.error_message}")
            elif stats.no_results:
                logger.info(f"{stats.council}: no results for date range")
            else:
                total_found += stats.total_found
                total_new += stats.new_records
                total_dups += stats.duplicates_skipped

        if all_records:
            try:
                if output_format == 'csv':
                    atomic_write_csv(all_records, OUTPUT_FILE)
                elif output_format == 'json':
                    tmp = OUTPUT_JSON_FILE.with_suffix('.tmp')
                    try:
                        with open(tmp, 'w') as f:
                            json.dump([r.to_dict() for r in all_records], f, indent=2)
                        tmp.replace(OUTPUT_JSON_FILE)
                        logger.info(f"Data saved: {OUTPUT_JSON_FILE} ({len(all_records)} records)")
                    finally:
                        if tmp.exists():
                            tmp.unlink(missing_ok=True)
            except Exception as e:
                logger.error(f"Output write failed: {e}")
        else:
            logger.warning("No new records found")

        logger.info("\n" + "=" * 80)
        logger.info("SUMMARY")
        logger.info("=" * 80)
        for stats in all_stats:
            if stats.failed():
                logger.error(f"  {stats.council}: FAILED — {stats.error_message}")
            elif stats.no_results:
                logger.info(f"  {stats.council}: no results")
            else:
                logger.info(
                    f"  {stats.council}: "
                    f"found={stats.total_found} new={stats.new_records} "
                    f"dupes={stats.duplicates_skipped} pages={stats.pages_scraped}"
                )
        logger.info(f"\n  Grand total — found={total_found} new={total_new} dupes={total_dups}")

        # Machine-readable line parsed by run_daily.py
        print(f"NEW_RECORDS={total_new}")

    logger.info(f"\nEnd: {datetime.now().isoformat()}")
    logger.info("=" * 80)


# =============================================================================
# CLI
# =============================================================================

@click.command()
@click.option('--start-date', default=None, help='YYYY-MM-DD (default: 7 days ago)')
@click.option('--end-date', default=None, help='YYYY-MM-DD (default: today)')
@click.option('--output', type=click.Choice(['csv', 'json']), default='csv')
@click.option('--dry-run', is_flag=True, help='Validate configs without scraping')
@click.option('--council', default=None, help='Scrape one council only (e.g. Bromley)')
@click.option('--max-pages', default=DEFAULT_MAX_PAGES, show_default=True,
              help='Pagination safety limit per council')
@click.option('--verbose', '-v', is_flag=True, help='Enable DEBUG logging')
def main(
    start_date: Optional[str],
    end_date: Optional[str],
    output: str,
    dry_run: bool,
    council: Optional[str],
    max_pages: int,
    verbose: bool,
) -> None:
    """Council planning scraper v3 — hardened against selector drift and network failures."""
    try:
        asyncio.run(run_scraper(start_date, end_date, output, dry_run, council, max_pages, verbose))
    except KeyboardInterrupt:
        logger.info("\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
