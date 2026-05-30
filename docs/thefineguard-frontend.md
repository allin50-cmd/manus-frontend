# thefineguard.com Frontend

`thefineguard.com` and `www.thefineguard.com` are intended to serve the FineGuard Service public frontend from the same Vercel project as the main operations app.

## Runtime Behavior

- `/` serves the FineGuard Service front door.
- `/clerkos` and `/app` serve ClerkOS, the operational control-surface service.
- `thefineguard.com` should serve the same FineGuard Service front door once the domain is attached to the project.
- `/compliance-bundle`, `/book-demo`, and `/pricing` are shared conversion routes.

## Domain Setup

Attach both domains to the Vercel project:

```bash
vercel domains add thefineguard.com manus-frontend --scope georges-projects-d3e17648
vercel domains add www.thefineguard.com manus-frontend --scope georges-projects-d3e17648
```

Then verify DNS in Vercel. The apex should point only at Vercel's required A record, and `www` should use Vercel's required CNAME or A record.
