# Architecture Documentation Audit

**Date**: June 27, 2026  
**Purpose**: Identify all architecture documentation and establish source of truth  
**Scope**: Read-only audit of all Markdown files in repository

---

## Summary

The repository contains **comprehensive architecture documentation** organized into three tiers:

### Tier 1: Governance & Constitution (AUTHORITATIVE)
These documents define what UltraTechOS **is** and **is not**. They are the source of truth.

1. **ULTRATECHOS.md** ⭐ PRIMARY CONSTITUTION
   - Product definition: mobile-first Business Operating System for small UK businesses
   - Core modules (FineGuard, UltAi, VaultLine, Work Items, etc.)
   - Technical foundation (Next.js, Drizzle, Supabase, Vercel)
   - Architecture principles (Single Source of Truth, Mobile-First, Shared Business Spine)
   - Navigation structure (`/os/today`, `/os/companies`, `/os/workspace/`, etc.)
   - Status: **CURRENT & AUTHORITATIVE**

2. **ANTI_DRIFT.md** ⭐ GOVERNANCE RULES
   - Prevents architectural drift in AI coding sessions
   - Lists prohibited changes (no Prisma, no tRPC, no LangGraph, no monorepo)
   - Lists changes requiring confirmation (new migrations, new API routes, new pages)
   - Lists safe changes (bug fixes, `trackEvent()`, `force-dynamic`)
   - Known drift patterns to watch for
   - Status: **CURRENT & AUTHORITATIVE**

3. **CLAUDE.md** ⭐ SESSION GOVERNANCE
   - References ULTRATECHOS.md, ANTI_DRIFT.md, and docs/ARCHITECTURE_GUARDRAILS.md
   - Commit message conventions (imperative mood)
   - Build commands
   - Protected files that require confirmation before changes
   - Status: **CURRENT & AUTHORITATIVE**

4. **docs/ARCHITECTURE_GUARDRAILS.md**
   - Approved and not-approved technology choices
   - Hard constraints (ORM: Drizzle only, Auth: JWT only, Database: Supabase only)
   - Status: **CURRENT & AUTHORITATIVE**

5. **docs/DECISION_LOG.md**
   - Major architectural decisions with rationale
   - Decisions recorded: Drizzle ORM, Supabase, JWT/jose, Vercel, FineGuard isolation, Validation Framework, governance docs
   - Status: **CURRENT & AUTHORITATIVE**

---

### Tier 2: Phase Implementation Plans (ACTIVE)
These documents describe the work breakdown for each phase. They are current and should guide development.

1. **PHASE_1_CONSOLIDATION_SAFE.md**
   - Phase 1 consolidation plan
   - Status: COMPLETED (Phase 1 is done)

2. **PHASE_2_NAVIGATION_SAFE.md**
   - Phase 2 navigation consolidation
   - Status: COMPLETED (Phase 2 is done)

3. **PHASE_3_BUSINESS_WORKSPACE.md**
   - Phase 3: Build real business workspace
   - Status: COMPLETED (Phase 3 is done)

4. **PHASE_4_CONNECT_THE_BOS.md**
   - Phase 4: Connect the Business Operating System (5 sprints)
   - Status: CURRENT (just created this session)

5. **PHASE_4_SPRINT_1_REVISED.md**
   - Sprint 1 detailed breakdown (create flows, detail pages, action buttons, metrics)
   - Verification matrix
   - End-to-end test flow
   - Status: CURRENT (just created this session)

6. **PHASE_4_SPRINT_1_BUILD_ORDER.md**
   - Exact sequence for building 8 create forms
   - Wave-based prioritization
   - Template pattern for all forms
   - Status: CURRENT (just created this session)

---

### Tier 3: Documentation & Reference (SUPPORTING)
These documents provide details, audits, and context but are not primary sources of truth.

1. **docs/DECISION_LOG.md** (also Tier 1)
   - Records major decisions and approvals
   - Links to related documents

2. **docs/CODE_ASSET_INVENTORY.md**
   - Inventory of code files and modules
   - Consolidation recommendations
   - Status: Historical (from Phase 1)

3. **docs/CONSOLIDATION-AUDIT.md** (CONSOLIDATION_AUDIT.md root)
   - Audit of consolidation work across phases
   - Status: Historical/Complete

4. **docs/PHASE_4_AUDIT.md** (just created this session)
   - Current state of each screen (what works, what needs work)
   - Status: Reference for Phase 4 planning

5. **FINEGUARD.md**
   - FineGuard-specific setup and workflow documentation
   - Manual testing guide
   - Status: CURRENT (for FineGuard operations)

6. **docs/deployment-*.md** (multiple files)
   - Deployment guides, inventory, standards
   - Status: Reference for operations

---

## Critical Gap: Missing Architecture Vision Document

**Important Finding**: There is **no `/ai/` folder** with the documents the user mentioned:
- `00_READ_THIS_FIRST.md`
- `01_PROJECT_MEMORY.md`
- `03_ARCHITECTURE.md`
- `04_MODULES.md`
- `09_ROADMAP.md`

These documents, if they existed, would define:
- SheetOps as a core subsystem (not standalone)
- How SheetOps integrates with the OS
- The relationship between data model, workspace, and apps
- Module architecture and boundaries

**Status**: These documents either:
1. Exist in a different repository (separate architecture/planning repo)
2. Were created in a previous session and lost to session compression
3. Need to be created based on the current architecture

---

## Current Source of Truth

### For Product Definition
→ **ULTRATECHOS.md** (what the system is)

### For Engineering Rules
→ **ANTI_DRIFT.md** (what is prohibited)  
→ **docs/ARCHITECTURE_GUARDRAILS.md** (approved tech)

### For Session Governance
→ **CLAUDE.md** (process rules)

### For Data Model
→ **db/schema.ts** (Drizzle schema — the actual source of truth)

### For Current Phase
→ **PHASE_4_CONNECT_THE_BOS.md** (what we're building)  
→ **PHASE_4_SPRINT_1_REVISED.md** (detailed implementation plan)

---

## Recommendations

### 1. No Immediate Action Needed
The existing governance documents (ULTRATECHOS, ANTI_DRIFT, CLAUDE, ARCHITECTURE_GUARDRAILS) are comprehensive and current. They provide sufficient guidance.

### 2. Create Missing Vision Document (Optional)
If SheetOps integration is critical to understanding future work, create:
- `/docs/SHEETOPS_ARCHITECTURE.md`
- Define SheetOps role in the OS
- Show how it integrates with workspace and apps
- Document data model boundaries

This would prevent the kind of drift that happened with the Sheets discussion.

### 3. Add to DECISION_LOG.md
Record the decision to focus Phase 4 on **data-first validation** rather than dashboard widgets:
```
## [2026-06-27] — Phase 4 Sprint 1: Data-First Validation

**Decision:** Prioritize verifying create/read/update/delete flows over adding dashboard metrics.

**Reason:** Dashboard widgets are only valuable once the underlying data model is proven reliable. 
The critical path is proving that users can create a company → add contact → log call → create 
task → upload document → create quote → invoice end-to-end within a single, trustworthy data model.

**Approved By:** User.
```

---

## Files to Read (In Order) — For New Sessions

### If Starting Fresh
1. `ULTRATECHOS.md` — What is this system?
2. `ANTI_DRIFT.md` — What can I not do?
3. `db/schema.ts` — What is the data model?
4. `CLAUDE.md` — What are the process rules?
5. `PHASE_4_CONNECT_THE_BOS.md` — What are we building?

### If Continuing Phase 4 Sprint 1
1. `PHASE_4_SPRINT_1_REVISED.md` — Task breakdown
2. `PHASE_4_SPRINT_1_BUILD_ORDER.md` — Exact implementation order
3. `app/os/work-items/new/page.tsx` — Form template to copy

---

## Conclusion

✅ The existing governance and phase documentation is comprehensive and current.

⚠️ The missing `/ai/` folder (SheetOps architecture vision) is a gap if that's critical to preventing drift.

✅ The source of truth is properly identified: ULTRATECHOS.md, ANTI_DRIFT.md, and db/schema.ts.

**Next Step**: Either locate the `/ai/` docs in another repo, or confirm that the current tier-1 documents are sufficient for Phase 4 work.
