import { initTRPC, TRPCError } from '@trpc/server';
import type { TrpcContext } from './context';

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const middleware = t.middleware;

// ─── Public (no auth) ────────────────────────────────────────────────────────

export const publicProcedure = t.procedure;

// ─── Authenticated (user required) ───────────────────────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const authedProcedure = t.procedure.use(isAuthed);

// ─── Tenant-scoped (user + tenant required) ───────────────────────────────────

const isTenanted = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  if (!ctx.tenantId || !ctx.tenant) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Tenant context not resolved. Ensure correct subdomain or x-tenant header.',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      tenantId: ctx.tenantId,
      tenant: ctx.tenant,
    },
  });
});

export const tenantProcedure = t.procedure.use(isTenanted);

// ─── Admin (senior clerk / manager) within a tenant ──────────────────────────

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  if (!ctx.tenantId || !ctx.tenant) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Tenant context not resolved.' });
  }
  if (ctx.user.role !== 'admin (senior clerk / manager)') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required.' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      tenantId: ctx.tenantId,
      tenant: ctx.tenant,
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);
