# UltraCore Ops — Agent Context

## What this is

UltraCore Ops is a **business command hub** for a small advisory firm. It creates, tracks, and audits companies, contacts, work items, filing deadlines, decisions, and compliance alerts. The primary user is "George". Supabase PostgreSQL is the single source of truth — no Google Sheets, no external data sources.

**Product Vision is defined in `CLAUDE.md` — read it before touching any user-facing surface.** In short: this is not an AI app, it's a mobile-first, voice-first business OS that should feel like using an iPhone. Users trigger simple actions ("email the customer", "what's urgent today"); they never see or hear words like agent, workflow, database, API, LLM, or MCP. That vocabulary is fine in this file, in code, and in commit messages — never in UI copy, voice confirmations, or user-facing text.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Database | Supabase PostgreSQL via Prisma ORM |
| Auth | httpOnly JWT cookie (`session`), passcode-based |
| Styling | Tailwind CSS |
| Email | Resend (transactional, optional) + AgentMail (persistent conversational email — approved exception, see `CLAUDE.md` AgentMail Integration Policy) |
| Voice | OpenAI Whisper — transcription only, one input method into the same work-item workflow |
| Deploy | Vercel (serverless Node.js) |

---

## Project layout

```
app/
  api/              ← Next.js API routes (server-only, all use Prisma)
  activity/         ← Audit log page
  alert-events/     ← Alert audit log
  alert-recipients/ ← Recipient management
  alerts/           ← Compliance alerts list + new alert form
  contacts/         ← Contact directory
  dashboard/        ← Compliance dashboard
  decisions/        ← Decision queue
  filings/          ← Filing obligations view
  login/            ← Passcode login
  portfolio/        ← Company portfolio overview
  settings/         ← Change passcode
  teams/            ← Team workload view
  templates/        ← Message/document templates
  today/            ← Today's priority actions
  voice-intake/     ← Audio → Whisper → work item draft
  work-items/       ← Work item CRUD

lib/
  auth.ts           ← JWT session helpers (getSession, requireAuth)
  db.ts             ← Prisma client singleton
  supabase.ts       ← Supabase admin client (lazy init, for storage/realtime if needed)
  alert-dispatch.ts ← Email alert sending via Resend
  work-item-enums.ts← Single source of truth for enum values + labels

prisma/
  schema.prisma     ← Database schema (all tables defined here)
  seed.ts           ← Demo data seed

components/         ← Shared React components
middleware.ts       ← Auth guard (JWT verification on every request)
public/
  prototype.html    ← Standalone UK Companies House demo (localStorage, no backend)
```

---

## Hard rules — do not violate

1. **No Edge runtime on Prisma routes.** Never add `export const runtime = 'edge'` to any file that imports from `lib/db`. All `app/api/` routes run on Node.js.

2. **Auth is server-only.** `JWT_SECRET` is never sent to the client. `secret()` in `lib/auth.ts` throws if `JWT_SECRET` is unset. Every API route calls `getSession()` or `requireAuth()`.

3. **No AI agents or agent frameworks beyond the two approved exceptions.** OpenAI is used only for Whisper transcription (`app/api/voice/transcribe/route.ts`). AgentMail is approved solely for persistent conversational email — drafting, summarisation, threading — scoped to communication mechanics inside a user-triggered, always-logged flow; it never makes autonomous business decisions (see `CLAUDE.md` → AgentMail Integration Policy). No LangChain, no OpenAI Assistants, no other agent framework, and no extending AgentMail into auto-send or agent-initiated outreach without new, separate approval.

4. **No tRPC. No monorepo. No complex RBAC.** Auth is a single shared passcode — no user roles.

5. **DB schema changes** use `prisma db push` only (no Prisma migration files). Run `npx prisma db push` after editing `schema.prisma`.

6. **`prototype.html`** — all JS must be ES5-compatible (no `?.`, no `const`/`let`, no arrow functions). Data persists in `localStorage` under key `fgpro`.

7. **Supabase is the only database.** No Google Sheets, no Neon, no other external data sources.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase pooled connection (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Yes | Supabase direct connection (port 5432) — schema push only |
| `JWT_SECRET` | Yes | Signing session tokens — throws if unset |
| `DEFAULT_PASSCODE` | Yes | Shared login passcode |
| `NEXT_PUBLIC_APP_URL` | Yes | Full deployment URL e.g. `https://your-project.vercel.app` |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key — server-side only |
| `RESEND_API_KEY` | Optional | Email delivery (alerts still show on dashboard without it) |
| `RESEND_FROM_EMAIL` | Optional | Verified sender address |
| `GROQ_API_KEY` | Optional | Voice transcription via Groq Whisper — free tier at console.groq.com |
| `CRON_SECRET` | Optional | Bearer token protecting `/api/alert-escalation-check` |

---

## Data model

```
WorkItem        ← central entity (filing, task, compliance alert, partnership, etc.)
  ├── Action[]          ← sub-tasks
  ├── ActivityLog[]     ← append-only audit trail
  ├── Decision[]        ← decisions awaiting approval
  ├── AlertDelivery[]   ← notification delivery records
  └── VoiceIntake[]     ← audio + transcript + parsed draft

AlertRecipient  ← who gets notified per company (email/dashboard)
  └── AlertDelivery[]

Company         ← portfolio company
  └── Contact[]

Template        ← reusable message bodies
UserPassword    ← scrypt-hashed passcodes per person
```

---

## API routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Passcode login → sets httpOnly JWT cookie |
| POST | `/api/auth/logout` | Clears session cookie |
| POST | `/api/auth/change-password` | Update personal passcode |
| GET/POST | `/api/work-items` | List / create work items |
| GET/PATCH | `/api/work-items/[id]` | Read / update a work item |
| POST | `/api/work-items/[id]/actions` | Add sub-task |
| PATCH | `/api/work-items/[id]/actions/[actionId]` | Update sub-task |
| POST | `/api/work-items/[id]/escalate` | Escalate status |
| POST | `/api/work-items/[id]/log` | Append activity note |
| GET | `/api/dashboard` | Compliance summary (used by dashboard page) |
| GET | `/api/decisions` | Open decisions list |
| PATCH | `/api/decisions/[id]` | Approve / reject / MoreInfoNeeded |
| GET | `/api/portfolio` | Companies with live counts |
| GET/POST | `/api/contacts` | Contact list / create |
| PATCH | `/api/contacts/[id]` | Update contact |
| GET/POST | `/api/alert-recipients` | Recipient management |
| PATCH/DELETE | `/api/alert-recipients/[id]` | Update / deactivate |
| POST | `/api/alert-recipients/[id]/suppress` | Suppress alerts |
| POST | `/api/alert-recipients/[id]/unsuppress` | Lift suppression |
| GET | `/api/alert-deliveries` | Alert delivery log |
| POST | `/api/alert-deliveries/[id]/retry` | Retry failed delivery |
| POST | `/api/alert-deliveries/[id]/acknowledge` | Acknowledge delivery |
| GET | `/api/alert-deliveries/ack` | One-click ack link (no login required) |
| POST | `/api/alert-escalation-check` | Run escalation sweep (cron or manual) |
| POST | `/api/voice/upload` | Store audio |
| POST | `/api/voice/transcribe` | Groq Whisper transcription |
| POST | `/api/voice/approve` | Approve voice draft → create work item |
| POST | `/api/voice/reject` | Discard voice draft |

---

## Development commands

```bash
npm run dev              # Start dev server on :3000
npm run build            # Production build
npm test                 # Run unit tests (vitest)
npx prisma db push       # Push schema to database (uses DIRECT_URL)
npx prisma studio        # Browse database in browser
npx tsc --noEmit         # Type-check only
npm run db:seed          # Seed demo data
```

---

## Branch

Active development branch: `claude/ultracore-sheetops-mvp-wAwwp`
