# thefineguard.com Frontend

`thefineguard.com` and `www.thefineguard.com` are intended to serve the FineGuard public frontend from the same Vercel project as the main ClerkOS app.

## Runtime Behavior

- `manus-frontend-zeta.vercel.app` keeps `/` as the ClerkOS operational dashboard.
- `thefineguard.com` serves `/` as the FineGuard landing/check frontend.
- `/app` remains available as a dashboard route when reached from the FineGuard domain.
- `/compliance-bundle`, `/book-demo`, and `/pricing` are shared conversion routes.

## Domain Setup

Attach both domains to the Vercel project:

```bash
vercel domains add thefineguard.com manus-frontend --scope georges-projects-d3e17648
vercel domains add www.thefineguard.com manus-frontend --scope georges-projects-d3e17648
```

Then verify DNS in Vercel. The apex should point only at Vercel's required A record, and `www` should use Vercel's required CNAME or A record.
