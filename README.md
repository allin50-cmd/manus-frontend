# UltraCore Ops

Business command hub — create, track, and audit companies, contacts, work items, decisions, and compliance alerts. Runs on Vercel + Supabase PostgreSQL.

---

## Deploy to Vercel + Supabase

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project (free tier is fine). Note the **project ref** (e.g. `abcdefghijklm`).

### 2. Connect repo to Vercel

Import this repo at [vercel.com/new](https://vercel.com/new). Framework preset: **Next.js**.

### 3. Add environment variables in Vercel

**Vercel → Project → Settings → Environment Variables**

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection String → **Transaction** (port 6543) — append `?pgbouncer=true` |
| `DIRECT_URL` | Same page → **Session** (port 5432) — used only for schema pushes, not needed at runtime |
| `JWT_SECRET` | Run `openssl rand -hex 32` locally |
| `DEFAULT_PASSCODE` | Choose any shared password for your team |
| `NEXT_PUBLIC_APP_URL` | Your Vercel domain e.g. `https://your-project.vercel.app` |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → service_role key (keep secret) |
| `RESEND_API_KEY` | *(optional)* Resend key — enables real email delivery |
| `RESEND_FROM_EMAIL` | *(optional)* Verified sender e.g. `alerts@yourdomain.com` |
| `OPENAI_API_KEY` | *(optional)* Enables voice intake transcription |
| `CRON_SECRET` | *(optional)* Bearer token to protect `/api/alert-escalation-check` |

`DEFAULT_PASSCODE` is the shared password used until staff set their own via **Settings**.

### 4. Deploy

Click **Deploy**. Vercel runs `npm ci && npx prisma generate && npm run build` automatically.

### 5. Create database tables

Run this **once** from your local machine after setting up Supabase:

```bash
DIRECT_URL="<supabase session connection string>" \
DATABASE_URL="<supabase transaction connection string>?pgbouncer=true" \
npx prisma db push
```

### 6. Seed demo data (optional)

```bash
DATABASE_URL="<supabase transaction connection string>?pgbouncer=true" \
npm run db:seed
```

### 7. Open on iPhone

Navigate to your Vercel URL in Safari → tap **Share → Add to Home Screen** to install as a PWA.

---

## Local development

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, DIRECT_URL, JWT_SECRET, DEFAULT_PASSCODE
# (Can point at Supabase or a local Postgres instance)

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run type-check` | TypeScript check |
| `npm test` | Run unit tests (vitest) |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed demo companies, contacts, work items, templates |
| `npm run prisma:generate` | Regenerate Prisma client |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Database | Supabase PostgreSQL via Prisma ORM |
| Auth | httpOnly JWT cookie, passcode-based — no external auth provider |
| Styling | Tailwind CSS |
| Email | Resend (optional) |
| Voice | OpenAI Whisper — transcription only, one input method |
| Deploy | Vercel (serverless) |
