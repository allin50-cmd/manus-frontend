# UltraCore Ops

Mobile-first business operating system for work items, actions, decisions, templates and activity logs.

## Current architecture

```text
UltraCore Ops app = operator interface
Supabase Postgres = database and source of truth
Prisma = existing database client
Vercel = app hosting
```

No Google Sheets. No Neon. No AI. No unnecessary complexity.

## Deploy to Vercel + Supabase

### 1. Create Supabase project

Go to Supabase, create a project, then copy the Postgres connection string.

Use the pooled or direct database connection string provided by Supabase. The app expects it in `DATABASE_URL`.

### 2. Add environment variables to Vercel

In your Vercel project settings → Environment Variables, add:

```env
DATABASE_URL=postgresql://...your supabase postgres connection string...
APP_PASSCODE=your-secure-passcode
JWT_SECRET=your-32-char-random-secret
```

Generate `JWT_SECRET` with:

```bash
openssl rand -hex 32
```

### 3. Push schema and seed data

```bash
npx prisma validate
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Deploy to Vercel

Connect the GitHub repo in Vercel, or run:

```bash
vercel deploy
```

### 5. Check database health

After deployment, open:

```text
/api/health/db
```

Expected response:

```json
{ "ok": true }
```

If `DATABASE_URL` is missing or Supabase is unreachable, the endpoint returns a clear error.

### 6. Open on iPhone Safari

Navigate to your Vercel URL in Safari on iPhone.

### 7. Add to Home Screen

Tap **Share → Add to Home Screen** to install as a PWA.

---

## Local development

```bash
cp .env.example .env
# Fill in DATABASE_URL, APP_PASSCODE, JWT_SECRET

npm install
npx prisma validate
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Check the database connection locally:

```text
http://localhost:3000/api/health/db
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed work items and templates |
| `npm run prisma:generate` | Regenerate Prisma client |

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- Supabase Postgres
- Vercel hosting
- PWA installable on iPhone
- Simple passcode login
