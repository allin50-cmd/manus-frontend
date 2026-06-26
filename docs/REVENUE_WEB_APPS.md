# Revenue Web Apps

> Public-facing customer tools powered by the UltraTechOS spine.
> Created: 2026-06-26

---

## Overview

UltraTechOS is the hidden framework. Customers see useful tools.

Each app is a small, phone-friendly, standalone web tool that solves one problem. Every submission writes into the UltraTechOS data spine where possible.

Route prefix: `/apps/`

---

## Phase 1 — Live Apps

### 1. AI Receptionist

| Field | Value |
|---|---|
| Route | `/apps/receptionist` |
| Target customer | Tradespeople, sole traders, small teams |
| Problem solved | Missing customer calls while on the job |
| MVP flow | Business name → contact number → duties → fallback email → confirmation |
| Price idea | From £29/month |
| UltraTechOS engine | `work_items` table (type=Other, status=Captured) |
| Tracking | `app_submitted` event with `metadata.app = 'receptionist'` |
| What is manual now | Human review and outreach from George |
| What can be automated | AI call handling, message forwarding, appointment booking trigger |

**Spine mapping:**
- Submission → `work_items` record (title: "Receptionist Setup: [Business]")
- Company field: business name
- Notes: duties selected, fallback email, contact number

---

### 2. Quote Builder

| Field | Value |
|---|---|
| Route | `/apps/quote-builder` |
| Target customer | Builders, tradespeople, small contractors |
| Problem solved | Writing professional quotes quickly without spreadsheets |
| MVP flow | Customer → contact → job description → labour + materials → notes → confirmation with total |
| Price idea | Free to start (upsell to paid at quote storage limit) |
| UltraTechOS engine | `os_quotes` table |
| Tracking | `app_submitted` event with `metadata.app = 'quote-builder'` |
| What is manual now | Quote follow-up, PDF generation, sending |
| What can be automated | PDF export, email delivery, status tracking, invoice conversion |

**Spine mapping:**
- Submission → `os_quotes` record (status: Draft)
- Quote number format: `QB-YYYYMMDD-XXXX`
- Labour/materials split stored in notes
- Customer email detected from contact field

---

### 3. Appointment Booking

| Field | Value |
|---|---|
| Route | `/apps/booking` |
| Target customer | Any business owner who visits customers or books jobs |
| Problem solved | Logging appointments without a paper diary or spreadsheet |
| MVP flow | Customer → contact → date/time → location → notes → confirmation with reference |
| Price idea | Free to start |
| UltraTechOS engine | `os_tasks` table |
| Tracking | `app_submitted` event with `metadata.app = 'booking'` |
| What is manual now | Diary management, travel planning, reminders |
| What can be automated | Travel time calculation, maps integration, parking lookup, route optimisation, reminder SMS |

**Spine mapping:**
- Submission → `os_tasks` record (status: Open, assignedTo: George)
- Title: "Appointment: [Customer] — [Date] at [Time]"
- `dueAt`: date + time combined as timestamp
- Location and contact stored in notes

**TODO (documented in code):**
- Travel time calculation
- Maps integration
- Parking lookup
- Route optimisation

---

## Phase 2 — Planned Apps

### 4. Website Lead Capture
- Route: `/apps/lead-capture`
- Engine: `os_people` + `work_items` tables
- Target: Businesses with a website who want enquiries logged automatically

### 5. FineGuard Compliance
- Route: `/apps/fineguard` → redirects to `/check`
- Engine: existing FineGuard workflow (isolated, do not modify)
- Target: UK company directors and compliance officers

### 6. Business Money
- Route: `/apps/business-money`
- Engine: `os_quotes` + `os_invoices` tables
- Target: Freelancers and tradespeople who need invoicing

### 7. Legal Docs
- Route: `/apps/legal-docs`
- Engine: `os_documents` table (VaultLine)
- Target: Small businesses who need basic contracts

---

## Architecture

All apps share:
- Public layout: `app/apps/layout.tsx`
- No UltraTechOS auth required (public routes)
- Middleware: `/apps` and `/api/apps` added to PUBLIC list
- Tracking: `app_submitted` event in `ut_activity_events`

All API routes are under `app/api/apps/`:
- `POST /api/apps/receptionist` → `work_items`
- `POST /api/apps/quote` → `os_quotes`
- `POST /api/apps/booking` → `os_tasks`

---

## Event Tracking

New event types added to `lib/ut-tracker.ts`:
- `app_page_view` — when a user views an app page (future)
- `app_started` — when a user begins filling a form (future)
- `app_submitted` — when a form is successfully submitted

All tracking is fire-and-forget and never blocks form submission.

---

## Navigation

Apps are NOT added to the main OS navigation. Entry point is `/apps` (public index).
