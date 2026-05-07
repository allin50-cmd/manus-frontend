import { Router } from 'express';
import { db } from '../db/index.js';
import { barristers, briefs, clerkNotes } from '../db/schema.js';
import { eq, desc, gte, and, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

const router = Router();

// GET /stats — dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [totalBarristersRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(barristers);

    const [activeBarristersRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(barristers)
      .where(eq(barristers.status, 'active'));

    const [totalBriefsRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(briefs);

    const [upcomingHearingsRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(briefs)
      .where(sql`hearing_date >= NOW() AND hearing_date <= NOW() + INTERVAL '7 days'`);

    const [outstandingFeesRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(briefs)
      .where(sql`fee_status IN ('awaiting_negotiation', 'under_negotiation')`);

    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json({
      totalBarristers: Number(totalBarristersRow.count),
      activeBarristers: Number(activeBarristersRow.count),
      totalBriefs: Number(totalBriefsRow.count),
      upcomingHearings: Number(upcomingHearingsRow.count),
      outstandingFees: Number(outstandingFeesRow.count),
    });
  } catch (error) {
    console.error('Error fetching clerk stats:', error);
    res.status(500).json({ error: 'Failed to fetch clerk stats' });
  }
});

// GET /diary — upcoming hearings sorted by date
router.get('/diary', async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: briefs.id,
        briefRef: briefs.briefRef,
        clientName: briefs.clientName,
        matterType: briefs.matterType,
        courtName: briefs.courtName,
        hearingDate: briefs.hearingDate,
        status: briefs.status,
        barristerId: briefs.barristerId,
        barristerName: barristers.fullName,
      })
      .from(briefs)
      .leftJoin(barristers, eq(briefs.barristerId, barristers.id))
      .where(sql`${briefs.hearingDate} >= NOW()`)
      .orderBy(briefs.hearingDate);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching clerk diary:', error);
    res.status(500).json({ error: 'Failed to fetch diary' });
  }
});

// POST /barristers — create a barrister
router.post('/barristers', async (req: Request, res: Response) => {
  try {
    const chamberRef = `CHAM-${Date.now()}`;
    const [barrister] = await db
      .insert(barristers)
      .values({ ...req.body, chamberRef })
      .returning();

    res.status(201).json(barrister);
  } catch (error) {
    console.error('Error creating barrister:', error);
    res.status(500).json({ error: 'Failed to create barrister' });
  }
});

// GET /barristers — list all barristers ordered by fullName
router.get('/barristers', async (req: Request, res: Response) => {
  try {
    const all = await db
      .select()
      .from(barristers)
      .orderBy(barristers.fullName);

    res.json(all);
  } catch (error) {
    console.error('Error fetching barristers:', error);
    res.status(500).json({ error: 'Failed to fetch barristers' });
  }
});

// GET /barristers/:id — get one barrister
router.get('/barristers/:id', async (req: Request, res: Response) => {
  try {
    const [barrister] = await db
      .select()
      .from(barristers)
      .where(eq(barristers.id, req.params.id));

    if (!barrister) {
      return res.status(404).json({ error: 'Barrister not found' });
    }

    res.json(barrister);
  } catch (error) {
    console.error('Error fetching barrister:', error);
    res.status(500).json({ error: 'Failed to fetch barrister' });
  }
});

// PUT /barristers/:id — update a barrister
router.put('/barristers/:id', async (req: Request, res: Response) => {
  try {
    const { status, specialisms, phone, email } = req.body;
    const patch: Record<string, unknown> = {};
    if (status !== undefined) patch.status = status;
    if (specialisms !== undefined) patch.specialisms = specialisms;
    if (phone !== undefined) patch.phone = phone;
    if (email !== undefined) patch.email = email;

    const [updated] = await db
      .update(barristers)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(patch as any)
      .where(eq(barristers.id, req.params.id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Barrister not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating barrister:', error);
    res.status(500).json({ error: 'Failed to update barrister' });
  }
});

// POST /briefs — create a brief
router.post('/briefs', async (req: Request, res: Response) => {
  try {
    const briefRef = `BRIEF-${Date.now()}`;
    const { hearingDate, barristerId, ...rest } = req.body;

    const [brief] = await db
      .insert(briefs)
      .values({
        ...rest,
        briefRef,
        hearingDate: hearingDate ? new Date(hearingDate) : null,
        barristerId: barristerId || null,
      })
      .returning();

    res.status(201).json(brief);
  } catch (error) {
    console.error('Error creating brief:', error);
    res.status(500).json({ error: 'Failed to create brief' });
  }
});

// GET /briefs — list all briefs with barrister name
router.get('/briefs', async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: briefs.id,
        briefRef: briefs.briefRef,
        clientName: briefs.clientName,
        matterType: briefs.matterType,
        courtName: briefs.courtName,
        hearingDate: briefs.hearingDate,
        status: briefs.status,
        feeStatus: briefs.feeStatus,
        feeAgreed: briefs.feeAgreed,
        notes: briefs.notes,
        barristerId: briefs.barristerId,
        barristerName: barristers.fullName,
        createdAt: briefs.createdAt,
      })
      .from(briefs)
      .leftJoin(barristers, eq(briefs.barristerId, barristers.id))
      .orderBy(desc(briefs.createdAt));

    res.json(rows);
  } catch (error) {
    console.error('Error fetching briefs:', error);
    res.status(500).json({ error: 'Failed to fetch briefs' });
  }
});

// GET /briefs/:id — get one brief
router.get('/briefs/:id', async (req: Request, res: Response) => {
  try {
    const [brief] = await db
      .select()
      .from(briefs)
      .where(eq(briefs.id, req.params.id));

    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    res.json(brief);
  } catch (error) {
    console.error('Error fetching brief:', error);
    res.status(500).json({ error: 'Failed to fetch brief' });
  }
});

// PUT /briefs/:id — update a brief
router.put('/briefs/:id', async (req: Request, res: Response) => {
  try {
    const { status, feeStatus, feeAgreed, notes, hearingDate } = req.body;
    const patch: Record<string, unknown> = {};
    if (status !== undefined) patch.status = status;
    if (feeStatus !== undefined) patch.feeStatus = feeStatus;
    if (feeAgreed !== undefined) patch.feeAgreed = feeAgreed;
    if (notes !== undefined) patch.notes = notes;
    if (hearingDate !== undefined) patch.hearingDate = hearingDate ? new Date(hearingDate) : null;

    const [updated] = await db
      .update(briefs)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(patch as any)
      .where(eq(briefs.id, req.params.id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating brief:', error);
    res.status(500).json({ error: 'Failed to update brief' });
  }
});

// POST /notes — create a clerk note
router.post('/notes', async (req: Request, res: Response) => {
  try {
    const noteRef = `NOTE-${Date.now()}`;
    const { briefId, barristerId, ...rest } = req.body;

    const [note] = await db
      .insert(clerkNotes)
      .values({
        ...rest,
        noteRef,
        briefId: briefId || null,
        barristerId: barristerId || null,
      })
      .returning();

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating clerk note:', error);
    res.status(500).json({ error: 'Failed to create clerk note' });
  }
});

// GET /notes — list notes, optionally filtered by briefId or barristerId
router.get('/notes', async (req: Request, res: Response) => {
  try {
    const { briefId, barristerId } = req.query;

    let query = db.select().from(clerkNotes).$dynamic();

    if (briefId) {
      query = query.where(eq(clerkNotes.briefId, briefId as string));
    } else if (barristerId) {
      query = query.where(eq(clerkNotes.barristerId, barristerId as string));
    }

    const notes = await query.orderBy(desc(clerkNotes.createdAt));

    res.json(notes);
  } catch (error) {
    console.error('Error fetching clerk notes:', error);
    res.status(500).json({ error: 'Failed to fetch clerk notes' });
  }
});

// GET /barristers/:id/briefs — get all briefs for a specific barrister
router.get('/barristers/:id/briefs', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(briefs)
      .where(eq(briefs.barristerId, req.params.id))
      .orderBy(desc(briefs.createdAt));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching barrister briefs:', error);
    res.status(500).json({ error: 'Failed to fetch barrister briefs' });
  }
});

export default router;
