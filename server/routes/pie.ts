import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import { pieLeads } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  inferBuildType,
  extractFloorArea,
  calculateOpportunityScore,
  calculateEstimatedValue,
} from '../pie/scoring';

const router = Router();

const ADMIN_KEY = process.env.ADMIN_API_KEY;

const CRM_STAGES = ['New', 'Contacted', 'Site Visit', 'Quoted', 'Won', 'Lost'] as const;
type CrmStage = (typeof CRM_STAGES)[number];

function requireAuth(req: Request, res: Response): boolean {
  if (!ADMIN_KEY) return true;
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// POST /ingest — bulk ingest leads from Python pipeline
router.post('/ingest', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const items = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Body must be an array of lead objects' });
  }

  let ingested = 0;
  let skipped = 0;

  for (const item of items) {
    const { ref, address, description = '', source = '', date_scraped } = item as Record<string, string>;
    if (!ref || !address || !date_scraped) {
      skipped++;
      continue;
    }

    const buildType = inferBuildType(description);
    const { area, source: areaSource, confidence: areaConf } = extractFloorArea(description, buildType);
    const opportunityScore = calculateOpportunityScore(buildType, area);
    const estimatedBuildValue = calculateEstimatedValue(buildType, area);

    try {
      const result = await db
        .insert(pieLeads)
        .values({
          ref,
          address,
          description,
          source,
          dateScraped: date_scraped,
          inferredBuildType: buildType,
          inferredFloorAreaM2: String(area),
          estimateConfidence: 'low',
          rateSource: 'placeholder',
          rateValidationStatus: 'PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION',
          floorAreaSource: areaSource,
          floorAreaConfidence: areaConf,
          opportunityScore,
          estimatedBuildValue: String(estimatedBuildValue),
          crmStage: 'New',
        })
        .onConflictDoNothing()
        .returning();

      if (result.length > 0) {
        ingested++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error('[pie] ingest error for ref', ref, err);
      skipped++;
    }
  }

  res.json({ ingested, skipped });
});

// GET /leads — list all leads, optional ?stage= filter
router.get('/leads', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const stage = req.query['stage'] as string | undefined;
    let query = db.select().from(pieLeads);
    if (stage) {
      query = query.where(eq(pieLeads.crmStage, stage)) as typeof query;
    }
    const rows = await query.orderBy(desc(pieLeads.createdAt));
    res.json(rows);
  } catch (err) {
    console.error('[pie] list leads error:', err);
    res.status(500).json({ error: 'Failed to list leads' });
  }
});

// POST /leads/:ref/move — update CRM stage
router.post('/leads/:ref/move', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { ref } = req.params;
  const { stage } = req.body as { stage?: string };

  if (!stage || !(CRM_STAGES as readonly string[]).includes(stage)) {
    return res.status(400).json({
      error: `stage must be one of: ${CRM_STAGES.join(', ')}`,
    });
  }

  try {
    const [row] = await db
      .update(pieLeads)
      .set({ crmStage: stage as CrmStage, lastUpdated: new Date() })
      .where(eq(pieLeads.ref, ref))
      .returning();
    if (!row) return res.status(404).json({ error: 'Lead not found' });
    res.json(row);
  } catch (err) {
    console.error('[pie] move lead error:', err);
    res.status(500).json({ error: 'Failed to update lead stage' });
  }
});

// DELETE /leads/:ref — hard delete
router.delete('/leads/:ref', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { ref } = req.params;
  try {
    const [row] = await db
      .delete(pieLeads)
      .where(eq(pieLeads.ref, ref))
      .returning();
    if (!row) return res.status(404).json({ error: 'Lead not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[pie] delete lead error:', err);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
