# Platform Decisions (ADR)

This file logs important architectural decisions.

## ADR-001: Use Next.js for frontend
- **Date:** 2026-01-15
- **Context:** Need SSR and static site generation.
- **Decision:** Adopt Next.js App Router.
- **Consequences:** Must handle client/server env separation carefully.

## ADR-002: Auth with NextAuth.js
- **Date:** 2026-02-01
- **Context:** Need OAuth and session management.
- **Decision:** Use NextAuth.js with JWT.
- **Consequences:** Use `NEXT_PUBLIC_DISABLE_AUTH` for local bypass.

(Add more decisions as they arise.)
