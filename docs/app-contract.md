# UltraTech App Contract

Specification for how applications integrate with the UltraTech Workspace.
Read alongside `docs/workspace-architecture.md` and `ARCHITECTURE_GUARDRAILS.md`.

---

## Design Principles

1. **Applications own their business logic.** The Workspace does not know or care how an app works internally — it only knows what the app declares.
2. **Workspace orchestrates.** The Workspace shell reads from the registry and database tables. It does not import app-specific code.
3. **Registry is the single source of truth.** An app exists to the Workspace if and only if it appears in `APP_REGISTRY` and in the company's `enabledApps` list.
4. **Apps must degrade gracefully when disabled.** The Workspace guards every app-specific section with `company.enabledApps.includes(appId)`. App code must not assume it is always active.
5. **No app should require changes to the Workspace shell to be installed.** New apps extend the registry. They do not modify `layout.tsx`, `WorkspaceTabBar.tsx`, or any existing workspace page.

---

## Required Metadata

Every app must have an entry in `lib/app-registry.ts` conforming to `AppDefinition`:

```ts
type AppStatus   = 'live' | 'beta' | 'coming_soon'
type AppCategory = 'compliance' | 'legal' | 'communications' | 'operations' | 'media'

type AppDefinition = {
  id:            string       // URL-safe slug, e.g. 'fineguard'
  name:          string       // Display name, e.g. 'FineGuard'
  description:   string       // One sentence — shown in Settings and launcher
  icon:          string       // Emoji or short Unicode glyph
  category:      AppCategory
  status:        AppStatus
  color:         string       // Hex accent — used for icon bg, badge, Open button
  externalRoute?: string      // If set, "Open →" links here instead of the workspace sub-route
}
```

`id` is the canonical identifier used in:
- `APP_REGISTRY` lookups (`getApp(id)`, `getApps(ids)`)
- `CompanyRecord.enabledApps[]`
- URL segments: `/os/workspace/[companyId]/apps/[id]`
- Feature guards: `company.enabledApps.includes(id)`
- Database `source` fields in `osAlerts` and `fgActivityLog`

---

## Optional Capabilities

Capabilities are not declared explicitly in the registry. They are expressed by
the presence of data in shared tables and the existence of workspace sub-routes.
The Workspace discovers them by querying those tables at render time.

### Dashboard Widget

Not currently implemented. Reserved for future use. Do not add widget-specific
fields to `AppDefinition` until a widget slot is defined in the command centre.

### Notifications

An app contributes notifications by writing rows to `os_alerts`:

```
os_alerts.source      — set to the app id, e.g. 'fineguard'
os_alerts.company_id  — set to the company's id string (nullable; null = global)
os_alerts.severity    — 'Critical' | 'Warning' | 'Info'
os_alerts.title       — short human-readable label
os_alerts.body        — optional detail
os_alerts.is_read     — default false
```

The Workspace Notifications tab reads this table filtered by company.
The app does not need to register a notification endpoint or hook.

### Activity Events

An app contributes activity by writing rows to `fg_activity_log` (FineGuard)
or `ut_activity_events` (platform-wide). The activity page merges both feeds.

FineGuard-specific events use `fg_activity_log`:
```
fg_activity_log.action      — human-readable description of the event
fg_activity_log.entity_type — optional entity class, e.g. 'Company'
fg_activity_log.entity_id   — optional entity identifier
fg_activity_log.occurred_at — timestamp
```

Other apps that need activity events should write to `ut_activity_events`.

### Documents

An app contributes documents by writing rows to `os_documents`:

```
os_documents.linked_company  — the company id string (free-text; nullable)
os_documents.source          — app id or process name, e.g. 'fineguard'
os_documents.status          — 'PendingReview' | 'Approved' | 'Rejected' | 'Archived'
```

The Workspace Documents tab reads this table filtered by `linked_company`.

### Quick Actions

Quick Actions in the command centre are hardcoded links defined in `page.tsx`.
An app that wants a Quick Action entry must be added there explicitly. This is
the one exception to the no-shell-changes rule, and it requires the app to be
`live` or `beta` status.

### Workspace Settings

The Settings page reads installed apps from the registry. No additional
registration is required. The app's `name`, `description`, `icon`, `color`,
and `status` are displayed automatically.

### Permissions

There is no runtime permissions layer. Access is controlled by whether the
company's `enabledApps` list includes the app's `id`. Companies are managed
in `lib/company-registry.ts`. Apps cannot declare their own permission scopes.

---

## Registration

### Step 1 — Add to APP_REGISTRY

Edit `lib/app-registry.ts` and append an `AppDefinition` entry:

```ts
{
  id:          'my-app',
  name:        'My App',
  description: 'What this app does in one sentence.',
  icon:        '🔧',
  category:    'operations',
  status:      'coming_soon',   // start here; promote to 'beta' or 'live' when ready
  color:       '#FF8A34',
  // externalRoute: '/os/my-app',  // omit if the app lives at /os/workspace/[companyId]/apps/my-app
}
```

### Step 2 — Enable for companies

Edit `lib/company-registry.ts` and add the app `id` to the `enabledApps` array
for each company that should have access:

```ts
{
  id: 'my-company',
  enabledApps: ['fineguard', 'my-app'],
  // ...
}
```

### Step 3 — Create the app route (optional)

If the app does not use `externalRoute`, create its page at:

```
app/os/workspace/[companyId]/apps/[appId]/page.tsx
```

This page receives `params.companyId` and `params.appId`. It is responsible
for all app-specific data fetching and rendering.

### Step 4 — Write to shared tables (optional)

If the app produces alerts, activity events, or documents, write to the
appropriate shared table with `company_id` or `linked_company` set. The
Workspace picks these up automatically on next render.

---

## Workspace Integration Points

How each workspace page interacts with apps — and what an app must do
(or not do) for each.

### Overview (Command Centre)

| Section | What the Workspace reads | What the app must provide |
|---|---|---|
| Summary cards | App count from registry | Nothing — automatic |
| App launcher | `AppDefinition` for each `enabledApps` id | Registry entry with correct `status` |
| Recent Activity | `ut_activity_events` latest 10 | Write to `ut_activity_events` |
| Attention Required — alerts | `os_alerts` unread, company-scoped | Write alerts with `company_id` |
| Attention Required — FineGuard | `fg_alerts` pending (FineGuard only) | FineGuard internal — do not replicate |
| Attention Required — overdue work | `work_items` past due date | Write to `work_items` with due dates |
| Quick Actions | Hardcoded links in `page.tsx` | Request addition when app is live |

### Notifications

The Workspace reads `os_alerts` filtered by:
```ts
or(eq(osAlerts.companyId, params.companyId), isNull(osAlerts.companyId))
```

An alert with `source = 'my-app'` will appear in the Notifications tab
automatically. If a source value contains `'fineguard'` (case-insensitive),
the source is rendered as a link to the FineGuard workspace page.

No registration required beyond writing to `os_alerts`.

### Activity

The Workspace reads `fg_activity_log` (FineGuard only, when `hasFineGuard`)
and `os_alerts` merged into a unified chronological feed.

Platform-wide activity should be written to `ut_activity_events`. There is
currently no display path for `ut_activity_events` in the Activity tab — it
appears in the command centre only.

### Documents

The Workspace reads `os_documents` filtered by `linked_company`. An app that
generates documents should set `linked_company` to the company id and
`source` to the app id.

Documents surface in the workspace automatically. The "Upload Document" button
links to `/os/documents` (global), not an app-specific upload route.

### Settings

All registry-listed apps appear in the Installed Apps section of the Settings
page, grouped by `status`. No additional work is required.

The `externalRoute` field controls where the "Open →" button points. If absent,
it points to `/os/workspace/[companyId]/apps/[id]`.

---

## Status Lifecycle

```
coming_soon  →  beta  →  live
```

- `coming_soon`: shown in Settings and launcher with a "Soon" badge. No "Open →" button. App route does not need to exist.
- `beta`: shown with a "Beta" badge. "Open →" button active. App route must exist.
- `live`: no badge. "Open →" button active. App route must exist.

Promoting an app from `coming_soon` to `beta` or `live` requires only a
one-line change in `lib/app-registry.ts`. No schema changes, no migrations,
no Workspace shell changes.

---

## What an App Must Never Do

- Modify `layout.tsx` or `WorkspaceTabBar.tsx`
- Add columns to `os_alerts`, `os_documents`, or `ut_activity_events` without a migration
- Import from another app's directory (apps are isolated)
- Assume `company.enabledApps.includes(id)` is true without checking
- Bypass the registry by hardcoding company IDs in app logic
- Store company metadata in the database — that lives in `lib/company-registry.ts`
