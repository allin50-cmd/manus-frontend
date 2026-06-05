# UltraCore SheetOps

Spreadsheets that do the work, not just store the work.

## Deploy to Vercel + Neon

### 1. Create Neon database

Go to [neon.tech](https://neon.tech), create a project, copy the **connection string** (pooled) from the dashboard.

### 2. Connect repo to Vercel

Import the GitHub repo at [vercel.com/new](https://vercel.com/new). Framework preset will be detected as **Next.js**.

### 3. Add environment variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon pooled connection string |
| `JWT_SECRET` | Output of `openssl rand -hex 32` |
| `DEFAULT_PASSCODE` | Shared starting password for all staff |
| `NEXT_PUBLIC_APP_URL` | Your Vercel domain e.g. `https://sheetops.vercel.app` |
| `RESEND_API_KEY` | *(optional)* Resend key for email alerts |
| `RESEND_FROM_EMAIL` | *(optional)* e.g. `alerts@yourdomain.com` |

`DEFAULT_PASSCODE` is the password every person uses until they set their own via **Settings**.

### 4. Deploy

Click **Deploy**. Vercel runs `npm ci && prisma generate && npm run build` automatically.

### 5. Push schema to Neon

After the first deploy, run once from your local machine:

```bash
DATABASE_URL="<your neon connection string>" npx prisma db push
DATABASE_URL="<your neon connection string>" npm run db:seed
```

This creates all tables and seeds initial work items + templates.

### 6. Open on iPhone

Navigate to your Vercel URL in Safari → tap **Share → Add to Home Screen** to install as a PWA.

---

## Local development

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, JWT_SECRET, DEFAULT_PASSCODE

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Login password is whatever you set as `DEFAULT_PASSCODE`. Staff can change their own password at **Settings**.

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run type-check` | TypeScript check |
| `npm test` | Run unit tests |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed work items and templates |
| `npm run prisma:generate` | Regenerate Prisma client |

## Stack

- Next.js 14 App Router
- TypeScript + Tailwind CSS
- Prisma ORM + Neon Postgres
- `jose` JWT auth — httpOnly cookie sessions
- Scrypt password hashing (Node.js built-in, no extra deps)
- PWA — installable on iPhone via Safari
