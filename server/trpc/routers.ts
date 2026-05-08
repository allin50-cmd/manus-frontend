import { router } from './_core/trpc';
import { allocationsRouter } from './routers/allocations';
import { authRouter } from './routers/auth';
import { casesRouter } from './routers/cases';
import { dashboardRouter } from './routers/dashboard';
import { diaryRouter } from './routers/diary';
import { documentsRouter } from './routers/documents';
import { hearingsRouter } from './routers/hearings';
import { lunarRouter } from './routers/lunar';

export const appRouter = router({
  auth: authRouter,
  cases: casesRouter,
  hearings: hearingsRouter,
  documents: documentsRouter,
  allocations: allocationsRouter,
  diary: diaryRouter,
  dashboard: dashboardRouter,
  lunar: lunarRouter,
});

export type AppRouter = typeof appRouter;
