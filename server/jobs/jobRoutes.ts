import { Router } from 'express';
import { getJob } from './jobStore.js';

const router = Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const job = await getJob(id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(job);
});

export default router;
