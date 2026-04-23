import { authedProcedure, router } from '../_core/trpc';
import { getAllCases, getAllHearings, getPendingAllocations } from '../db';

export const dashboardRouter = router({
  stats: authedProcedure.query(async () => {
    const [allCases, allHearings, pendingAllocs] = await Promise.all([
      getAllCases(),
      getAllHearings(),
      getPendingAllocations(),
    ]);

    const today = new Date().toISOString().split('T')[0];

    return {
      totalCases: allCases.length,
      activeCases: allCases.filter(
        (c) => c.status === 'open' || c.status === 'in_progress',
      ).length,
      closedCases: allCases.filter((c) => c.status === 'closed').length,
      pendingHearings: allHearings.filter((h) => h.status === 'scheduled').length,
      todayHearings: allHearings.filter((h) => h.hearingDate === today).length,
      pendingAllocations: pendingAllocs.length,
      recentCases: allCases.slice(0, 5),
      upcomingHearings: allHearings
        .filter((h) => h.status === 'scheduled' && h.hearingDate >= today)
        .sort((a, b) => a.hearingDate.localeCompare(b.hearingDate))
        .slice(0, 5),
    };
  }),
});
