---
name: ultratech-os-builder
description: >
  Build and extend the UltraTech OS / Just4Work platform UI — a dark-graphite glassmorphism mobile-first business operating system with neon 3D icons. Use when: building new screens for UltraTech OS or Just4Work, adding module pages, generating or replacing 3D neon icons, implementing the 5-layer navigation (Launcher → Workspace → Object Lists → Object Detail → Actions), or following the Engineering Constitution (MANUS.md). This skill uses the Full App Spec as the build blueprint. Reference images are for validation only.
allowed-tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep"]
---

# UltraTech OS Builder

> **Repo-adaptation note (this repository):** This skill was authored for a Vite
> `fineguard` app (`/home/ubuntu/fineguard`, `client/src/`, `App.tsx`, React 19,
> Tailwind 4, shadcn/ui, root-level routes, CloudFront `.webp` icons). **This
> repository is different** — it is `manus-frontend`, a **Next.js 14 App Router**
> app (React 18.3, Tailwind 3.4, no shadcn) whose OS surface lives under
> `app/os/*` with components in `components/os/`. Treat the sections below as a
> **design/backlog blueprint**, not literal file paths. When adapting:
> - Routes: skill's `/money` → this repo's `/os/money`, `/home` → `/os/launcher`, etc.
> - Components: reuse `components/os/*` (LauncherGrid, LauncherTile, AppShell,
>   Sidebar, TopBar, GlassPanel, MetricCard …) instead of `ModuleCard`/`Tile`/etc.
> - Icons: the app CSP is `img-src 'self' data: blob:`, so **external CloudFront
>   images are blocked**. Use self-hosted / inlined assets (e.g. `lucide-react`,
>   local SVG/WebP under `public/`) rather than the CloudFront URLs below.
> - Type-check with `npx tsc --noEmit` (zero errors) — same as the skill requires.

## Version
- **Version:** 3.9.0 (QA pass: all routes wired, ModuleCard children, dynamic module picker, empty states, hexToRgb utility)
- **Last Updated:** 2026-07-18
- **Owner:** George / Just4Work
- **Status:** Stable

## Purpose
Build and extend the UltraTech OS / Just4Work platform UI. Covers all five navigation layers, the complete icon pipeline, and strict adherence to the Engineering Constitution.

## Scope
- Creating interactive UI screens for UltraTech OS and Just4Work
- Adding new module pages, workspace pages, and all navigation layers
- Generating or replacing 3D neon icons using the approved pipeline
- Ensuring every built screen matches reference images exactly in visual comparison
- Implementing the 5-layer navigation pattern exactly as specified
- Enforcing the Engineering Constitution's Golden Rules and Definition of Done

## Out of Scope
- Display full reference images inside the app (they are for development validation only)
- Deploy applications or modify infrastructure
- Edit databases or backend logic
- Change authentication, authorisation, or security rules
- Perform unrelated refactors outside the UI layer
- Design new UI patterns from scratch — always match the Full App Spec and reference images

## Inputs
- User request
- Project files: `client/src/` React components, pages, routing; `client/src/lib/icons.ts` icon registry; `App.tsx` route definitions
- **Full App Spec** — the build blueprint
- **Reference images** (PNGs) — for visual validation only
- **MANUS.md** — Engineering Constitution

## Outputs
- Real, interactive React components for every screen in the Full App Spec
- Updated routing in `App.tsx`
- Updated icon registry (`icons.ts`) when new icons are generated
- TypeScript compilation passing (`npx tsc --noEmit` with zero errors)
- All changes satisfy the Golden Rules and Definition of Done

## Dependencies
- **MANUS.md** — UltraTech OS & Just4Work Engineering Constitution
- Platform: React 19, Tailwind 4, shadcn/ui
- File structure: `/home/ubuntu/fineguard` project layout
- External pipeline: `manus-upload-file --webdev` for icon assets

## Success Criteria
- [ ] Build screens that match the Full App Spec exactly
- [ ] Match reference images in visual comparison
- [ ] Never load reference images in the app itself
- [ ] Require no follow-up clarification for normal inputs
- [ ] Not overlap with another skill's responsibilities
- [ ] Never introduce broken assets
- [ ] Always pass `npx tsc --noEmit` with zero errors
- [ ] Satisfy all seven Golden Rules and nine Definition of Done items

## Acceptance Test
**Prompt 1:** *"Build the Money module page from the Full App Spec."*
**Expected:** Real React component, tiles for Revenue/Invoices/Banking/Subscriptions/Growth, exact colours/typography/spacing, matches reference image, satisfies all DoD criteria.

**Prompt 2:** *"Generate a new 3D neon icon for the Growth tile."*
**Expected:** Follows icon pipeline, uploads, registers in `icons.ts`.

---

## Engineering Constitution (MANUS.md)

### Mission
Build a production-quality business operating system.
**Just4Work** is the customer-facing application. **UltraTech OS** is the orchestration platform behind it.
Simple requests. Real actions. Work done.

### Golden Rules
1. Do **not** redesign the UI.
2. Match the supplied reference images exactly.
3. Reuse components before creating new ones.
4. Reuse backend services before writing new ones.
5. Every feature must integrate with the audit trail.
6. Mobile-first always.
7. Production quality over prototypes.

### Definition of Done
A feature is complete only when it:
- matches the reference UI
- works on mobile
- uses shared components
- uses shared backend services
- integrates with UltraTech OS
- records audit history
- respects permissions
- is tested
- is production ready

---

## Full App Spec (Authoritative Blueprint)

### Design System
- **Theme**: Dark OS. Background: #0D1117 (near-black). Cards: #141B2D / #1A2235. Sidebar: #0B1120.
- **Accent colours**: Purple #6A3FFF (primary), Blue #2DA1FF (info), Green #28C76F (success), Orange #FFC145 (warning), Red #FF4D4F (danger)
- **Typography**: Inter. Headings bold. Body regular. Monospace for numbers.
- **Icons**: 3D neon/glass style. Module colours: Money=gold, Messages=blue, Calls=green, Contacts=purple, Alerts=orange, Tasks=blue, Companies=blue-grey, Documents=silver/white.
- **Cards**: Rounded-2xl, dark bg, subtle border, hover lift. Badge counts top-right.
- **Bottom nav (mobile)**: Home, Module, Add(+), Search, More.

### Tailwind Configuration
Ensure `tailwind.config.ts` includes:
```ts
colors: {
  background: "#0D1117",
  card: "#141B2D",
  "card-alt": "#1A2235",
  sidebar: "#0B1120",
  primary: "#6A3FFF",
  info: "#2DA1FF",
  success: "#28C76F",
  warning: "#FFC145",
  danger: "#FF4D4F",
  neutral: "#2B313D",
},
```

### Home Launcher Badge Aggregation Rule

| Module | Aggregated from | Spec badge |
| --- | --- | --- |
| Messages | Email unread + WhatsApp unread + SMS unread + Intake Messages new | 8+3+12+24=47 |
| Alerts | Red Alerts count | 2 |
| Tasks | Due Today count | 4 |
| All others | — | 0 |

### Icon Pipeline Requirement
All icons must be 3D neon/glass style via the approved pipeline. Never use emoji or placeholder images. If an icon doesn't exist, generate it.

### Sub-Icon Fallback Rule
If a tile needs a sub-icon not in the canonical list: use the module's main icon as placeholder, log in the backlog, continue building. Don't block.

**Note:** This is a build-time policy only. It exists to prevent blockers during construction. Backlog item #2 (generate real sub-icons) must still be executed to replace all placeholder icons. Do not treat the fallback as the final state.

### Responsive Navigation Rule
- Mobile (<768px): Bottom navigation bar
- Desktop (≥768px): Left sidebar. Bottom nav hidden.
- Use Tailwind's responsive prefixes.

### Validation Checklist
1. Compare built screen against relevant portion of reference image.
2. Check all colours match palette exactly.
3. Verify all icons are generated 3D neon assets, no emoji.
4. Test on mobile viewport (375px) and desktop (1440px). Layout must adapt.
5. Run `npx tsc --noEmit`. Zero errors.
6. Confirm Definition of Done from Constitution is met.

### Layer 1 — Home Launcher
- Greeting: "Good morning, George 👋"
- 2×4 grid: Money, Messages, Calls, Contacts, Alerts, Tasks, Companies, Documents
- Each card: icon, label, badge count, subtle glow
- Bottom strip: Today's Focus + Next Meeting
- Sidebar (desktop): Logo, nav items (Home, Activity, Calendar, Favourites, Settings), user profile + logout

### Layer 2 — Module Pages
Each module: header (back arrow, title, "..." menu), 2-col tile grid with icon, label, subtitle, optional badge.

- **Money**: Revenue, Invoices, Banking, Subscriptions, Growth
- **Messages**: Email (8), WhatsApp (3), SMS (12), Missed Calls (5), Intake Messages (24 new), Notifications (7 new)
- **Calls**: Call Today (3), Recent Calls (12), Missed Calls (5), Voicemail (7), Call Customers (152)
- **Contacts**: All Contacts (152), Customers (128), Favourites (23), Add Contact, Segments (4)
- **Alerts**: Red Alerts (2), Amber Alerts (5), Green Alerts (142), Alert History
- **Tasks**: Due Today (4), In Progress (2), Completed (8), All Tasks
- **Companies**: FineGuard Ltd (152), Builder Big Jobs (87), Ultratech (43), Accuracy Ltd (28), + Add Company
- **Documents**: All Documents (23), Contracts (8), Invoices (6), Other (9)

### Layer 3 — Company Workspace
- Header: shield icon + company name + "..."
- Hero stat, sub-module grid, Live Monitoring Map placeholder

### Layer 4 — Work Views
- **Alerts list**: Sorted by priority. Red/Amber/Green tabs. Items with action prompts.
- **Invoices**: All/Outstanding/Paid tabs. Overdue and due sections.
- **Email**: All/Unread/Important tabs. Message rows with avatars.
- **Calls Today**: Upcoming/missed with call buttons.
- **Tasks Today**: Priority-labelled task rows.

### Layer 5 — Object Detail
- **Alert Detail**: Red shield icon, "RED ALERT" label, title, what happened, what to do, CTA button.
- **Lead Detail**: Avatar, status badge, contact info, value, source, notes, next step, actions.
- **Customer Detail**: "Active Customer" badge, revenue, outstanding, contract end, account manager, notes.

### Personalised Home Screens
- **George**: Revenue (£2,140), Companies (4), Opportunities (12), Decisions (3)
- **Alissa**: Attention Needed (7), Messages (8), Tasks (14), Customers (152)
- **Dagon**: Leads (18), Calls Today (9), Quotes (5), Follow-ups (12)

### Colour Palette (exact)
- Primary: #6A3FFF, Info: #2DA1FF, Success: #28C76F, Warning: #FFC145, Danger: #FF4D4F
- Neutral: #2B313D, Background: #0D1117, Card: #141B2D, Card-alt: #1A2235
- Border: rgba(255,255,255,0.07), Text primary: #FFFFFF, Text secondary: rgba(255,255,255,0.55)

---

## Icon Strategy (Canonical CloudFront URLs)

> **This repo:** the app CSP (`next.config.js`) is `img-src 'self' data: blob:`,
> which **blocks external hosts**. The CloudFront URLs below will NOT load in this
> app. Adapt by self-hosting: download the asset into `public/icons/…` and
> reference it as `/icons/…`, or use inlined `lucide-react` / local SVG. Do not
> weaken the CSP to accommodate external icons (out of scope — security rule).

All icons served from CloudFront. Use these exact URLs in `icons.ts`. No other URL source allowed.

### Main Module Icons (v3)

| Key | URL |
| --- | --- |
| ICONS.money | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/icon-money-v3-compressed.webp |
| ICONS.messages | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/icon-messages-v3-compressed.webp |
| ICONS.calls | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/icon-calls-v3-compressed.webp |
| ICONS.contacts | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/icon-contacts-v3-compressed.webp |
| ICONS.alerts | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/icon-alerts-v3-compressed.webp |
| ICONS.tasks | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/icon-tasks-v3-compressed.webp |
| ICONS.companies | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/icon-companies-v3-compressed.webp |
| ICONS.documents | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/icon-documents-v3-compressed.webp |

### Sub-Icons — Money Module

| Key | URL |
| --- | --- |
| ICONS.moneyRevenue | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-revenue-v2-U9rM8RhkL5fwpNHLpbLYtx.webp |
| ICONS.moneyInvoices | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-invoice-v2-jA6oH7QzMzhRVyZnBuzxq5.webp |
| ICONS.moneyBanking | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-banking-v2-HJ7AFTYHtuyxmjttVG3iTz.webp |
| ICONS.moneySubscriptions | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-subscriptions-v2-5DRyW5Q2NZdbrQHhpDxeHs.webp |
| ICONS.moneyGrowth | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-growth-v2-93qbsKwkutnkJbn3oLeSRn.webp |

### Sub-Icons — Messages Module

| Key | URL |
| --- | --- |
| ICONS.msgEmail | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/icon-messages-v3-compressed.webp |
| ICONS.msgWhatsApp | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-whatsapp-v2-Z6nRZGhUZKk8tduUXp3toR.webp |
| ICONS.msgSMS | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-sms-v2-8WGaQV3iBiLRLHUgSduXgs.webp |
| ICONS.msgMissedCalls | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-missed-call-v2-TubzLXhd4QjQTJEKvJ42DW.webp |
| ICONS.msgVoicemail | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-voicemail-v2-KVC9RXGtfKHdXTGb7U2cko.webp |
| ICONS.msgScheduled | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/sub-scheduled-v2-5GaMAveDWkQRJjECe7Hja7.webp |
| ICONS.msgIntake | (to be generated) |
| ICONS.msgNotifications | (to be generated) |

### Brand Icons (v2)

| Key | URL |
| --- | --- |
| ICONS.brandFineGuard | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/brand-fineguard-v2-compressed.webp |
| ICONS.brandBuilder | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/brand-builder-v2-compressed.webp |
| ICONS.brandUltratech | https://d2xsxph8kpxj0f.cloudfront.net/310519663056272145/ii4YhJ27Fo7kCFu3ft6orC/brand-ultratech-v2-compressed.webp |

---

## Routing Conventions

> **This repo:** prefix OS routes with `/os` and use the App Router directory
> structure (`app/os/<route>/page.tsx`). The table below is the fineguard
> convention — map each entry onto its `/os/*` equivalent that already exists.

```
/home                        → Just4Work home launcher
/home/george                 → George personalised home
/home/alissa                 → Alissa personalised home
/home/dagon                  → Dagon personalised home
/modules                     → Module picker grid
/money                       → Money module page
/messages                    → Messages module page
/calls                       → Calls module page
/contacts                    → Contacts module page
/alerts                      → Alerts module page
/tasks                       → Tasks module page
/companies                   → Companies module page
/documents                   → Documents module page
/companies/fineguard         → FineGuard Ltd workspace
/alerts/red                  → Alerts list (Red tab default)
/alerts/amber                → Alerts list (Amber tab default)
/alerts/green                → Alerts list (Green tab default)
/alerts/:id                  → Alert detail
/invoices                    → Invoices list
/email                       → Email inbox
/calls/today                 → Calls Today
/calls/missed                → Calls Today (Missed tab)
/tasks/today                 → Tasks Today
/leads/:id                   → Lead detail
/customers/:id               → Customer detail
/* (all other sub-routes)    → ComingSoon placeholder
```

---

## Reusable Components

> **This repo:** the components below are the fineguard names. Reuse the existing
> `components/os/*` equivalents instead of creating these.

| Component | Path | Purpose |
| --- | --- | --- |
| ModuleCard | client/src/components/ModuleCard.tsx | Card with icon, label, badge, optional children |
| Tile | client/src/components/Tile.tsx | List tile with icon, label, subtitle, badge |
| ModulePage | client/src/components/ModulePage.tsx | Module page shell (header + grid) |
| Sidebar | client/src/components/Sidebar.tsx | Desktop sidebar with nav |
| BottomNav | client/src/components/BottomNav.tsx | Mobile bottom nav |
| DataListView | client/src/components/DataListView.tsx | Tabbed list with sections and rows |
| DetailPage | client/src/components/DetailPage.tsx | Detail screen with fields and actions |
| ComingSoon | client/src/pages/ComingSoon.tsx | Placeholder for unimplemented routes |

---

## Known Backlog

1. Generate 3D neon icons for sidebar and bottom nav (currently emoji placeholders)
2. Generate sub-icons for Intake Messages, Notifications, and all other module sub-tiles
3. Implement audit trail integration
4. Build the remaining three company workspaces (Builder Big Jobs, Ultratech, Accuracy Ltd)
5. Wire search functionality
6. Implement authentication and user switching
7. Build Live Monitoring Map (currently placeholder)
8. Add loading states and error boundaries
9. Wire dynamic data from backend

---

## Common Pitfalls

- **Loading reference images in app**: Never. They are for validation only.
- **Old route prefix**: Do not use /justworks/. All routes are at root level.
- **Missing sub-icons**: Use main module icon as build-time placeholder, log in backlog, don't block. Placeholders are temporary — backlog item #2 replaces them.
- **Broken icons**: Use only canonical CloudFront URLs.
- **Theme drift**: Use exact colour palette; don't revert.
- **TypeScript errors**: Zero tolerance.

---

## Triggers
- "build a screen", "add a module page", "create a workspace", "generate a 3D neon icon", "follow the spec"

## Workflow
1. Identify screen from Full App Spec.
2. Build real React component(s) using spec colours, copy, structure.
3. Use shared components where possible.
4. If screen needs an icon, check if it exists; if not, generate.
5. Wire up routing.
6. Run `npx tsc --noEmit`.
7. Run Validation Checklist.
8. Mark complete only when all DoD criteria met.

## Error Handling
- If spec is ambiguous → ask for clarification.
- If icon generation fails → fallback.
- If TypeScript errors → fix before done.

## Skill Maintenance
- Spec changes: Update immediately.
- Icon updates: Add to canonical table.
- Pattern changes: Document new components and routes.
- Version bump: Major for spec/brand changes, minor for features, patch for fixes.
