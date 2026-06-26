# Pilot Metrics Dashboard

> UltraTechOS Commercial Validation Programme
> Last updated: 2026-06-26
>
> Track only measurable outcomes. Leave blank until measured.
> Do not estimate. Do not project.

---

## Measurement Principle

Every metric in this dashboard must come from a real measurement:
- A system record (ut_activity_events, os_tasks, os_quotes, etc.)
- A direct observation (screenshot, export, manual count)
- A customer response (NPS survey, conversation note)

**No estimates. No projections. No "approximately".**

---

## Weekly Admin Hours Saved

| Pilot Business | Week | Hours Saved | Method | Evidence |
|---|---|---|---|---|
| — | — | — | — | — |

*Measurement method: Before/after time diary, or customer self-report.*

---

## Compliance Improvement

| Pilot Business | Metric | Before | After | Date | Evidence |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

*E.g. number of missed deadlines, late filings, overdue follow-ups.*

---

## Customer Response Time

| Pilot Business | Average Response Time (Before) | Average Response Time (After) | Date | Evidence |
|---|---|---|---|---|
| — | — | — | — | — |

*Measurement method: Time from enquiry received to first response, from call logs or messages.*

---

## Weekly Active Usage

| Week | Active Users | App Opens | Work Items Created | Tasks Completed | Evidence |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

*Source: ut_daily_metrics table (requires migration 0007 applied).*

---

## Net Promoter Score (NPS)

| Date | Pilot Group | Score | Respondents | Evidence |
|---|---|---|---|---|
| — | — | — | — | — |

*Method: Single-question NPS survey sent to pilot businesses.*

---

## Revenue

| Month | Product | Revenue (£) | Customers | Source | Evidence |
|---|---|---|---|---|---|
| — | FineGuard | — | — | Stripe | — |
| — | Apps (Quote Builder) | — | — | Stripe | — |

---

## Conversion

| App / Product | Visitors | Started | Submitted | Converted to Paid | Date | Evidence |
|---|---|---|---|---|---|---|
| AI Receptionist | — | — | — | — | — | — |
| Quote Builder | — | — | — | — | — | — |
| Appointment Booking | — | — | — | — | — | — |

*Source: ut_activity_events with eventType = 'app_submitted' and metadata.app*

---

## Retention

| Month | Product | Paying Customers (Start) | Churned | Retained | Retention % | Evidence |
|---|---|---|---|---|---|---|
| — | FineGuard | — | — | — | — | — |

---

## Data Collection Status

| Metric | Collection Method | Status |
|---|---|---|
| Weekly admin hours saved | Manual — pilot customer interview | Not started |
| Compliance improvement | Manual — before/after count | Not started |
| Customer response time | Automated — call log timestamps | Ready (pending data) |
| Weekly active usage | Automated — ut_daily_metrics | Pending migration 0007 |
| NPS | Manual — survey | Not started |
| Revenue | Automated — Stripe | Live (no data yet) |
| Conversion | Automated — ut_activity_events | Live (pending migration 0007) |
| Retention | Automated — Stripe | Live (no data yet) |
