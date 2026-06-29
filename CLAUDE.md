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

**Last updated**: 2026-06-29  
**Decision**: Vercel + Supabase + Next.js (deterministic, managed, cost-effective)
