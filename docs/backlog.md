# UltraCore Backlog

**Authority:** apps/registry.json  
**Updated:** 2026-05-26  

---

## ACTIVE NOW

### ULTRA-001 — Deploy Neon Database
**Priority:** P1  
**Status:** OPEN  
**Success:**
- `DATABASE_URL` configured (Neon pooler URL)
- `DIRECT_URL` configured (Neon direct URL)
- `npm run db:bootstrap` exits 0

---

### ULTRA-002 — Deploy UltAi to Vercel
**Priority:** P1  
**Status:** OPEN  
**Depends on:** ULTRA-001  
**Success:**
- Vercel project created
- Environment variables configured
- Production deployment live

---

### ULTRA-003 — Prove PIE → UltAi → VaultLine Workflow
**Priority:** P1  
**Status:** OPEN  
**Depends on:** ULTRA-002  
**Success:**
- Opportunity created via `POST /api/pie/opportunity`
- Intake task created in `intake_forms`
- Audit event recorded in `clerk_audit_events`

---

### ULTRA-004 — Prove FineGuard Alert Flow
**Priority:** P1  
**Status:** OPEN  
**Depends on:** ULTRA-003  
**Success:**
- Company imported to `monitored_companies`
- Compliance risk detected
- Alert generated
- Email provider decision recorded

---

## NEXT

### ULTRA-010 — Build core-workflow Package
**Priority:** P2  
**Status:** DONE  
**Success:**
- Shared 10-state lifecycle implemented in `packages/core-workflow` ✅
- Valid transitions pass ✅
- Invalid transitions throw ✅
- Tests added ✅ (42 tests)

---

### ULTRA-011 — Monorepo Consolidation
**Priority:** P2  
**Status:** NEXT  
**Success:**
- P1 apps mapped into `apps/`
- Shared packages mapped into `packages/`
- `apps/registry.json` remains source of truth

---

## FUTURE / PARKED

### ULTRA-020 — Evaluate Supabase for UltraCore v2
**Priority:** P3  
**Status:** BACKLOG  
**Do NOT implement.**  
**Question:** Would Supabase replace or complement Neon?

Evaluate:
- Auth
- RLS
- Storage
- Realtime
- Customer portals
- Multi-tenant access control

**Decision required (after P1 systems are live):**
- KEEP NEON
- MIGRATE TO SUPABASE
- HYBRID APPROACH

---

### ULTRA-021 — Review GroundBreaker AI Merge Into Accuracy PIE
**Priority:** P3  
**Status:** BACKLOG  
**Do NOT implement.**

---

### ULTRA-022 — Review FineGuardPro Merge Into FineGuard
**Priority:** P3  
**Status:** BACKLOG  
**Do NOT implement.**

---

### ULTRA-023 — Review ClerkOS Overlap With UltAi
**Priority:** P3  
**Status:** BACKLOG  
**Do NOT implement.**
