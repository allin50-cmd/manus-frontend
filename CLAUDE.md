# Architecture & Development Guide

## Approved Stack (Phase 4)

**UltraCore Ops** runs on a proven, cost-efficient, managed stack:

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Deployment**: Vercel (no infra management)
- **Database**: Supabase PostgreSQL (managed, RLS-enabled)
- **Auth**: Passcode + JWT (in-memory session)
- **Email**: Resend (optional, for alerts)
- **AI**: OpenAI voice transcription (optional, API-only)
- **Infrastructure**: Zero — fully managed services

**Why this stack?**
- Minimal operational overhead (Vercel handles CI/CD, zero-downtime deploys, auto-scaling)
- Transparent costs ($0 baseline, +$20/mo Vercel if needed, Supabase free tier covers MVP)
- Deterministic Business Functions (no random agent behavior)
- No vendor lock-in beyond Vercel + Postgres (both commodity)

---

## Rejected: PR #27 Architecture Rewrite

**Status**: ❌ CLOSED / REJECTED — 2026-06-29

**What PR #27 tried to do**:
- Replace Next.js → Vite frontend
- Replace Vercel → Azure Container Apps (Docker/ACR/Bicep)
- Replace Supabase → Azure PostgreSQL Flexible Server + Redis
- Add GPT-4o sales agent with "shadow|live mode" to signup flow
- Add Resend email automation and auditLeads table

**Why rejected**:
1. **Platform rewrite during stabilization** — Phase 4 is consolidation, not architecture change
2. **Paid infrastructure** — +$500–2000/mo Azure costs (vs. $0 Vercel)
3. **AI by default** — contradicts "deterministic Business Functions" principle
4. **Vendor lock-in** — Vite + Azure + OpenAI creates complexity with no upside
5. **Mergeable state: DIRTY** — 329 file changes, 141 commits, unresolved conflicts
6. **Parallel stacks** — Vite code alongside Next.js breaks the build

**Reference**: [PR #27 review](https://github.com/allin50-cmd/manus-frontend/pull/27) (closed without merge)

---

## Salvage (Future, Minimal PRs Only)

If PR #27 concepts resurface, **only these pieces** may be considered — and **only after Phase 4 closes**:

1. **Local Claude dev hooks** (`.claude/hooks/session-start.sh`)
   - Safe: isolated shell script, doesn't affect runtime
   - Condition: no OpenAI or Azure code

2. **Audit landing page concept** ported into Next.js `app/audit/page.tsx`
   - Safe: new Route Handler, standard form, no AI
   - Condition: uses existing Prisma schema, no new tables

3. **Audit table schema** if mapped into existing OS tables
   - Safe: schema extension only, Supabase RLS applied
   - Condition: no agent decision logic, deterministic workflow

4. **Resend template docs**
   - Safe: markdown documentation
   - Condition: optional feature, no mandatory dependency

**Do NOT salvage**: Vite code, Azure infra, OpenAI services, Docker/ACR, Bicep, `auditLeads` agent table, `salesAgent.ts`.

---

## Rules for This Project

### Before Adding Infrastructure
- No new paid services without explicit approval
- No AI unless deterministic or explicitly optional
- Deployment stays Vercel; database stays Supabase
- If in doubt, ask

### Before Merging a Branch
- ✅ TypeScript compiles (`npm run type-check`)
- ✅ Tests pass (`npm test`)
- ✅ Build succeeds (`npm run build`)
- ✅ No new paid infrastructure
- ✅ No new AI dependencies by default
- ✅ No platform changes (stay Next.js + Vercel)

### Before Creating a PR
- Rebase on `main`
- Delete old feature branches
- Link to task or issue in PR body
- Keep to one concern (don't merge unrelated features)

---

## Authentication & Environment Variables

### Critical: Client-Side vs Server-Side Env Vars in Next.js

**This is the #1 source of auth/env confusion. They work differently.**

#### Client-Side Env Vars (Browser)
- **Prefix**: `NEXT_PUBLIC_*` (REQUIRED for browser access)
- **Access**: `process.env.NEXT_PUBLIC_*` in client components and useEffect hooks
- **Set in**: Vercel Project Settings → Environment Variables
- **.env.local**: Does NOT apply on Vercel; only for local dev
- **Example**: `NEXT_PUBLIC_DISABLE_AUTH=true` ← browser can read this

#### Server-Side Env Vars (Node.js)
- **Prefix**: None (no `NEXT_PUBLIC_` prefix)
- **Access**: `process.env.VAR_NAME` in API routes and server components only
- **Set in**: Vercel Project Settings → Environment Variables
- **.env.local**: Works in local dev; does NOT apply on Vercel
- **Example**: `DATABASE_URL=postgres://...` ← browser cannot read this

### Password/Passcode Gate Location

- **File**: `app/login/page.tsx`
- **How it works**: 
  - Checks `NEXT_PUBLIC_DISABLE_AUTH` on page load in useEffect
  - If `true`: Skips authentication, redirects to `/dashboard`
  - If `false`/unset: Shows password form, requires correct passcode to proceed
- **Never delete the auth code** — only bypass it behind the `NEXT_PUBLIC_DISABLE_AUTH` flag

### Environment Variable Setup

#### Local Development (.env.local)
```
# For local dev only — does NOT deploy to Vercel
NEXT_PUBLIC_DISABLE_AUTH=true  # Bypass password screen
DEFAULT_PASSCODE=demo1234      # Fallback passcode if DISABLE_AUTH=false
DISABLE_AUTH=true              # Server-side fallback (rarely used)
```

#### Vercel Preview & Production
**Project Settings → Environment Variables**
```
NEXT_PUBLIC_DISABLE_AUTH=true   # Client-side; needed for browser to skip auth
DATABASE_URL=postgres://...     # Server-side; not visible to browser
DEFAULT_PASSCODE=demo1234       # Server-side fallback
```

### Common Mistakes (Do Not Repeat)

1. ❌ Setting `DISABLE_AUTH=true` and expecting the browser to skip the password screen
   - ✅ Must use `NEXT_PUBLIC_DISABLE_AUTH=true`
   - Why: Browser cannot read env vars without the `NEXT_PUBLIC_` prefix

2. ❌ Setting env vars in `.env.local` and expecting them on Vercel
   - ✅ `.env.local` is for local dev only; set vars in Vercel dashboard for deployed apps
   - Why: Vercel does not load `.env.local` during builds or runtime

3. ❌ Deleting auth code to "remove the password screen"
   - ✅ Keep the auth code, only bypass it with the flag
   - Why: Auth is required for production; the bypass is for development iteration only

4. ❌ Trying to fix auth while working on PR 4 forms simultaneously
   - ✅ Fix auth first, verify it works on Vercel, then continue PR 4 forms
   - Why: Auth changes affect the entire app; mixing with form changes causes confusion

### Phase 4 Forms (After Auth Is Fixed)

When continuing with Phase 4 forms:
- Pull `companyId` from query params: `?companyId=123`
- Treat `personId`, `storageUrl`, `createdBy` as required text inputs (user enters these)
- Do NOT delete any existing auth code
- Routes: `/os/contacts/new`, `/os/tasks/new`, `/os/calls/new`, `/os/messages/new`, `/os/money/quotes/new`, `/os/money/invoices/new`, `/os/documents/upload`

---

## When to Deviate

These rules exist for stability. You may deviate **only if**:
1. You have explicit written approval (e.g., from product lead)
2. You're in a separate, approved branch (not `main`)
3. You document the deviation in the PR body with **WHY**

Example OK deviations:
- "Add Stripe for billing in a separate `feat/billing` branch" ← approved separately
- "Test Azure infra in a `spike/azure-evaluation` branch" ← exploration, not shipping

Example NOT OK:
- Merging Azure infra to main without approval
- Adding OpenAI as a hard dependency
- Switching from Next.js to Vite mid-project

---

## Emergency Contacts

If a branch or PR is attempting an unapproved architecture change:
1. **Do not merge**
2. **Close with a reference** to this document
3. **Request review** from project lead

---

**Last updated**: 2026-07-01  
**Decision**: Vercel + Supabase + Next.js (deterministic, managed, cost-effective)

---

## Key Learnings

**Auth/Env Confusion (Most Common Issue)**
- Client-side env vars must use `NEXT_PUBLIC_` prefix in Next.js
- `.env.local` is local-only; Vercel env vars go in dashboard
- To bypass auth in the browser, set `NEXT_PUBLIC_DISABLE_AUTH=true` on Vercel
- Server-side `DISABLE_AUTH` alone won't work for client-side checks
- Never delete auth code; only bypass it behind the flag
