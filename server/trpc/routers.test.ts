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
});
