# APIs — UltraCore

**Last updated:** 2026-06-28

---

## Authentication

All OS API routes require a valid session cookie. Call `getSession()` at the top of every handler and return 401 if null:

```typescript
const session = await getSession()
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

Public routes (no auth): `/api/apps/*`, `/api/auth/*`

---

## OS Module APIs (`/api/os/`)

All use Drizzle. All require auth.

| Route | Method | Description |
|---|---|---|
| `/api/os/tasks` | GET, POST | List all tasks / create task |
| `/api/os/tasks/[id]` | PATCH, DELETE | Update / delete task |
| `/api/os/people` | GET, POST | List contacts / create contact |
| `/api/os/calls` | GET, POST | List call logs / log call |
| `/api/os/messages` | GET, POST | List messages / send message |
| `/api/os/message-threads` | POST | Create new message thread |
| `/api/os/invoices` | GET, POST | List invoices / create invoice |
| `/api/os/quotes` | GET, POST | List quotes / create quote |
| `/api/os/documents` | GET, POST | List documents / upload document record |
| `/api/os/alerts` | GET | List alerts |
| `/api/os/alerts/[id]` | PATCH | Acknowledge / update alert |

---

## Work Items APIs

Legacy route prefix (pre-`/api/os/`). Still in use.

| Route | Method | Description |
|---|---|---|
| `/api/work-items` | GET, POST | List / create work items |
| `/api/work-items/[id]` | GET, PATCH, DELETE | Work item CRUD |
| `/api/work-items/[id]/actions` | GET, POST | Actions on a work item |

---

## Decisions API

| Route | Method | Description |
|---|---|---|
| `/api/decisions` | GET, POST | List / create decisions |
| `/api/decisions/[id]` | PATCH, DELETE | Update / delete decision |

---

## Companies House APIs

| Route | Method | Description |
|---|---|---|
| `/api/companies` | GET | List monitored companies |
| `/api/companies/[number]` | GET | Company detail from Companies House |
| `/api/companies/search` | GET | Search Companies House |

---

## FineGuard APIs

| Route | Method | Description |
|---|---|---|
| `/api/fineguard/process` | POST | Run compliance check for a company |
| `/api/fineguard-leads` | POST | Capture a FineGuard lead |
| `/api/monitored` | GET | List all monitored companies |

---

## Builder Big Jobs APIs

| Route | Method | Description |
|---|---|---|
| `/api/builder-big-jobs/leads` | GET, POST | List / create builder leads |
| `/api/builder-big-jobs/leads/[id]` | GET, PATCH | Lead detail / update |

---

## Public App APIs (`/api/apps/`)

No session auth. Write to OS tables on behalf of anonymous customers.

| Route | Method | Description |
|---|---|---|
| `/api/apps/receptionist` | POST | AI Receptionist — creates work item |
| `/api/apps/quote` | POST | Quote Builder — creates os_quotes record |
| `/api/apps/booking` | POST | Appointment Booking — creates os_tasks record |

---

## Auth APIs

| Route | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Passcode login → sets session cookie |
| `/api/auth/logout` | POST | Clears session cookie |

`/api/auth/login` body: `{ "passcode": "..." }`  
Response: sets `session` cookie on success, 401 on wrong passcode, 400 on malformed body.

---

## Common Patterns

### Add `force-dynamic` to API routes

All API routes that read from the database should export:

```typescript
export const dynamic = 'force-dynamic'
```

This prevents Next.js from caching the response at build time.

### Error responses

```typescript
return NextResponse.json({ error: 'Not found' }, { status: 404 })
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ error: 'Bad request' }, { status: 400 })
```

### Successful create

```typescript
return NextResponse.json(newRecord, { status: 201 })
```
