import { router } from './_core/trpc.js';
import { allocationsRouter } from './routers/allocations.js';
import { authRouter } from './routers/auth.js';
import { casesRouter } from './routers/cases.js';
import { dashboardRouter } from './routers/dashboard.js';
import { diaryRouter } from './routers/diary.js';
import { documentsRouter } from './routers/documents.js';
import { hearingsRouter } from './routers/hearings.js';

export const appRouter = router({
  auth: authRouter,
  cases: casesRouter,
  hearings: hearingsRouter,
  documents: documentsRouter,
  allocations: allocationsRouter,
  diary: diaryRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
