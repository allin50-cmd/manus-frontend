import { authedProcedure, router, tenantProcedure } from '../_core/trpc.js';

export const authRouter = router({
  /** Returns the authenticated user from context. */
  me: authedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  /** Returns the resolved tenant for the current request. */
  tenant: tenantProcedure.query(({ ctx }) => {
    return ctx.tenant;
  }),

  /** Clears the session cookie and returns success. */
  logout: authedProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('session');
    return { success: true as const };
  }),
});
