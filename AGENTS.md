# FineGuard — Agent Context (AGENTS.md)

## What this is

FineGuard is a **UK Companies House compliance management platform** for a small advisory firm. It tracks work items, filing deadlines, decisions, alert recipients, and voice-captured actions. The primary user is "George" (a compliance manager).

There is also a standalone HTML prototype at `public/prototype.html` — a self-contained single-file app with localStorage persistence used for client demos.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Database | PostgreSQL via Prisma ORM |
| Auth | httpOnly JWT cookie (`session`), passcode-based |
| Styling | Tailwind CSS |
| Email | Resend |
| Voice | OpenAI Whisper (transcription only) |
| Mobile | Expo (React Native) in `mobile/` |
| Deploy | Vercel + Neon PostgreSQL |

---

## Project layout

```
app/
  api/              ← Next.js API routes (server-only, Prisma)
  (pages)/          ← Next.js page components
lib/
  auth.ts           ← JWT session helpers (getSession, requireSession)
  db.ts             ← Prisma client singleton
prisma/
  schema.prisma     ← Single source of truth for DB schema
mobile/
  app/(tabs)/       ← Expo tab screens
  lib/api.ts        ← Mobile API client (cookie-based auth)
public/
  prototype.html    ← Standalone demo app (no build required)
```

---

## Key rules — read before changing anything

1. **No Edge runtime on Prisma routes.** All `app/api/` routes run on Node.js runtime. Never add `export const runtime = 'edge'` to any file that imports from `lib/db`.

2. **Auth is server-only.** `JWT_SECRET` is never exposed to the client. The `secret()` function in `lib/auth.ts` throws if `JWT_SECRET` is unset. Every API route that needs auth calls `getSession()` or `requireSession()`.

3. **No AI agents.** Do not add LangChain, OpenAI Assistants, or any agent framework. OpenAI is used only for Whisper transcription in `app/api/voice/transcribe/route.ts`.

4. **No complex RBAC.** Auth is a single shared passcode. There are no user roles.

5. **DB schema changes** use `prisma db push` (no migration files). Run `npx prisma db push` after editing `schema.prisma`.

6. **prototype.html** is a single self-contained file. All JavaScript must be ES5-compatible (no `?.`, no `const`/`let`, no arrow functions, no template literals in the script block). Data persists in `localStorage` under key `fgpro`.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL pooled connection |
| `DIRECT_URL` | Yes | Neon direct connection (for `prisma db push`) |
| `JWT_SECRET` | Yes | Signing session tokens (min 32 chars) |
| `DEFAULT_PASSCODE` | Yes | App login passcode |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL e.g. `https://app.vercel.app` |
| `RESEND_API_KEY` | Optional | Email alert delivery |
| `RESEND_FROM_EMAIL` | Optional | Verified sender address |
| `OPENAI_API_KEY` | Optional | Voice transcription |
| `CRON_SECRET` | Optional | Protect `/api/alert-escalation-check` |

---

## Data model summary

```
WorkItem        ← central entity (compliance task, filing, decision)
  ├── Action[]          ← tasks attached to a work item
  ├── ActivityLog[]     ← audit trail
  ├── Decision[]        ← decisions awaiting approval
  ├── AlertDelivery[]   ← notification delivery records
  └── VoiceIntake[]     ← audio recordings + parsed JSON

AlertRecipient  ← who gets notified (email/SMS/dashboard/WhatsApp)
  └── AlertDelivery[]

Company         ← portfolio company
  └── Contact[]

Template        ← message/document templates
UserPassword    ← bcrypt-hashed passcodes per person
```

---

## API routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Passcode login → sets httpOnly JWT cookie |
| POST | `/api/auth/logout` | Clears session cookie |
| GET/POST | `/api/work-items` | List / create work items |
| GET/PATCH/DELETE | `/api/work-items/[id]` | Single work item CRUD |
| POST | `/api/work-items/[id]/actions` | Add action |
| POST | `/api/work-items/[id]/escalate` | Escalate work item |
| GET | `/api/dashboard` | Compliance summary for mobile |
| GET | `/api/decisions` | Open decisions list |
| GET | `/api/portfolio` | Companies with live counts |
| GET/POST | `/api/alert-recipients` | Recipient management |
| GET | `/api/alert-deliveries` | Alert delivery log |
| POST | `/api/voice/transcribe` | Whisper transcription |
| POST | `/api/sheets-webhook` | Ingest from Google Sheets |

---

## Development commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build
npx prisma db push   # Apply schema changes
npx prisma studio    # Browse database in browser
npx tsc --noEmit     # Type-check only
```

---

## Mobile app (Expo)

Located in `mobile/`. Uses `expo-secure-store` for JWT storage on iOS. Auth flow: POST to `/api/auth/login` → extract `Set-Cookie` → store token → pass as `Cookie: session=<value>` on all requests. See `mobile/lib/api.ts`.

---

## Branch

Active development branch: `claude/ultracore-sheetops-mvp-wAwwp`
