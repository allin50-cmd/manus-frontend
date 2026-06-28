# Deployment

## Current production

**Project:** `manus-frontend`
**URL:** `manus-frontend-zeta.vercel.app` (or custom domain)
**Branch:** `chore/drizzle-full-migration` → NOT YET PROMOTED TO MAIN

## Vercel projects inventory

| Project | Status | Notes |
|---|---|---|
| `manus-frontend` | KEEP — production target | Deploy canonical branch here |
| `agent-x` | KEEP — review | May be required |
| `ult-ai-lite` | KEEP — review | May be required |
| `manus-frontend-c9li` | REVIEW | Possibly safe to remove after promotion |
| `manus-frontend-edg7` | REVIEW | Possibly safe to remove after promotion |
| `manus-frontend-sheetops` | REVIEW | Based on sheetops branch |
| `manus-frontend-sheetops-iphone` | REVIEW | Based on sheetops branch |

**Rule:** No Vercel project is deleted until:
1. `chore/drizzle-full-migration` is promoted to `main`
2. Deployment is verified on `manus-frontend`
3. A rollback path exists

## Build command

```
npx prisma generate && npm run build
```

Do NOT add `prisma db push` to the build command. Schema migrations must be run as a separate step via `prisma migrate deploy`.

## Environment variables required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `OPENAI_API_KEY` | Whisper API for voice transcription |
| `SESSION_SECRET` | Cookie signing for auth |
| `CRON_SECRET` | Guard for scheduled cron endpoints |

## Deployment checklist (before promoting to main)

- [ ] `npm run type-check` passes locally
- [ ] `npm run build` passes locally
- [ ] `npm test` passes locally (130/130)
- [ ] Prisma schema is in sync with database (run `prisma migrate deploy` if needed)
- [ ] All environment variables are set in Vercel project
- [ ] `/api/debugdb` returns success on deployed URL
- [ ] Manual smoke test: login, create work item, view dashboard
