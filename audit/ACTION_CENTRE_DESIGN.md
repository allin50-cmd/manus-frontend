# Action Centre — Design Document (not implemented)

Status: design only, per explicit instruction. No routes, components, or
queries in this document have been built. This describes how an Action
Centre would extend the three existing surfaces below — it does not
introduce a new data model, a new dashboard, or a new query layer.

## What already exists

Three real, separately-owned surfaces already aggregate exactly the kind
of data an "Action Centre" would need:

- **`app/dashboard/page.tsx`** — tenant-agnostic. Runs parallel `WorkItem`/
  `Action`/`AlertDelivery` counts (overdue, due today, escalated, decision-
  needed, open actions, alert deliveries) and renders them as stat tiles
  with links out to `/today`, `/decisions`, `/portfolio`.
- **`app/decisions/page.tsx`** — lists open `Decision` records (via
  `db.decision.findMany({ where: { status: 'Open' } })`), each linked to
  its parent `WorkItem`.
- **`app/alerts/page.tsx`** — lists `WorkItem`s of `type: 'ComplianceAlert'`
  with their `AlertDelivery` history and a computed pending/acknowledged
  summary.

All three already query the same underlying entity (`WorkItem`, plus its
`Action`/`Decision`/`AlertDelivery` relations) — they just each show one
slice of it, in three different places.

## What "Action Centre" would actually be

Based on the pattern above, an Action Centre is not a new concept — it's
a **fourth view over the same `WorkItem` data**, one that unions the three
existing slices (overdue/due-today items, open decisions, unacknowledged
alerts) into a single triage list, instead of requiring a user to check
three pages. It needs no new table and no new field.

## Extension path

1. **Data**: a single new query function (e.g. `lib/queries/action-centre.ts`,
   following the same convention as `lib/queries/briefing.ts` already used by
   `app/dashboard`) that runs the same three `Promise.all`-batched queries
   already present in `dashboard`/`decisions`/`alerts`, and merges them into
   one array tagged by source (`overdue`, `decision`, `alert`). This is
   reuse of existing `db.workItem`/`db.decision` calls, not a new query
   surface.
2. **Route**: `app/action-centre/page.tsx`, structured like `app/dashboard/
   page.tsx` (a server component, `requireAuth()`, `Promise.all` of safe-
   guarded queries) — not a new layout system, not a new auth path.
3. **Components**: reuse `StatusBadge` (`components/StatusBadge.tsx`) for
   status pills and the same card/list markup already used in `app/alerts/
   page.tsx` and `app/decisions/page.tsx` — no new design tokens.
4. **Navigation**: an additional quick-link tile on `app/dashboard`
   (alongside the existing `+ New Item` / `Today's Actions` / `Decisions` /
   `Portfolio` tiles), not a new nav system.
5. **Company scoping (optional)**: if a per-tenant Action Centre inside
   `app/os/workspace/[companyId]` is wanted later, the same merged query
   accepts the `company` filter already added to `GET /api/work-items` and
   `GET /api/alert-deliveries` in this change set — no further backend work.

## Explicitly not part of this

- No new Prisma/Drizzle model.
- No new dashboard component library.
- No duplicate of `app/dashboard`, `app/decisions`, or `app/alerts` — those
  three keep their current URLs and responsibilities; Action Centre is an
  additional aggregate view, not a replacement.
- No agent/automation layer. This is a read-only triage list, consistent
  with `AGENTS.md`'s restriction against agent frameworks beyond the two
  approved exceptions.
