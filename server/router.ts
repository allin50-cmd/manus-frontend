import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  auth: t.router({
    me: t.procedure.query(async () => {
      return null;
    }),
  }),
  monitorFunnel: t.router({
    track: t.procedure
      .input(z.object({
        eventType: z.string(),
        companyNumber: z.string(),
        companyName: z.string(),
      }))
      .mutation(async ({ input }) => {
        console.log('Funnel event:', input);
        return { success: true };
      }),
  }),
  monitored: t.router({
    add: t.procedure
      .input(z.object({ companyNumber: z.string() }))
      .mutation(async ({ input }) => {
        return { id: input.companyNumber, name: 'Company' };
      }),
  }),
});

export type AppRouter = typeof appRouter;
