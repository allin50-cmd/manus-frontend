# UI Component Library — Reference (not yet implemented)

Reference image: `ai/assets/ultratech-os-component-library.png`

This documents a visual/component-library mockup supplied for "UltraTech OS"
(dark, neon-3D icon style). It is a **design reference for future work**,
not a description of the current app. **The live app (UltraCore Ops) uses a
different, already-implemented design system**: light background, Tailwind
`slate`/`blue`/`green`/`red`/`amber`/`purple` palette, flat icons/emoji, see
`components/StatusBadge.tsx`, `components/NavBar.tsx`, and the `app/os/today`
page for the current look.

Do not restyle existing pages to match this mockup without an explicit,
scoped request — that would be a UI redesign, which recent work has been
instructed to avoid. Use this doc when a task explicitly asks to build
toward this look, or to compare/contrast a new component against it.

## What the mockup shows

- **Icon set (3D neon style)** — Money, Messages, Calls, Companies, Alerts,
  Tasks, Documents, Contacts, Calendar, Leads, Projects, Reports. Glossy
  3D-rendered icons on dark tiles, not flat/line icons.
- **Colour palette** — Purpley `#6A3FFF`, Bluee `#2DA1FF`, Sorcerer `#28C76F`,
  Wimbisu `#FFC145`, Pepper `#FF4D4D`, Slane `#2B313D` (labels as shown in the
  mockup; treat as a starting palette, not exact hex-to-name guarantees).
- **Home launcher (Layer 1)** — top app bar (logo, search, notifications,
  avatar) + a horizontal row of large glossy KPI tiles (Money/Messages/
  Calls/Companies/Alerts/Tasks/Documents), each with a headline number and a
  trend indicator.
- **Module / workspace cards (Layer 2)** — per-module cards (Money, Messages,
  Calls, Companies, Alerts, Tasks) with a mini KPI list and 1–2 primary
  action buttons (e.g. "+ Create Invoice", "Open Inbox", "Call Now").
- **Company workspace (Layer 3)** — a per-company dashboard: header with
  company name/type, KPI row, quick-action icon strip (Leads/Quotes/Site
  Visits/Won Jobs/Lost Jobs), pipeline-stage columns with counts and £
  values, and a recent-activity feed.
- **Object list view (Layer 3)** — filterable/tabbed list (e.g. "New Leads")
  with status pills, pagination, and a table of rows (lead/company/source/
  value/status/last activity).
- **Object detail view (Layer 5)** — a record header (name, status pill,
  value), tabs (Overview/Activity/Notes/Files/Timeline), a two-column
  contact/next-action layout, and action buttons (Call/Email/Quote/More).
- **UI components panel** — buttons (Primary/Secondary/Tertiary, Success/
  Warning/Danger), badges & status pills (Active/New/Pending/Overdue/
  Complete/In Progress/Blocked), avatar stack, progress rings/bars, small
  chart cards, and a bottom mobile nav bar (Home/Companies/Workspace/Search/
  Notifications/More) with empty states.

## How this maps to the current codebase (if this direction is pursued later)

| Mockup concept | Nearest existing piece today |
|---|---|
| Home launcher KPI tiles | `app/os/today/TodayWorkspace.tsx` KPI row (4 tiles, plain Tailwind cards) |
| Status/badge pills | `components/StatusBadge.tsx` (`STATUS_STYLES`/`STATUS_LABELS`) |
| Object list view | `app/work-items/page.tsx`, `components/WorkItemFilters.tsx` |
| Object detail view | `app/work-items/[id]/page.tsx`, `components/WorkItemActions.tsx` |
| Bottom mobile nav | `components/NavBar.tsx` (`BOTTOM_TABS`, `MORE_MENU`) |
| Company workspace | `app/os/workspace/[companyId]/page.tsx` |

Any future adoption of the mockup's visual language (3D icons, dark theme,
neon accents) is a deliberate design-system change and should be scoped and
approved separately per `CLAUDE.md` ("no platform changes without approval");
it is out of scope for workflow/engine or bug-fix branches.
