# Workspace Architecture

Rules that govern the `/os/workspace/[companyId]/` module.
Read alongside `ARCHITECTURE_GUARDRAILS.md` and `ANTI_DRIFT.md`.

---

## Do Not Change

### Registry Pattern

Company and app lookups use in-memory registries (`lib/company-registry.ts`,
`lib/app-registry.ts`). These are pure synchronous functions with no DB cost.

**Do not** move company or app data into the database.
**Do not** replace `getCompany()` or `getApps()` with async DB queries.

### Legacy Alert Visibility

All workspace pages that query `osAlerts` intentionally include null-scoped rows:

```ts
or(eq(osAlerts.companyId, params.companyId), isNull(osAlerts.companyId))
```

Null `company_id` rows represent legacy/global alerts created before company
scoping was introduced. They must remain visible in every workspace.

**Do not** tighten this to strict equality (`eq` only).
**Do not** remove null rows from workspace alert queries.

### Tab Bar Activation Logic

`WorkspaceTabBar.tsx` uses an intentional split:

- Root tab (`''`): exact pathname match
- All other tabs: `pathname.startsWith(tabPath)`

This prevents false positives when navigating into deep sub-routes
(e.g. `/apps/fineguard`).

**Do not** simplify both cases to the same comparison.

### Layout Scope

`layout.tsx` validates the company exists and renders chrome only
(company header + tab bar). It does not fetch any data.

**Do not** add database queries to the workspace layout.

### FineGuard Feature Guard

FineGuard-specific UI renders only when the company has the app enabled:

```ts
const hasFineGuard = company.enabledApps.includes('fineguard')
```

This guard is present in the command centre (`page.tsx`) and the activity page.
It is product logic, not defensive code.

**Do not** remove the guard to simplify rendering.
**Do not** render FineGuard sections unconditionally.

### Dynamic Rendering

All async workspace pages declare:

```ts
export const dynamic = 'force-dynamic'
```

Workspace data (alerts, work items, documents, activity) must always be
fetched fresh on each request.

**Do not** remove this declaration.
**Do not** convert workspace pages to static or ISR rendering.

---

## Known Limitations (TODOs, Not Bugs)

These are documented design gaps, not accidental omissions.

| Area | Limitation | Root Cause |
|---|---|---|
| People | `osPeople` has no `company_id`; team members are proxied by `category = 'Team'` | No `workspace_members` table yet |
| People | All "Team" contacts appear in every workspace | Same root cause; will diverge once a second company has team members |
| Documents | `osDocuments.linkedCompany` is free-text with no FK or constraint | Pre-existing schema; VaultLine redesign is the proper fix |
| Invitations | `pendingInvitations` is a `never[]` placeholder | No `workspace_invitations` table yet |

Do not work around these with client-side filtering or additional columns
without first reading `ANTI_DRIFT.md` and confirming with the project owner.

---

## Shared Constants That Need Extraction

The following are currently duplicated across workspace pages and should be
consolidated into a shared module when the opportunity arises:

- `SEVERITY_COLOR` — defined independently in `page.tsx`, `notifications/page.tsx`, and `activity/page.tsx` with slight colour variations
- Relative date formatting — `formatRelative()` in `page.tsx` and `relativeDate()` in `activity/page.tsx` serve the same purpose with different output formats

Preferred location when extracted: `lib/os-constants.ts` and `lib/format.ts`.

---

## File Map

| File | Role |
|---|---|
| `layout.tsx` | Chrome only — company validation, header, tab bar |
| `WorkspaceTabBar.tsx` | Client component — tab navigation with pathname-based activation |
| `page.tsx` | Command centre — summary cards, app launcher, recent activity, attention required, quick actions |
| `notifications/page.tsx` | Unified alert inbox — osAlerts scoped by company |
| `activity/page.tsx` | Unified feed — fgActivityLog + osAlerts merged and sorted |
| `people/page.tsx` | Team members from osPeople (category='Team') |
| `documents/page.tsx` | Company documents from osDocuments (linkedCompany scoping) |
| `settings/page.tsx` | Company profile + installed apps + workspace controls — no DB queries |
