import { authedProcedure, router } from '../_core/trpc';

export const authRouter = router({
  me: authedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  logout: authedProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('session');
    return { success: true as const };
  }),
});
