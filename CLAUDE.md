# Architecture & Development Guide

## Product Vision (Do Not Deviate)

### Core Principle

The product is not an AI application.

The product is a business that just works.

Users do not buy AI, databases, APIs, workflows, agents, or automation.

Users buy:
- "Book the job."
- "Send the invoice."
- "Email the customer."
- "What's urgent today?"
- "Remind me."
- "Answer the phone."

Everything else is implementation detail.

### User Experience

The system must always feel like using an iPhone, not enterprise software.

**Primary interface**: Voice + simple graphical icons.
- Voice is the fastest way to complete actions.
- Icons provide confidence, visibility, and manual control.
- Users must always be able to switch naturally between speaking and tapping.

**Voice flow**: Speak → Confirm → Save → Next Action.

Every voice action creates a visible, editable record.

### Design Principles

Always optimise for:
- Simplicity
- Speed
- Confidence
- Clarity
- Familiarity

Never optimise for:
- Technical demonstrations
- AI buzzwords
- Complex dashboards
- Feature count
- Engineering cleverness

### Language Rules

Never expose technical terminology to end users. Do not use words such as: Agent, Workflow, Database, API, LLM, Prompt, Orchestrator, Vector Database, LangGraph, MCP.

The system translates simple user requests into technical operations internally — those terms are fine in code, docs, and this file, but must never appear in user-facing copy.

### "Just Works" Philosophy

The operating system should disappear. The user should feel that the business simply works.

Every feature must answer one question: **"Does this remove work from the user?"** If not, it should not exist.

### Mobile First

The phone is the primary computer. Desktop is secondary. Every feature must work naturally on a phone before expanding to larger screens.

### Icon First

The interface should be built around clear actions, not menus. Examples: 📞 Calls, 👥 Customers, 📅 Calendar, 📧 Messages, 💷 Money, 📋 Jobs, 🛡 Compliance, 📁 Documents, ⚙ Business.

Large touch targets. Minimal text. No clutter.

### Voice First

Voice is an input method, not a chatbot. Examples: "Book Mrs Smith.", "Email Dagon.", "What's urgent?", "Create a quote.", "Start today's jobs."

The system performs the work and presents a simple confirmation.

### Technology

Technology is implementation detail. Current preferred stack: Vercel, Supabase, mobile-first, voice-first, simple architecture (see **Approved Stack** below for specifics).

Do not recommend additional frameworks, abstractions, or AI layers unless they solve a genuine user problem.

### Golden Rule

Whenever making any design or engineering decision, ask: **"Will this make the customer's business feel like it just works?"**

If the answer is no, choose the simpler solution.

**Architecture rule**: Technology may change. Product philosophy must not. Choose the simplest implementation that delivers the desired user experience.

---

## Product Direction (Read Before Coding)

This repository is building the UltraTech Business Operating System.

The objective is not to build an AI application.

The objective is to build software that feels like it just works for non-technical business owners.

### Product Principles

- Mobile-first.
- Voice-first.
- Icon-first.
- AI is invisible.
- Technology is implementation detail.
- Every feature must reduce user effort.

Users should never need to understand:
- AI
- Agents
- Databases
- APIs
- Workflows
- LLMs
- Automation engines

Those exist only behind the scenes.

### User Experience

The application should feel closer to an iPhone than enterprise software.

Primary interaction:
- Speak → Confirm → Done

or

- Tap icon → Confirm → Done

Every action should require the fewest possible steps.

### Voice

Voice is the primary input mechanism.

Examples:
- "Book this job."
- "Email the customer."
- "What's urgent?"
- "Create a quote."
- "Read my messages."

Voice should trigger existing business workflows without exposing technical implementation.

### Icons

Large, simple business icons are preferred over menus and nested navigation.

Examples:
- 📞 Calls
- 👥 Customers
- 📅 Calendar
- 📧 Messages
- 💷 Money
- 📋 Jobs
- 🛡 Compliance
- 📁 Documents
- ⚙ Business

### AgentMail

AgentMail is infrastructure.

Users should never know it exists.

Responsibilities:
- Send email.
- Receive email.
- Maintain conversation history.
- Enable voice-controlled messaging.
- Keep conversations linked to business records.

Never expose "AI inboxes" or technical email concepts to end users.

### FineGuard

FineGuard remains a compliance platform.

Its purpose is: **"Never miss an important business obligation."**

Email, voice, dashboards, notifications and automation all support this goal.

### JustWorks Philosophy

Every development decision must answer one question: **Does this make running a business feel easier?**

If the answer is no, simplify the solution before adding more technology.

### Architecture Rule

Technology may change.

Product philosophy must not.

Choose the simplest implementation that delivers the desired user experience.

---

## Approved Stack (Phase 4)

**UltraCore Ops** runs on a proven, cost-efficient, managed stack:

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Deployment**: Vercel (no infra management)
- **Database**: Supabase PostgreSQL (managed, RLS-enabled)
- **Auth**: Passcode + JWT (in-memory session)
- **Email**: Resend (transactional, optional, for alerts) + **AgentMail** (persistent conversational email — see **AgentMail Integration Policy** below; approved 2026-07-03)
- **AI**: OpenAI voice transcription (optional, API-only) + AgentMail's drafting/summarization (the one other sanctioned non-deterministic AI path — scoped to email mechanics only, see policy)
- **Infrastructure**: Zero — fully managed services

**Why this stack?**
- Minimal operational overhead (Vercel handles CI/CD, zero-downtime deploys, auto-scaling)
- Transparent costs ($0 baseline, +$20/mo Vercel if needed, Supabase free tier covers MVP, AgentMail usage-based)
- Deterministic Business Functions everywhere except the two approved AI exceptions above (no autonomous agent behavior)
- No vendor lock-in beyond Vercel + Postgres + AgentMail (each is swappable behind its own internal interface)

---

## AgentMail Integration Policy

### Purpose

AgentMail exists to make business communication feel effortless.

Users must never know or care that AgentMail exists. It is infrastructure, not a feature.

### Why This Isn't the Rejected PR #27 AI Agent

PR #27's GPT-4o "shadow|live mode" sales agent was rejected for making autonomous *business* decisions (who to contact, what to say to close a sale) with no deterministic guardrail. AgentMail is approved as a narrower, different thing:

- It never makes a business decision — it only executes communication mechanics (find the thread, draft the wording, summarise the text) inside a flow the user always triggers and can always see.
- Every AgentMail action ends in a deterministic, logged record (activity log entry, task, calendar update) — the same pattern the rest of this app already uses for status changes (see `server/workflow/`).
- It does not touch signup/sales flows, pricing, or any GPT-4o-style "shadow mode" — those remain rejected.
- It is additive (a communication layer), not a platform rewrite — Next.js, Vercel, and Supabase are unchanged.

If a future request tries to extend AgentMail into autonomous business decisions (e.g. auto-sending without confirmation, agent-initiated outreach), treat that as a new architecture change requiring the same approval process as PR #27 — this policy does not pre-approve it.

### Product Philosophy

Never build "an AI email system." Build a business that simply communicates on behalf of the user.

The user should think:
- "Email the customer."
- "Reply to Dagon."
- "Read my messages."
- "Anything important?"

The system decides how to achieve this.

### Voice Examples

**User**: "Email Dagon."

**System**:
- Finds the contact.
- Opens or continues the correct conversation.
- Generates the draft.
- Speaks the draft back if confirmation is enabled.
- Sends the email.
- Logs the activity.
- Creates any required follow-up task.

**User**: "Read my new emails."

**System**:
- Reads unread messages.
- Summarises long conversations.
- Highlights urgent actions.
- Creates tasks where appropriate.
- Updates CRM records automatically.

**User**: "Reply yes and book next Thursday."

**System**:
- Understands conversation context.
- Replies in the correct email thread.
- Updates the calendar.
- Updates the work schedule.
- Creates reminders if necessary.

### AgentMail Responsibilities

AgentMail may be used for:
- Persistent email conversations
- Conversation threading
- Receiving inbound emails
- Sending outbound emails
- Shared business inboxes
- Voice-controlled email
- AI-assisted drafting
- Email summarisation
- Attachment handling

### AgentMail Must Never Become

- A separate application
- A visible email client
- Another dashboard
- Another inbox users must manage

It exists only to support business workflows.

### Integration Rules

Every email interaction should update the business automatically where appropriate:

Customer enquiry → conversation continues → lead created → task assigned → calendar updated → reminder scheduled → timeline updated → decision recorded → everything remains synchronised.

### FineGuard

FineGuard remains a compliance platform (see `lib/app-registry.ts` — Companies House compliance monitoring and deadline alerts). Its purpose is: **"Never miss an important business obligation."** Email, voice, dashboards, notifications, and automation all exist to support that one goal — none of them is the product.

FineGuard primarily uses transactional email. Use AgentMail only where persistent customer conversations add value — accountant support, customer onboarding, compliance discussions, white-label partner communication.

Do not replace transactional notifications with AgentMail unnecessarily.

### UltraCore / JustWorks

AgentMail is the communication layer of the Business Operating System.

Voice is the interface. Icons provide visibility. AgentMail provides memory and conversation continuity. The user experiences one seamless system.

### Design Rule

Whenever implementing email features, ask: **"Does this make business communication feel like it just works?"**

If not, simplify the design. The technology must remain invisible to the user.

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
- No new paid services without explicit approval (AgentMail is the one approved exception — see **AgentMail Integration Policy**)
- No AI unless deterministic, explicitly optional, or the approved AgentMail email-mechanics path
- Deployment stays Vercel; database stays Supabase
- If in doubt, ask

### Before Merging a Branch
- ✅ TypeScript compiles (`npm run type-check`)
- ✅ Tests pass (`npm test`)
- ✅ Build succeeds (`npm run build`)
- ✅ No new paid infrastructure (other than the approved AgentMail integration)
- ✅ No new AI dependencies by default (other than the approved AgentMail drafting/summarization, scoped per policy)
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

**Last updated**: 2026-07-03  
**Decision**: Vercel + Supabase + Next.js (deterministic, managed, cost-effective)
**Product vision added**: 2026-07-03 — mobile-first, voice-first, icon-first "just works" business OS; see **Product Vision** section above
**AgentMail approved**: 2026-07-03 — persistent conversational email layer; the one sanctioned exception to "no AI unless deterministic," scoped to email mechanics only — see **AgentMail Integration Policy** above

---

## Key Learnings

**Auth/Env Confusion (Most Common Issue)**
- Client-side env vars must use `NEXT_PUBLIC_` prefix in Next.js
- `.env.local` is local-only; Vercel env vars go in dashboard
- To bypass auth in the browser, set `NEXT_PUBLIC_DISABLE_AUTH=true` on Vercel
- Server-side `DISABLE_AUTH` alone won't work for client-side checks
- Never delete auth code; only bypass it behind the flag
