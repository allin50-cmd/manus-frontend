// ============================================================================
// Admin API Routes
// Read-only endpoints for the admin dashboard.
// ============================================================================

import { Router, Request, Response } from 'express';
import { adminStore } from './store.js';

const router = Router();

// ─── GET /api/admin/leads ────────────────────────────────────────────────────

router.get('/leads', (_req: Request, res: Response) => {
  res.json(adminStore.getLeads());
});

// ─── GET /api/admin/intake-forms ─────────────────────────────────────────────

router.get('/intake-forms', (_req: Request, res: Response) => {
  res.json(adminStore.getIntakeForms());
});

// ─── GET /api/admin/compliance-bundles ───────────────────────────────────────

router.get('/compliance-bundles', (_req: Request, res: Response) => {
  res.json(adminStore.getComplianceBundles());
});

// ─── GET /api/admin/contacts ─────────────────────────────────────────────────

router.get('/contacts', (_req: Request, res: Response) => {
  res.json(adminStore.getContacts());
});

export default router;
