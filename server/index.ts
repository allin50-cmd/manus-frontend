import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app';
import { runEscalationWorker } from './worker/escalationWorker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApp();
const PORT = process.env.PORT || 3000;

// Static files + SPA fallback (local/self-hosted only — Vercel serves dist/ natively)
import express from 'express';
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'test') {
    runEscalationWorker().catch(console.error);
  }
});
