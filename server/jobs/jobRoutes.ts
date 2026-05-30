import { Router } from 'express';

const router = Router();

// Stub job routes — extend when queue infra is wired
router.get('/status', (_req, res) => {
  res.json({ message: 'Job queue routes active' });
});

export default router;
