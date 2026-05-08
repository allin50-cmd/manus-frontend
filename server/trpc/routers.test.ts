import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { Tenant } from "../drizzle/schema";
import { ClerkOSEngine } from "../engine/clerkOS.engine";
import type { DrizzleDb } from "../engine/types";

// ─── Tenant fixtures ──────────────────────────────────────────────────────────

const ALPHA: Tenant = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  name: "Alpha Court", slug: "alpha", plan: "professional",
  settings: null, createdAt: new Date(), updatedAt: new Date(),
};
const BETA: Tenant = {
  id: "bbbbbbbb-0000-0000-0000-000000000002",
  name: "Beta Court", slug: "beta", plan: "free",
  settings: null, createdAt: new Date(), updatedAt: new Date(),
};

// ─── Context factories ────────────────────────────────────────────────────────

const mkReq = () => ({ protocol: "https", headers: {} } as TrpcContext["req"]);
const mkRes = () => ({ clearCookie: vi.fn() } as unknown as TrpcContext["res"]);

const adminCtx = (tenant = ALPHA): TrpcContext => ({
  user: {
    id: 1, tenantId: tenant.id, openId: "admin-user",
    email: "admin@court.local", name: "Admin",
    loginMethod: "test", role: "admin (senior clerk / manager)",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  },
  tenantId: tenant.id, tenant, req: mkReq(), res: mkRes(),
});

const clerkCtx = (tenant = ALPHA): TrpcContext => ({
  user: {
    id: 2, tenantId: tenant.id, openId: "clerk-user",
    email: "clerk@court.local", name: "Clerk",
    loginMethod: "test", role: "standard clerk",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  },
  tenantId: tenant.id, tenant, req: mkReq(), res: mkRes(),
});

const unauthCtx = (): TrpcContext => ({
  user: null, tenantId: null, tenant: null, req: mkReq(), res: mkRes(),
});

const noTenantCtx = (role = "standard clerk"): TrpcContext => ({
  user: {
    id: 3, tenantId: "orphan-tenant", openId: "orphan",
    email: "orphan@court.local", name: "Orphan",
    loginMethod: "test", role,
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  },
  tenantId: null, tenant: null, req: mkReq(), res: mkRes(),
});

// ─── Valid inputs ─────────────────────────────────────────────────────────────

const CASE_IN = {
  referenceNumber: "REF-001", title: "Smith v Jones",
  caseType: "civil", plaintiff: "Smith", defendant: "Jones",
};
const HEARING_IN = {
  caseId: 1, hearingDate: "2026-06-01", hearingTime: "10:00",
  courtroom: "Court 1", judge: "HH Judge Patel",
};
const DOC_IN = {
  caseId: 1, fileName: "exhibit-a.pdf", fileUrl: "/docs/exhibit-a.pdf",
  fileType: "pdf", documentType: "exhibit", uploadedBy: 1,
};
const ALLOC_IN = {
  caseId: 1, clerkId: 2, taskType: "Prepare bundle",
};
const DIARY_IN = {
  clerkId: 1, date: "2026-06-01",
};

// ─── Engine mock DB ───────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function makeEngineDb(opts: {
  caseRow?: Row | null;
  updatedRow?: Row;
  docRows?: Row[];
}): DrizzleDb {
  let selectCount = 0;

  // thenable: awaitable directly OR via .limit()
  const thenable = (rows: unknown[]) => ({
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(rows).then(res, rej),
    catch: (rej: (e: unknown) => unknown) => Promise.resolve(rows).catch(rej),
    finally: (fin: () => void) => Promise.resolve(rows).finally(fin),
    limit: vi.fn().mockResolvedValue(rows),
  });

  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          selectCount++;
          const rows =
            selectCount === 1
              ? opts.caseRow ? [opts.caseRow] : []
              : opts.docRows ?? [];
          return thenable(rows);
        }),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue(
            opts.updatedRow ? [opts.updatedRow] : []
          ),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 99, status: "pending" }]),
      })),
    })),
    execute: vi.fn().mockResolvedValue([]),
  } as unknown as DrizzleDb;
}

const mkCase = (status: string, id = 1): Row => ({
  id, tenantId: ALPHA.id, referenceNumber: `REF-00${id}`,
  title: "Test Case", status, caseType: "civil",
  plaintiff: "P", defendant: "D", judge: null, description: null,
  createdAt: new Date(), updatedAt: new Date(),
});

// ─────────────────────────────────────────────────────────────────────────────
// STRESS TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

describe("ClerkOS — Stress Test Suite", () => {

  // ══════════════════════════════════════════════════════════════
  // 1 · AUTH MIDDLEWARE ENFORCEMENT
  // ══════════════════════════════════════════════════════════════

  describe("1 · Auth middleware enforcement", () => {

    // authedProcedure
    it("unauth → UNAUTHORIZED on auth.me", async () => {
      await expect(appRouter.createCaller(unauthCtx()).auth.me())
        .rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
    it("unauth → UNAUTHORIZED on auth.logout", async () => {
      await expect(appRouter.createCaller(unauthCtx()).auth.logout())
        .rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    // tenantProcedure — unauthenticated
    it("unauth → UNAUTHORIZED on cases.list (tenantProcedure)", async () => {
      await expect(appRouter.createCaller(unauthCtx()).cases.list())
        .rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
    it("unauth → UNAUTHORIZED on hearings.list (tenantProcedure)", async () => {
      await expect(appRouter.createCaller(unauthCtx()).hearings.list())
        .rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
    it("unauth → UNAUTHORIZED on dashboard.stats (tenantProcedure)", async () => {
      await expect(appRouter.createCaller(unauthCtx()).dashboard.stats())
        .rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    // tenantProcedure — authenticated but no tenant
    it("no-tenant user → FORBIDDEN on cases.list", async () => {
      await expect(appRouter.createCaller(noTenantCtx()).cases.list())
        .rejects.toMatchObject({ code: "FORBIDDEN" });
    });
    it("no-tenant user → FORBIDDEN on hearings.list", async () => {
      await expect(appRouter.createCaller(noTenantCtx()).hearings.list())
        .rejects.toMatchObject({ code: "FORBIDDEN" });
    });
    it("no-tenant user → FORBIDDEN on dashboard.stats", async () => {
      await expect(appRouter.createCaller(noTenantCtx()).dashboard.stats())
        .rejects.toMatchObject({ code: "FORBIDDEN" });
    });
    it("no-tenant admin → FORBIDDEN on cases.create", async () => {
      await expect(
        appRouter.createCaller(noTenantCtx("admin (senior clerk / manager)"))
          .cases.create(CASE_IN)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    // adminProcedure — standard clerk
    it("standard clerk → FORBIDDEN on cases.create", async () => {
      await expect(appRouter.createCaller(clerkCtx()).cases.create(CASE_IN))
        .rejects.toMatchObject({ code: "FORBIDDEN" });
    });
    it("standard clerk → FORBIDDEN on cases.transition", async () => {
      await expect(
        appRouter.createCaller(clerkCtx()).cases.transition({ id: 1, status: "closed" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
    it("standard clerk → FORBIDDEN on hearings.create", async () => {
      await expect(appRouter.createCaller(clerkCtx()).hearings.create(HEARING_IN))
        .rejects.toMatchObject({ code: "FORBIDDEN" });
    });
    it("standard clerk → FORBIDDEN on allocations.create", async () => {
      await expect(appRouter.createCaller(clerkCtx()).allocations.create(ALLOC_IN))
        .rejects.toMatchObject({ code: "FORBIDDEN" });
    });
    it("standard clerk → FORBIDDEN on allocations.update", async () => {
      await expect(
        appRouter.createCaller(clerkCtx()).allocations.update({ id: 1, status: "completed" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
    it("standard clerk → FORBIDDEN on allocations.getPending", async () => {
      await expect(appRouter.createCaller(clerkCtx()).allocations.getPending())
        .rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 2 · ZOD INPUT VALIDATION
  // ══════════════════════════════════════════════════════════════

  describe("2 · Zod input validation", () => {

    it("cases.create — empty referenceNumber → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).cases.create({ ...CASE_IN, referenceNumber: "" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("cases.create — empty title → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).cases.create({ ...CASE_IN, title: "" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("cases.create — empty plaintiff → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).cases.create({ ...CASE_IN, plaintiff: "" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("cases.create — empty defendant → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).cases.create({ ...CASE_IN, defendant: "" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("cases.create — invalid status enum → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).cases.create({ ...CASE_IN, status: "archived" as never })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("hearings.create — DD/MM/YYYY date format → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).hearings.create({ ...HEARING_IN, hearingDate: "01/06/2026" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("hearings.create — HH:MM:SS time format → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).hearings.create({ ...HEARING_IN, hearingTime: "10:00:00" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("hearings.create — single-digit time → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).hearings.create({ ...HEARING_IN, hearingTime: "9:00" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("hearings.create — invalid status enum → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).hearings.create({ ...HEARING_IN, status: "pending" as never })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("hearings.create — empty courtroom → BAD_REQUEST", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).hearings.create({ ...HEARING_IN, courtroom: "" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("cases.list — limit=0 (below min 1) → BAD_REQUEST", async () => {
      await expect(appRouter.createCaller(clerkCtx()).cases.list({ limit: 0, offset: 0 }))
        .rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("cases.list — limit=201 (above max 200) → BAD_REQUEST", async () => {
      await expect(appRouter.createCaller(clerkCtx()).cases.list({ limit: 201, offset: 0 }))
        .rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
    it("cases.list — offset=-1 → BAD_REQUEST", async () => {
      await expect(appRouter.createCaller(clerkCtx()).cases.list({ limit: 10, offset: -1 }))
        .rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("cases.search — empty query (below min 1) → BAD_REQUEST", async () => {
      await expect(appRouter.createCaller(clerkCtx()).cases.search({ query: "" }))
        .rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 3 · DB-UNAVAILABLE ERROR CONTRACT
  // ══════════════════════════════════════════════════════════════

  describe("3 · DB-unavailable contract (DATABASE_URL absent in test env)", () => {

    it("cases.create → throws 'Database not available'", async () => {
      await expect(appRouter.createCaller(adminCtx()).cases.create(CASE_IN))
        .rejects.toThrow("Database not available");
    });
    it("cases.update → throws 'Database not available'", async () => {
      await expect(appRouter.createCaller(adminCtx()).cases.update({ id: 1, title: "X" }))
        .rejects.toThrow("Database not available");
    });
    it("cases.transition → throws 'Database not available'", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).cases.transition({ id: 1, status: "closed" })
      ).rejects.toThrow("Database not available");
    });
    it("hearings.create → throws 'Database not available'", async () => {
      await expect(appRouter.createCaller(adminCtx()).hearings.create(HEARING_IN))
        .rejects.toThrow("Database not available");
    });
    it("hearings.update → throws 'Database not available'", async () => {
      await expect(appRouter.createCaller(adminCtx()).hearings.update({ id: 1, status: "completed" }))
        .rejects.toThrow("Database not available");
    });
    it("documents.create → throws 'Database not available'", async () => {
      await expect(appRouter.createCaller(adminCtx()).documents.create(DOC_IN))
        .rejects.toThrow("Database not available");
    });
    it("documents.approveForBundle → throws 'Database not available'", async () => {
      await expect(
        appRouter.createCaller(adminCtx()).documents.approveForBundle({ id: 1, approved: true })
      ).rejects.toThrow("Database not available");
    });
    it("allocations.create → throws 'Database not available'", async () => {
      await expect(appRouter.createCaller(adminCtx()).allocations.create(ALLOC_IN))
        .rejects.toThrow("Database not available");
    });
    it("allocations.update → throws 'Database not available'", async () => {
      await expect(appRouter.createCaller(adminCtx()).allocations.update({ id: 1, status: "completed" }))
        .rejects.toThrow("Database not available");
    });
    it("diary.create → throws 'Database not available'", async () => {
      await expect(appRouter.createCaller(adminCtx()).diary.create(DIARY_IN))
        .rejects.toThrow("Database not available");
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 4 · ENGINE STATE MACHINE — ALL 16 TRANSITIONS
  // ══════════════════════════════════════════════════════════════

  describe("4 · ClerkOSEngine state machine (16 transitions)", () => {

    const VALID: [string, string][] = [
      ["open",        "in_progress"],
      ["open",        "on_hold"],
      ["open",        "closed"],
      ["in_progress", "closed"],
      ["in_progress", "on_hold"],
      ["in_progress", "open"],
      ["on_hold",     "open"],
      ["on_hold",     "in_progress"],
      ["on_hold",     "closed"],
      ["closed",      "open"],
    ];

    const INVALID: [string, string][] = [
      ["open",        "open"],
      ["in_progress", "in_progress"],
      ["on_hold",     "on_hold"],
      ["closed",      "closed"],
      ["closed",      "in_progress"],
      ["closed",      "on_hold"],
    ];

    for (const [from, to] of VALID) {
      it(`VALID   ${from.padEnd(11)} → ${to}`, async () => {
        const db = makeEngineDb({
          caseRow: mkCase(from),
          updatedRow: mkCase(to),
        });
        const result = await new ClerkOSEngine(db, ALPHA.id)
          .transitionCase(1, to as never, 1, "admin-user");
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value.status).toBe(to);
      });
    }

    for (const [from, to] of INVALID) {
      it(`INVALID ${from.padEnd(11)} → ${to} (rejected)`, async () => {
        const db = makeEngineDb({ caseRow: mkCase(from) });
        const result = await new ClerkOSEngine(db, ALPHA.id)
          .transitionCase(1, to as never, 1, "admin-user");
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toMatch(new RegExp(`${from}.*${to}`));
        }
      });
    }

    it("non-existent case → ok: false with 'not found'", async () => {
      const db = makeEngineDb({ caseRow: null });
      const result = await new ClerkOSEngine(db, ALPHA.id)
        .transitionCase(999, "closed", 1, "admin-user");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain("not found");
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 5 · ENGINE — BUNDLE ELIGIBILITY
  // ══════════════════════════════════════════════════════════════

  describe("5 · ClerkOSEngine bundle eligibility", () => {

    it("case not found → not eligible", async () => {
      const db = makeEngineDb({ caseRow: null });
      const r = await new ClerkOSEngine(db, ALPHA.id).canGenerateBundle(1);
      expect(r.eligible).toBe(false);
      expect(r.reason).toContain("not found");
    });

    it("case on_hold → not eligible", async () => {
      const db = makeEngineDb({ caseRow: mkCase("on_hold") });
      const r = await new ClerkOSEngine(db, ALPHA.id).canGenerateBundle(1);
      expect(r.eligible).toBe(false);
      expect(r.reason).toContain("on hold");
    });

    it("open case, zero approved documents → not eligible", async () => {
      const db = makeEngineDb({ caseRow: mkCase("open"), docRows: [] });
      const r = await new ClerkOSEngine(db, ALPHA.id).canGenerateBundle(1);
      expect(r.eligible).toBe(false);
      expect(r.reason).toContain("No documents");
    });

    it("in_progress case, one approved document → eligible", async () => {
      const db = makeEngineDb({
        caseRow: mkCase("in_progress"),
        docRows: [{ id: 1, approvedForBundle: 1 }],
      });
      const r = await new ClerkOSEngine(db, ALPHA.id).canGenerateBundle(1);
      expect(r.eligible).toBe(true);
    });

    it("closed case, approved document → eligible (bundles allowed on closed cases)", async () => {
      const db = makeEngineDb({
        caseRow: mkCase("closed"),
        docRows: [{ id: 1, approvedForBundle: 1 }],
      });
      const r = await new ClerkOSEngine(db, ALPHA.id).canGenerateBundle(1);
      expect(r.eligible).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 6 · ROLE ESCALATION PREVENTION
  // ══════════════════════════════════════════════════════════════

  describe("6 · Role escalation prevention", () => {

    const ESCALATION_ROLES = [
      "ADMIN (SENIOR CLERK / MANAGER)",   // wrong case
      "admin (senior clerk / manager) ",  // trailing space
      "admin",
      "administrator",
      "superuser",
      "root",
      "",
    ] as const;

    for (const role of ESCALATION_ROLES) {
      it(`role "${role || "(empty)"}" → FORBIDDEN on cases.create`, async () => {
        const ctx: TrpcContext = { ...adminCtx(), user: { ...adminCtx().user!, role } };
        await expect(appRouter.createCaller(ctx).cases.create(CASE_IN))
          .rejects.toMatchObject({ code: "FORBIDDEN" });
      });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // 7 · CONCURRENCY STRESS
  // ══════════════════════════════════════════════════════════════

  describe("7 · Concurrency (50 parallel requests per endpoint)", () => {

    it("50 × cases.list all resolve to arrays", async () => {
      const results = await Promise.all(
        Array.from({ length: 50 }, () =>
          appRouter.createCaller(clerkCtx()).cases.list()
        )
      );
      expect(results).toHaveLength(50);
      results.forEach((r) => expect(Array.isArray(r)).toBe(true));
    });

    it("50 × hearings.list all resolve to arrays", async () => {
      const results = await Promise.all(
        Array.from({ length: 50 }, () =>
          appRouter.createCaller(clerkCtx()).hearings.list()
        )
      );
      expect(results).toHaveLength(50);
      results.forEach((r) => expect(Array.isArray(r)).toBe(true));
    });

    it("50 × dashboard.stats all return full shape", async () => {
      const results = await Promise.all(
        Array.from({ length: 50 }, () =>
          appRouter.createCaller(adminCtx()).dashboard.stats()
        )
      );
      expect(results).toHaveLength(50);
      results.forEach((r) => {
        expect(r).toHaveProperty("totalCases");
        expect(r).toHaveProperty("activeCases");
        expect(r).toHaveProperty("pendingHearings");
      });
    });

    it("50 × mixed-role concurrent reads (no cross-contamination)", async () => {
      const results = await Promise.all([
        ...Array.from({ length: 25 }, () => appRouter.createCaller(clerkCtx(ALPHA)).cases.list()),
        ...Array.from({ length: 25 }, () => appRouter.createCaller(clerkCtx(BETA)).cases.list()),
      ]);
      expect(results).toHaveLength(50);
      results.forEach((r) => expect(Array.isArray(r)).toBe(true));
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 8 · DASHBOARD STATS SHAPE CONTRACT
  // ══════════════════════════════════════════════════════════════

  describe("8 · Dashboard stats shape contract", () => {

    it("has all required numeric fields", async () => {
      const stats = await appRouter.createCaller(adminCtx()).dashboard.stats();
      expect(stats).toMatchObject({
        totalCases:        expect.any(Number),
        activeCases:       expect.any(Number),
        closedCases:       expect.any(Number),
        pendingHearings:   expect.any(Number),
        todayHearings:     expect.any(Number),
        pendingAllocations: expect.any(Number),
      });
    });

    it("recentCases is an array (max 5)", async () => {
      const { recentCases } = await appRouter.createCaller(adminCtx()).dashboard.stats();
      expect(Array.isArray(recentCases)).toBe(true);
      expect(recentCases.length).toBeLessThanOrEqual(5);
    });

    it("upcomingHearings is an array (max 5)", async () => {
      const { upcomingHearings } = await appRouter.createCaller(adminCtx()).dashboard.stats();
      expect(Array.isArray(upcomingHearings)).toBe(true);
      expect(upcomingHearings.length).toBeLessThanOrEqual(5);
    });

    it("activeCases + closedCases ≤ totalCases (no DB → all zero)", async () => {
      const { totalCases, activeCases, closedCases } =
        await appRouter.createCaller(adminCtx()).dashboard.stats();
      expect(activeCases + closedCases).toBeLessThanOrEqual(totalCases);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 9 · MULTI-TENANT ISOLATION
  // ══════════════════════════════════════════════════════════════

  describe("9 · Multi-tenant isolation", () => {

    it("alpha and beta tenantIds are distinct", () => {
      expect(adminCtx(ALPHA).tenantId).not.toBe(adminCtx(BETA).tenantId);
    });

    it("alpha and beta cases.list run concurrently without interference", async () => {
      const [a, b] = await Promise.all([
        appRouter.createCaller(adminCtx(ALPHA)).cases.list(),
        appRouter.createCaller(adminCtx(BETA)).cases.list(),
      ]);
      expect(Array.isArray(a)).toBe(true);
      expect(Array.isArray(b)).toBe(true);
    });

    it("alpha and beta dashboard.stats are independent objects", async () => {
      const [a, b] = await Promise.all([
        appRouter.createCaller(adminCtx(ALPHA)).dashboard.stats(),
        appRouter.createCaller(adminCtx(BETA)).dashboard.stats(),
      ]);
      expect(a).toHaveProperty("totalCases");
      expect(b).toHaveProperty("totalCases");
    });

    it("auth.tenant returns the correct tenant for each context", async () => {
      const [a, b] = await Promise.all([
        appRouter.createCaller(adminCtx(ALPHA)).auth.tenant(),
        appRouter.createCaller(adminCtx(BETA)).auth.tenant(),
      ]);
      expect(a?.id).toBe(ALPHA.id);
      expect(b?.id).toBe(BETA.id);
      expect(a?.id).not.toBe(b?.id);
    });

    it("user with no tenantId → FORBIDDEN even with admin role", async () => {
      await expect(
        appRouter.createCaller(noTenantCtx("admin (senior clerk / manager)"))
          .cases.list()
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 10 · AUTH IDENTITY CONTRACT
  // ══════════════════════════════════════════════════════════════

  describe("10 · Auth identity contract", () => {

    it("auth.me returns the user from context", async () => {
      const ctx = adminCtx();
      const user = await appRouter.createCaller(ctx).auth.me();
      expect(user?.openId).toBe("admin-user");
      expect(user?.role).toBe("admin (senior clerk / manager)");
    });

    it("auth.me for standard clerk returns correct role", async () => {
      const user = await appRouter.createCaller(clerkCtx()).auth.me();
      expect(user?.role).toBe("standard clerk");
    });

    it("auth.logout returns { success: true }", async () => {
      const result = await appRouter.createCaller(adminCtx()).auth.logout();
      expect(result).toEqual({ success: true });
    });

    it("auth.tenant returns tenant with correct slug", async () => {
      const tenant = await appRouter.createCaller(adminCtx(ALPHA)).auth.tenant();
      expect(tenant?.slug).toBe("alpha");
      expect(tenant?.id).toBe(ALPHA.id);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 11 · Engine — state machine invalid transitions
  // ══════════════════════════════════════════════════════════════

  describe("11 · Engine — invalid case transitions", () => {

    it("closed → in_progress is rejected", async () => {
      const db = makeEngineDb({ caseRow: mkCase("closed") });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.transitionCase(1, "in_progress", 1, "admin-user");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/not permitted/i);
    });

    it("closed → on_hold is rejected", async () => {
      const db = makeEngineDb({ caseRow: mkCase("closed") });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.transitionCase(1, "on_hold", 1, "admin-user");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/not permitted/i);
    });

    it("open → open (same status) is rejected", async () => {
      const db = makeEngineDb({ caseRow: mkCase("open") });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.transitionCase(1, "open", 1, "admin-user");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/not permitted/i);
    });

    it("transition on missing case returns not-found error", async () => {
      const db = makeEngineDb({ caseRow: null });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.transitionCase(99, "in_progress", 1, "admin-user");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/not found/i);
    });

    it("valid transition open → in_progress succeeds", async () => {
      const updated = mkCase("in_progress");
      const db = makeEngineDb({ caseRow: mkCase("open"), updatedRow: updated });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.transitionCase(1, "in_progress", 1, "admin-user");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.status).toBe("in_progress");
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 12 · Engine — bundle eligibility
  // ══════════════════════════════════════════════════════════════

  describe("12 · Engine — bundle eligibility", () => {

    it("on_hold case is not eligible for bundle", async () => {
      const db = makeEngineDb({ caseRow: mkCase("on_hold"), docRows: [] });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.canGenerateBundle(1);
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/on hold/i);
    });

    it("case with no approved documents is not eligible", async () => {
      const db = makeEngineDb({ caseRow: mkCase("open"), docRows: [] });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.canGenerateBundle(1);
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/no documents/i);
    });

    it("case with approved documents is eligible", async () => {
      const approvedDoc = { id: 10, caseId: 1, tenantId: ALPHA.id, approvedForBundle: 1 };
      const db = makeEngineDb({ caseRow: mkCase("open"), docRows: [approvedDoc] });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.canGenerateBundle(1);
      expect(result.eligible).toBe(true);
    });

    it("missing case returns not-eligible", async () => {
      const db = makeEngineDb({ caseRow: null, docRows: [] });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.canGenerateBundle(99);
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/not found/i);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 13 · Engine — allocation validation
  // ══════════════════════════════════════════════════════════════

  describe("13 · Engine — allocation validation", () => {

    it("cannot allocate to a closed case", async () => {
      const db = makeEngineDb({ caseRow: mkCase("closed") });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.validateAllocationAssignment(1, 2);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/closed/i);
    });

    it("can allocate to an open case", async () => {
      const db = makeEngineDb({ caseRow: mkCase("open") });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.validateAllocationAssignment(1, 2);
      expect(result.ok).toBe(true);
    });

    it("can allocate to an in_progress case", async () => {
      const db = makeEngineDb({ caseRow: mkCase("in_progress") });
      const engine = new ClerkOSEngine(db, ALPHA.id);
      const result = await engine.validateAllocationAssignment(1, 2);
      expect(result.ok).toBe(true);
    });
  });
});

// ─── Pure engine unit tests ───────────────────────────────────────────────────

import { lunarTriage } from '../engine/lunar';
import { ultraCoreGate } from '../engine/ultracore';
import { lolaFollowUp } from '../engine/lola';
import { createVaultHash, buildVaultEvent, verifyVaultEvent } from '../engine/vaultline-audit';

// ─── Lunar Engine ─────────────────────────────────────────────────────────────

describe('Lunar Engine — lunarTriage', () => {
  it('returns base score 20 and normal urgency for an empty description', () => {
    const result = lunarTriage('');
    expect(result.riskScore).toBe(20);
    expect(result.urgency).toBe('normal');
    expect(result.flags).toHaveLength(0);
    expect(result.scoreBreakdown).toHaveLength(0);
  });

  it('returns normal urgency for a description with no matching keywords', () => {
    const result = lunarTriage('I need some general advice about my situation');
    expect(result.riskScore).toBe(20);
    expect(result.urgency).toBe('normal');
  });

  it('adds the correct weight for a single matched keyword', () => {
    // 'deadline' has weight 20 → base 20 + 20 = 40
    const result = lunarTriage('I have a deadline next week');
    expect(result.riskScore).toBe(40);
    expect(result.urgency).toBe('normal');
    expect(result.flags).toContain('deadline');
    expect(result.scoreBreakdown).toContainEqual({ signal: 'deadline', weight: 20 });
  });

  it('accumulates weights from multiple matched keywords', () => {
    // base(20) + 'court'(25) + 'urgent'(15) + 'hearing'(20) = 80
    const result = lunarTriage('I have an urgent court hearing');
    expect(result.riskScore).toBe(80);
    expect(result.urgency).toBe('critical');
    expect(result.flags).toContain('court');
    expect(result.flags).toContain('urgent');
  });

  it('caps the score at 100 when keywords would push it above 100', () => {
    // 'arrest' (40) + 'criminal' (40) + 'violence' (35) → 20 + 40 + 40 + 35 = 135, capped at 100
    const result = lunarTriage('arrest criminal violence charges');
    expect(result.riskScore).toBe(100);
    expect(result.urgency).toBe('critical');
  });

  it('returns high urgency when riskScore is exactly 50', () => {
    // 'court' (25) + 'hearing' (20) → 20 + 25 + 20 = 65 — let's find a combo that hits 50
    // 'divorce' (15) + 'debt' (15) → 20 + 15 + 15 = 50
    const result = lunarTriage('divorce and debt situation');
    expect(result.riskScore).toBe(50);
    expect(result.urgency).toBe('high');
  });

  it('returns critical urgency when riskScore is exactly 80', () => {
    // 'arrest' (40) + 'fraud' (35) → 20 + 40 + 35 = 95 — too high
    // 'injunction' (30) + 'eviction' (30) → 20 + 30 + 30 = 80
    const result = lunarTriage('injunction and eviction order');
    expect(result.riskScore).toBe(80);
    expect(result.urgency).toBe('critical');
  });

  it('is case-insensitive when matching keywords', () => {
    const lower = lunarTriage('court hearing today');
    const upper = lunarTriage('COURT HEARING TODAY');
    expect(lower.riskScore).toBe(upper.riskScore);
    expect(lower.flags).toEqual(upper.flags);
  });

  it('includes all matched signals in scoreBreakdown', () => {
    const result = lunarTriage('bankruptcy and debt repayment dispute');
    const signals = result.scoreBreakdown.map((b) => b.signal);
    expect(signals).toContain('bankruptcy');
    expect(signals).toContain('debt');
    expect(signals).toContain('repayment');
    expect(signals).toContain('dispute');
  });
});

// ─── UltraCore Gate ───────────────────────────────────────────────────────────

describe('UltraCore Gate — ultraCoreGate', () => {
  it('R1: ESCALATEs when riskScore is 80 or above', () => {
    const result = ultraCoreGate({
      issueType: 'Criminal',
      urgency: 'normal',
      riskScore: 80,
      description: 'Detailed description of the matter',
    });
    expect(result.decision).toBe('ESCALATE');
    expect(result.reason).toMatch(/80/);
    expect(result.rules[0]).toMatch(/R1/);
  });

  it('R2: ESCALATEs when urgency is critical (and riskScore < 80)', () => {
    const result = ultraCoreGate({
      issueType: 'Employment',
      urgency: 'critical',
      riskScore: 60,
      description: 'Detailed description of the matter',
    });
    expect(result.decision).toBe('ESCALATE');
    expect(result.reason).toMatch(/critical/i);
    expect(result.rules.some((r) => r.startsWith('R2'))).toBe(true);
  });

  it('R3: DENYs when issueType is an empty string', () => {
    const result = ultraCoreGate({
      issueType: '',
      urgency: 'normal',
      riskScore: 20,
      description: 'Detailed description of the matter',
    });
    expect(result.decision).toBe('DENY');
    expect(result.reason).toMatch(/issue type/i);
  });

  it('R3: DENYs when issueType is a single character (below minimum length)', () => {
    const result = ultraCoreGate({
      issueType: 'X',
      urgency: 'normal',
      riskScore: 20,
      description: 'Detailed description of the matter',
    });
    expect(result.decision).toBe('DENY');
    expect(result.reason).toMatch(/2 characters/i);
  });

  it('R4: DENYs when description length is less than 10 characters', () => {
    const result = ultraCoreGate({
      issueType: 'Employment',
      urgency: 'normal',
      riskScore: 20,
      description: 'Short',
    });
    expect(result.decision).toBe('DENY');
    expect(result.reason).toMatch(/too short/i);
  });

  it('R4: DENYs when description is absent', () => {
    const result = ultraCoreGate({
      issueType: 'Employment',
      urgency: 'normal',
      riskScore: 20,
    });
    expect(result.decision).toBe('DENY');
    expect(result.reason).toMatch(/too short/i);
  });

  it('R5: MODIFYs when riskScore is 50 or above (and urgency is normal)', () => {
    const result = ultraCoreGate({
      issueType: 'Civil Dispute',
      urgency: 'normal',
      riskScore: 50,
      description: 'Full description of the matter at hand',
    });
    expect(result.decision).toBe('MODIFY');
    expect(result.reason).toMatch(/50\/100/);
    expect(result.rules.some((r) => r.startsWith('R5'))).toBe(true);
  });

  it('R6: MODIFYs when urgency is high (and riskScore < 50)', () => {
    const result = ultraCoreGate({
      issueType: 'Employment',
      urgency: 'high',
      riskScore: 30,
      description: 'Full description of the employment matter',
    });
    expect(result.decision).toBe('MODIFY');
    expect(result.reason).toMatch(/high-urgency/i);
    expect(result.rules.some((r) => r.startsWith('R6'))).toBe(true);
  });

  it('R7: ALLOWs standard intake when all checks pass', () => {
    const result = ultraCoreGate({
      issueType: 'Conveyancing',
      urgency: 'normal',
      riskScore: 20,
      description: 'Looking to purchase a property and need legal advice',
    });
    expect(result.decision).toBe('ALLOW');
    expect(result.reason).toMatch(/standard intake/i);
    expect(result.rules.some((r) => r.startsWith('R7'))).toBe(true);
  });

  it('includes a rules audit trail that reflects evaluated rules', () => {
    const result = ultraCoreGate({
      issueType: 'Family',
      urgency: 'normal',
      riskScore: 20,
      description: 'General family law advice required',
    });
    expect(result.rules.length).toBeGreaterThanOrEqual(7);
    expect(result.rules[0]).toMatch(/^R1/);
  });
});

// ─── Lola Follow-up Engine ────────────────────────────────────────────────────

describe('Lola Engine — lolaFollowUp', () => {
  const baseInput = {
    name: 'Jane Smith',
    issueType: 'Employment',
    urgency: 'normal',
    riskScore: 20,
  };

  it('returns urgent tone and 1-hour nextStep for ESCALATE decision', () => {
    const result = lolaFollowUp({ ...baseInput, decision: 'ESCALATE', riskScore: 85 });
    expect(result.tone).toBe('urgent');
    expect(result.nextStep).toMatch(/1 hour/i);
    expect(result.message).toMatch(/Jane/);
    expect(result.message).toMatch(/85\/100/);
  });

  it('returns reassuring tone and 24-hour nextStep for MODIFY decision', () => {
    const result = lolaFollowUp({ ...baseInput, decision: 'MODIFY', riskScore: 60 });
    expect(result.tone).toBe('reassuring');
    expect(result.nextStep).toMatch(/24 hours/i);
    expect(result.message).toMatch(/Jane/);
    expect(result.message).toMatch(/60\/100/);
  });

  it('returns rejection tone and resubmission nextStep for DENY decision', () => {
    const result = lolaFollowUp({ ...baseInput, decision: 'DENY' });
    expect(result.tone).toBe('rejection');
    expect(result.nextStep).toMatch(/resubmission/i);
    expect(result.message).toMatch(/Jane/);
  });

  it('returns standard tone and automated nextStep for ALLOW decision', () => {
    const result = lolaFollowUp({ ...baseInput, decision: 'ALLOW', riskScore: 20 });
    expect(result.tone).toBe('standard');
    expect(result.nextStep).toMatch(/15 minutes/i);
    expect(result.message).toMatch(/Jane/);
    expect(result.message).toMatch(/20\/100/);
  });

  it('uses only the first name from a full name', () => {
    const result = lolaFollowUp({ ...baseInput, name: 'Robert Johnson', decision: 'ALLOW' });
    expect(result.message).toMatch(/Hi Robert/);
    expect(result.message).not.toMatch(/Johnson/);
  });
});

// ─── VaultLine Audit Engine ───────────────────────────────────────────────────

describe('VaultLine Audit Engine', () => {
  describe('createVaultHash', () => {
    it('returns a 64-character hex string (SHA-256)', () => {
      const hash = createVaultHash({ foo: 'bar' });
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('is deterministic — same input always produces the same hash', () => {
      const payload = { intakeId: 'abc-123', eventType: 'INTAKE_CREATED', data: 42 };
      expect(createVaultHash(payload)).toBe(createVaultHash(payload));
    });

    it('produces different hashes for different payloads', () => {
      expect(createVaultHash({ a: 1 })).not.toBe(createVaultHash({ a: 2 }));
    });
  });

  describe('buildVaultEvent', () => {
    it('returns a VaultEvent with all required fields', () => {
      const event = buildVaultEvent('intake-1', 'INTAKE_CREATED', { name: 'Alice' });
      expect(event.intakeId).toBe('intake-1');
      expect(event.eventType).toBe('INTAKE_CREATED');
      expect(event.payload).toEqual({ name: 'Alice' });
      expect(typeof event.hash).toBe('string');
      expect(event.hash).toHaveLength(64);
      expect(typeof event.createdAt).toBe('string');
    });

    it('produces an event that passes verifyVaultEvent', () => {
      const event = buildVaultEvent('intake-2', 'DECISION_ALLOW', { score: 20 });
      expect(verifyVaultEvent(event)).toBe(true);
    });
  });

  describe('verifyVaultEvent', () => {
    it('returns true for an unmodified event', () => {
      const event = buildVaultEvent('intake-3', 'DECISION_ESCALATE', { riskScore: 85 });
      expect(verifyVaultEvent(event)).toBe(true);
    });

    it('returns false when the payload has been tampered with', () => {
      const event = buildVaultEvent('intake-4', 'DECISION_DENY', { reason: 'too short' });
      const tampered = { ...event, payload: { reason: 'modified' } };
      expect(verifyVaultEvent(tampered)).toBe(false);
    });

    it('returns false when the hash itself has been modified', () => {
      const event = buildVaultEvent('intake-5', 'INTAKE_CREATED', { name: 'Bob' });
      const tampered = { ...event, hash: 'a'.repeat(64) };
      expect(verifyVaultEvent(tampered)).toBe(false);
    });

    it('returns false when the intakeId has been altered', () => {
      const event = buildVaultEvent('intake-6', 'INTAKE_CREATED', { name: 'Carol' });
      const tampered = { ...event, intakeId: 'intake-999' };
      expect(verifyVaultEvent(tampered)).toBe(false);
    });
  });
});
