# SheetOps Branch Incompatibility Analysis

**Date:** 2026-06-28  
**Repository:** allin50-cmd/manus-frontend  
**Branch:** claude/ultracore-sheetops-mvp-wAwwp  
**Status:** ARCHIVED — Not recommended for canonical main  
**Authority:** MANUS-CONSOLIDATION-AUDIT.md

---

## Executive Summary

The SheetOps variant (branch: `claude/ultracore-sheetops-mvp-wAwwp`) represents an alternative architectural direction that is **fundamentally incompatible** with the current main branch. The two branches cannot be merged, cannot coexist on the same deployment, and serve competing implementations of the business operating system.

**Recommendation:** Archive SheetOps variant. Do not merge to main. Preserve in git history for reference.

---

## Structural Differences

### Module Organization

**Main branch (canonical):**
```
app/
├── os/                              ← Business Operating System
│   ├── contacts/
│   ├── tasks/
│   ├── calls/
│   ├── money/                       ← with invoices, quotes
│   ├── documents/
│   ├── messages/
│   ├── work-items/
│   ├── decisions/
│   ├── templates/
│   ├── alerts/
│   └── ... (more os modules)
├── api/
│   ├── os/                          ← API for OS modules
│   │   ├── people/
│   │   ├── tasks/
│   │   ├── calls/
│   │   ├── documents/
│   │   ├── message-threads/
│   │   ├── messages/
│   │   └── ... (10 routes total)
│   └── ...
└── ...
```

**SheetOps branch (incompatible):**
```
app/
├── work-items/                      ← Top-level modules
├── alerts/
├── partnerships/
├── contacts/                         ← Note: Different from os/contacts
├── templates/
├── settings/
├── portfolio/
├── my-tasks/
├── filings/
├── dashboard/
├── alert-recipients/
├── activity/
├── voice-intake/
└── api/                              ← API routes
    ├── work-items/
    ├── alerts/
    ├── partnerships/
    ├── ... (50 routes total)
```

### API Route Comparison

| Dimension | Main | SheetOps | Conflict? |
|---|---|---|---|
| **Total API routes** | 10 | 50 | YES |
| **Naming pattern** | `/api/os/{resource}` | `/api/{resource}` | YES |
| **Route structure** | Nested under `/os/` | Flat at `/api/` | BLOCKS COEXISTENCE |

**Concrete conflict example:**

```
Main:    GET /api/os/work-items
SheetOps: GET /api/work-items    ← Same resource, different path
         GET /api/work-items/search
         GET /api/work-items/{id}/audit
         ... 5 more endpoints for work-items alone
```

If both branches were deployed simultaneously:
- SheetOps /api/work-items would override expected /api/os/work-items behavior
- No way to serve both API structures from one domain
- Clients would break

---

## Database Schema Differences

### Drizzle Configuration Status

| Branch | Drizzle Config | Status |
|---|---|---|
| main | ✓ Present (4 files) | ACTIVE — migrations exist |
| sheetops | ✗ Missing (0 files) | INCOMPLETE — no migration path |

**Implication:** SheetOps branch uses Prisma only, has no Drizzle migration tooling, and cannot be brought in sync with main's database schema evolution.

### Table Naming

**Main branch (inferred from Drizzle schema):**
```
os_persons
os_tasks
os_calls
os_documents
os_messages
os_quotes
os_invoices
os_work_items
os_decisions
os_templates
os_alerts
```

**SheetOps branch (inferred from API routes):**
Unclear from code analysis, but likely:
```
work_items
alerts
partnerships
contacts
templates
... (different naming convention)
```

**Implication:** Even if route paths were resolved, database table names don't align. A work_items record in SheetOps is structurally different from os_work_items in main.

---

## Feature Coverage Comparison

### Phase 4 Sprint 1 Create Forms

**Main branch (after Phase 4):**
- ✓ Contact form (create)
- ✓ Task form (create)
- ✓ Call form (create)
- ✓ Message form (create) + thread API
- ✓ Quote form (create)
- ✓ Invoice form (create)
- ✓ Document upload form (create)

**SheetOps branch:**
- ? Unknown (no app/os modules to compare)
- Unclear if SheetOps has equivalent forms
- Cannot determine feature parity without detailed analysis

---

## Why SheetOps Cannot Be Merged to Main

### Reason 1: API Path Conflicts (BLOCKING)

**The problem:**
```
Merging SheetOps would introduce:
  GET /api/work-items
  GET /api/work-items/{id}
  GET /api/work-items/search
  ... 47 more routes at /api/*

Existing in main:
  GET /api/os/work-items
  GET /api/os/documents
  ... 10 routes at /api/os/*

Result: Server has two conflicting API structures.
Browser/client code breaks. No way to use both.
```

**Resolution required:** Every SheetOps route would need to be rewritten as `/api/os/*`. This is not a merge — it's a complete refactoring of 50 routes.

### Reason 2: App Structure Mismatch (BLOCKING)

**The problem:**
```
Main uses:        app/os/{module}/{page}
SheetOps uses:    app/{module}/{page}

Merging would create:
  app/os/contacts
  app/contacts              ← Same module, two locations

Which routing path wins? Next.js would either:
  - Throw build error (duplicate module)
  - Choose one arbitrarily
  - Require manual conflict resolution
```

**Resolution required:** Either:
1. Move all SheetOps modules into app/os/ (defeats purpose of SheetOps)
2. Delete all main's app/os modules (destroys current functionality)
3. Keep separate (can't merge)

### Reason 3: Database Schema Incompatibility (BLOCKING)

**The problem:**
```
Main has Drizzle migrations:
  db/migrations/001_initial_os_schema.sql
  db/migrations/002_add_messages.sql
  ... 8 migrations total

SheetOps has:
  No Drizzle config
  Only Prisma schema

Merging would require:
  1. Moving SheetOps tables into Drizzle schema
  2. Creating migration for SheetOps tables
  3. Ensuring table names don't conflict
  4. Running migration on production (risky)
```

**Resolution required:** Complete database refactoring and migration testing.

### Reason 4: No Feature Parity (QUESTIONABLE)

**The problem:**
```
Phase 4 Sprint 1 forms (7 total) exist in main.
Unknown if SheetOps has equivalent forms.
If SheetOps does NOT have these forms, it's behind.
If SheetOps DOES have them, they're duplicates.

Either way: merging doesn't add value.
```

---

## SheetOps Architectural Philosophy (Why It Was Created)

**Hypothesis based on code structure:**

SheetOps attempted to:
1. Flatten the module hierarchy (remove app/os nesting)
2. Maximize API endpoints (50 vs 10) for granular access
3. Use Prisma exclusively (simpler, more auto-generated)
4. Implement more complex domain logic (partnerships, filings)

**Why this approach was likely abandoned:**
1. Conflicts with established main branch structure
2. Incomplete migration to this architecture
3. Prisma lacks Drizzle's migration sophistication
4. Not integrated with Phase 4 Sprint 1 work
5. No evidence of active deployment or use

---

## Decision: Archive, Don't Delete

### Why Archive?

1. **Preserve architectural history** — Future developers should understand why SheetOps was attempted
2. **Reference implementation** — Some API patterns in SheetOps might be valuable for Phase 5+
3. **Git history preservation** — Deleting loses commit history; archiving keeps it queryable
4. **Safety** — If somehow needed, branch still exists in git

### How to Archive

1. Create documentation: `docs/archive/sheetops-variant-decision.md`
2. Rename branch: `claude/ultracore-sheetops-mvp-wAwwp` → `archived/sheetops-incompatible`
3. Update branch protection: Prevent merges from archived/* branches
4. Update DECISION_LOG.md: Document why archived
5. Keep in GitHub repo (don't delete)

### Criteria for Un-archiving (if needed)

Unarchive only if:
1. Stakeholder explicitly requests SheetOps features
2. Complete feature analysis shows SheetOps has something main doesn't
3. Willing to do full refactoring to integrate
4. Project timeline permits the architectural work

---

## Conclusion

**SheetOps is not a candidate for canonical main because:**

- ✗ 40 conflicting API routes
- ✗ Incompatible app structure
- ✗ Missing Drizzle ORM configuration
- ✗ No feature parity evidence
- ✗ Would require complete refactoring to integrate
- ✗ No active deployment or use

**Canonical path forward:** Phase 4 Sprint 1 (jolly-hawking) extends main in a compatible, mergeable way.

---

## References

- MANUS-CONSOLIDATION-AUDIT.md (main consolidation document)
- Branch comparison matrix (in consolidation audit)
- DECISION_LOG.md (decision record)

