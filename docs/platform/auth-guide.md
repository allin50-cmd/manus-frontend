# Auth / Env Key Learnings

- Client-side env vars must use `NEXT_PUBLIC_` prefix in Next.js
- `.env.local` is local-only; Vercel env vars go in dashboard
- To bypass auth in the browser, set `NEXT_PUBLIC_DISABLE_AUTH=true` on Vercel
- Server-side `DISABLE_AUTH` alone won't work for client-side checks
- Never delete auth code; only bypass it behind the flag
