# Architecture

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict: false) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Primary ORM | Prisma |
| Secondary ORM | Drizzle (schema defined, not yet primary) |
| Auth | Custom cookie-based auth (`lib/auth.ts`) |
| AI / Voice | OpenAI Whisper API |
| Deployment | Vercel |
| Tests | Vitest |

## Directory structure

```
/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # API route handlers
│   │   ├── auth/           # Login, logout, session
│   │   ├── dashboard/      # Dashboard stats + morning briefing
│   │   ├── decisions/      # Decision management
│   │   ├── my-tasks/       # Per-person task API
│   │   ├── team/           # Team capacity API
│   │   ├── templates/      # Template CRUD
│   │   ├── voice/          # Transcription pipeline
│   │   └── work-items/     # Work item CRUD + actions
│   ├── dashboard/          # Dashboard page
│   ├── activity/           # Activity log
│   ├── decisions/          # Decision queue
│   ├── filings/            # Filings
│   ├── my-tasks/           # Per-person task list
│   ├── os/                 # OS module forms (Phase 4)
│   ├── portfolio/          # Portfolio view
│   ├── team/               # Team capacity
│   ├── templates/          # Templates
│   ├── voice-intake/       # Voice intake flow
│   └── work-items/         # Work items list + detail
├── components/             # Shared React components
│   ├── NavBar.tsx          # Unified nav (desktop top bar + mobile bottom tabs)
│   └── ...
├── db/
│   └── schema.ts           # Drizzle schema (NOT yet used for queries)
├── lib/
│   ├── auth.ts             # Auth helpers
│   ├── db.ts               # Database client (lazy Prisma + Drizzle getDb())
│   ├── types.ts            # Enum type definitions (independent of Prisma codegen)
│   ├── work-item-enums.ts  # Validation constants + TYPE_SYNONYMS + OWNERS
│   ├── crm-utils.ts        # CRM pipeline stage helpers
│   ├── template-utils.ts   # Template variable substitution
│   ├── compliance/
│   │   └── thresholds.ts   # Filing deadline thresholds
│   ├── queries/
│   │   └── briefing.ts     # Morning briefing query
│   ├── utils.ts            # General utilities
│   └── voice/
│       ├── known-entities.ts  # Known company names for NLP
│       ├── parser.ts          # Voice transcript → DraftRecord
│       ├── transcription.ts   # Whisper API wrapper
│       └── types.ts           # Voice-specific types
├── prisma/
│   └── schema.prisma       # Prisma schema (source of truth for DB structure)
└── ai/                     # AI session documentation (this directory)
```

## Key patterns

### Server components by default
Pages are server components unless they need interactivity. Client components are named `*Client.tsx` and receive pre-serialised data (Dates as ISO strings).

### Authentication
`requireAuth()` — used in pages (throws redirect on fail)
`getSession()` — used in API routes (returns null on fail)

### Database access
All routes use `db.model.findMany(...)` via the Prisma proxy in `lib/db.ts`.
Never import from `@prisma/client` directly for enum types — use `@/lib/types` instead.

### Error pattern
API routes return `{ error: string }` with appropriate HTTP status.
Pages render an inline error state on catch.

### Serialisation boundary
Server components must serialise `Date` objects to ISO strings before passing to client components. Never pass `Date` or `null` directly across the server/client boundary.
