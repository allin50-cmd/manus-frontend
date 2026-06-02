# UltraCore SheetOps

Spreadsheets that do the work, not just store the work.

## Deploy to Vercel + Neon

### 1. Create Neon database

Go to [neon.tech](https://neon.tech), create a project, and copy the connection string.

### 2. Add environment variables to Vercel

In your Vercel project settings → Environment Variables, add:

```
DATABASE_URL=postgresql://...your neon connection string...
APP_PASSCODE=your-secure-passcode
JWT_SECRET=your-32-char-random-secret
```

Generate `JWT_SECRET` with: `openssl rand -hex 32`

### 3. Push schema and seed data

```bash
npx prisma db push
npm run db:seed
```

### 4. Deploy to Vercel

Connect your GitHub repo in the Vercel dashboard, or run `vercel deploy`.

### 5. Open on iPhone Safari

Navigate to your Vercel URL in Safari on iPhone.

### 6. Add to Home Screen

Tap **Share → Add to Home Screen** to install as a PWA.

---

## Local development

```bash
cp .env.example .env
# Fill in DATABASE_URL, APP_PASSCODE, JWT_SECRET

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

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
- Neon Postgres
- PWA (installable on iPhone)
- Simple passcode login
