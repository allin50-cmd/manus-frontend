# Project Memory

## What is UltraCore?

A mobile-first Business Operating System for a UK construction/compliance business. The operator is George, supported by a small team: Dagon, Alissa, Michelle, Chris, Charlie.

The system tracks Work Items (deals, leads, compliance obligations, internal tasks), enables voice-to-work-item capture, sends compliance alerts, manages decisions and actions, and provides portfolio/CRM views.

## Primary personas

- **George** — principal operator. Gets a Morning Briefing on dashboard. Makes decisions. Receives escalations.
- **Team** (Dagon, Alissa, Michelle, Chris, Charlie) — perform actions, log notes, manage work items.

## Key product principles

1. Mobile-first: everything must work on an iPhone
2. UK dates (DD/MM/YYYY), UK spelling
3. Operator is a single entity — no multi-tenant, no public signup
4. Speed over elegance: fast queries, minimal abstraction
5. Voice intake is a first-class feature (iOS mic recording → Whisper → parse → create work item)

## Business domains covered

- **Work Items** — the core entity. Any obligation, lead, task, or alert.
- **Actions** — tasks attached to work items, assigned to team members
- **Decisions** — approval queue for George
- **Activity Log** — append-only audit trail
- **Filings** — compliance deadlines (Companies House, HMRC, etc.)
- **Partnerships** — CRM pipeline (SIP, Construction, Planning stages)
- **Alerts** — delivery system to external recipients
- **Voice Intake** — iOS/Web audio → Whisper transcription → parsed work item draft
- **Templates** — message templates with variable substitution

## Tech stack

- Next.js 14 App Router (server components by default)
- TypeScript
- Tailwind CSS
- Prisma (active ORM)
- Drizzle (schema defined, not yet primary query layer)
- Supabase (PostgreSQL)
- Vercel (deployment)
- OpenAI Whisper API (voice transcription)

## Repository

`allin50-cmd/manus-frontend`
