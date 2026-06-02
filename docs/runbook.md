# UltraCore SheetOps — Runbook

**Version:** MVP  
**Audience:** Operator with light technical help available  
**Related:** [docs/operator-test.md](operator-test.md)

---

## 1. Purpose

This runbook explains how to set up UltraCore SheetOps MVP, load test data, run it locally, and deploy it to Vercel with a Neon database. Follow it before running the operator test described in `docs/operator-test.md`.

---

## 2. Required Tools

You need these before you start.

| Tool | What it is | Where to get it |
|------|-----------|-----------------|
| Node.js (v18 or later) | Runs the app locally | nodejs.org |
| npm | Installs packages — comes with Node.js | Included with Node.js |
| Git | Downloads the project code | git-scm.com |
| Neon account | Hosts the PostgreSQL database | neon.tech (free tier works) |
| Vercel account | Hosts the app | vercel.com (free tier works) |
| Project repo access | The GitHub repository | Ask the team for access |

---

## 3. Environment Variables

The app needs three environment variables. These must be set before it will run.

### `DATABASE_URL`
The connection address for your PostgreSQL database. Neon provides this when you create a project. It looks like:
```
postgresql://username:password@hostname/database?sslmode=require
```
Without this, the app cannot read or write any data.

### `APP_PASSCODE`
The passcode operators type on the login screen. Choose any string. Example: `demo1234`. Keep it simple for testing; use something stronger for real use.

### `JWT_SECRET`
A secret string used to sign login tokens. The app uses this to confirm that a logged-in session is genuine. Generate one with:
```bash
openssl rand -hex 32
```
If this is missing or changes, all existing login sessions are invalidated.

---

## 4. Local Setup

### Step 1 — Clone the repository
```bash
git clone <repo-url>
cd manus-frontend
```

### Step 2 — Create your local environment file
Create a file called `.env.local` in the project root. It is not committed to Git.
```
DATABASE_URL="postgresql://your-neon-connection-string"
APP_PASSCODE="demo1234"
JWT_SECRET="paste-your-generated-secret-here"
```

> **All database commands require `DATABASE_URL` to be set.** If you see a connection error, check this first.

### Step 3 — Install packages
```bash
npm install
```
This also runs `prisma generate` automatically via the `postinstall` script.

### Step 4 — Validate the schema
```bash
npx prisma validate
```
If this prints errors, the schema file is inconsistent. Stop and ask for help.

### Step 5 — Push the schema to the database
```bash
npm run db:push
```
This creates the tables in your database. Safe to run multiple times — it will not delete existing data unless the schema has destructive changes, in which case Prisma will warn you first.

### Step 6 — Seed test data
```bash
npm run db:seed
```
This loads six work items and nine message templates.

### Step 7 — Start the app
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Log in with the `APP_PASSCODE` you set.

---

## 5. Verify Seeded Data

After running the seed, open [http://localhost:3000/work-items](http://localhost:3000/work-items). You should see these six records:

1. EasyEstimate partnership target
2. Price A Job partnership target
3. HBXL benchmark trial
4. Local builder test
5. Accuracy Havelock Walk quote
6. FineGuard alert workflow

> **Note:** The operator test in `docs/operator-test.md` references five records. It omits "Local builder test". That record is in the seed and will appear in the list — it does not break anything. For the formal operator test, use the five records named in that document and ignore "Local builder test" unless you decide to include it later.

If any records are missing, run the seed again. If they still do not appear, check that `DATABASE_URL` points to the correct database.

---

## 6. Local Test Checklist

Run through these quickly before handing the app to operators. Each should take under a minute.

| Check | How to verify | Pass? |
|-------|--------------|-------|
| Login works | Go to `/login`, enter passcode, land on Dashboard | |
| Dashboard loads | Stat cards and buttons appear | |
| Work items show | `/work-items` lists the six seeded records | |
| Create work item | Click `+ Add`, fill in title, submit, redirect to detail page | |
| Create follow-up action | Open a work item, click "Create Follow-Up", fill in label, submit | |
| Mark action done | Open work item, click "✓ Done" on an open action, action disappears | |
| Escalate to George | Click "Escalate to George", submit a question, work item status becomes Escalated | |
| Resolve decision | Go to `/decisions`, approve or reject, work item returns to In Progress | |
| Today's Actions updates | Open `/today`, create a follow-up due today, confirm it appears | |
| Activity Log links | Open `/activity`, click "Open work item →" on any entry | |
| Templates prefill form | Go to `/templates`, click "Use template →", confirm form is prefilled | |

---

## 7. Vercel + Neon Deployment

### Step 1 — Create a Neon database
1. Sign in to [neon.tech](https://neon.tech).
2. Create a new project. Call it `sheetops` or anything you like.
3. Copy the connection string from the dashboard. It will look like the `DATABASE_URL` example above.

### Step 2 — Connect Vercel to the repository
1. Sign in to [vercel.com](https://vercel.com).
2. Click **Add New Project** and import the GitHub repository.
3. Vercel will detect it as a Next.js project automatically.

### Step 3 — Add environment variables in Vercel
In the Vercel project settings, go to **Environment Variables** and add:

```
DATABASE_URL     = <your Neon connection string>
APP_PASSCODE     = <your chosen passcode>
JWT_SECRET       = <your generated secret>
```

Add all three to the **Production**, **Preview**, and **Development** environments.

### Step 4 — Deploy
Click **Deploy** in Vercel. The build takes about a minute. A successful build shows 17 routes compiled with no errors.

### Step 5 — Push schema and seed data to production
Run these from your local machine, pointing at the production `DATABASE_URL`:

```bash
DATABASE_URL="your-neon-production-connection-string" npx prisma db push
DATABASE_URL="your-neon-production-connection-string" npm run db:seed
```

Or set `DATABASE_URL` in your shell temporarily:
```bash
export DATABASE_URL="your-neon-production-connection-string"
npm run db:push
npm run db:seed
unset DATABASE_URL
```

> Run the seed only once on the production database. Running it a second time will create duplicate records.

### Step 6 — Open and test
Visit your Vercel URL (e.g. `https://your-project.vercel.app`). Log in with your `APP_PASSCODE`. Run through the local test checklist in section 6 to confirm everything works.

---

## 8. iPhone Install Steps

UltraCore SheetOps is designed to be installed on an iPhone and used like a native app.

1. Open your Vercel URL in **Safari** on the iPhone. Do not use Chrome — Add to Home Screen only works in Safari.
2. Tap the **Share** button (the box with an arrow pointing up, at the bottom of the screen).
3. Scroll down and tap **Add to Home Screen**.
4. Name it **UltraCore SheetOps** or **Dagon CRM** — whichever makes sense on that person's phone.
5. Tap **Add**.
6. Find the icon on the Home Screen and open it. It will open full screen without the Safari address bar.

Log in once and the session stays active. If it asks for a passcode again, the JWT session expired (default is 7 days).

---

## 9. Troubleshooting

### "Error: Environment variable not found: DATABASE_URL"
The app cannot connect to the database. Check that `.env.local` exists and contains a valid `DATABASE_URL`. Restart the dev server after editing `.env.local`.

### "PrismaClientInitializationError" or "Prisma Client is not generated"
Run `npx prisma generate` manually, then restart the server.

### Login screen rejects the passcode
Check that `APP_PASSCODE` in `.env.local` (or Vercel environment variables) matches exactly what you are typing. It is case-sensitive.

### Login succeeds but the session drops immediately
`JWT_SECRET` may be missing or empty. Every time `JWT_SECRET` changes, existing sessions are invalidated. Set it and restart the server.

### Seed ran but work items do not appear
Check that `DATABASE_URL` points to the same database the app is reading from. It is easy to seed one Neon branch but run the app against another.

### Vercel build passes but `/dashboard` or `/work-items` shows an error
The app built successfully but cannot reach the database at runtime. Confirm all three environment variables are set in the Vercel project settings under **Production** — not just Preview. Redeploy after adding them.

### Duplicate records after seeding
The seed script does not check for existing data before inserting. If you run it twice, you will get duplicate work items. To reset: use the Neon dashboard to run `TRUNCATE "WorkItem", "Template", "ActivityLog", "Action", "Decision" CASCADE;` and then seed again.

### App works locally but not on Vercel
Double-check that the Neon connection string includes `?sslmode=require` at the end. Neon requires SSL; a connection string without it will be refused in production.

---

## 10. Operator Test

Once local setup and the local test checklist both pass, run the formal operator test:

→ [docs/operator-test.md](operator-test.md)

That document gives Dagon, Alissa, and George specific tasks to complete and a pass/fail checklist to record the outcome.
