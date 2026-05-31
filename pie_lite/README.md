## PIE Lite — Push Workflow

The Kanban dashboard is served by Vercel at `/pie`. To ingest new leads:

```
PIE_API_URL=https://your-app.vercel.app ADMIN_API_KEY=secret \
  python -m pie_lite.pipeline push
```
