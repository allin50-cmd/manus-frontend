# Domain Reviewer Routing

Use the smallest relevant reviewer set for each change. These are development-time Claude Code reviewers only; they are not runtime/product agents and must not be imported into application code or make business/compliance decisions.

## Primary routing

- UI, App Router, React components, client/server boundaries, Tailwind: `nextjs-react-reviewer`
- Prisma queries, schema/data access, Supabase boundaries: `prisma-supabase-reviewer`
- Auth, middleware, cookies, secrets, API protection, passcodes: `auth-security-reviewer`
- Forms, keyboard behavior, labels, ARIA, focus, contrast: `web-accessibility-reviewer`
- Bug fixes, regression tests, Vitest, adversarial cases, CI reproduction: `test-regression-reviewer`
- WorkItems, filings, alerts, decisions, audit trails, escalation semantics: `compliance-domain-reviewer`

## Multi-review cases

Use more than one reviewer only when the change genuinely crosses boundaries. Examples:

- authenticated form: `nextjs-react-reviewer` + `auth-security-reviewer` + `web-accessibility-reviewer`
- Prisma-backed API change: `prisma-supabase-reviewer` + `auth-security-reviewer` + `test-regression-reviewer`
- compliance workflow mutation: `compliance-domain-reviewer` + `prisma-supabase-reviewer` + `test-regression-reviewer`

## Required final gates

Reviewer recommendations do not replace repository checks. Before merge, run the existing quality gate:

1. `npm run lint`
2. client TypeScript check
3. strict server TypeScript check
4. `npm test`
5. `npm run build`

## Guardrails

- Do not invoke every reviewer by default.
- Do not weaken lint, TypeScript, tests, auth, or CI to satisfy a reviewer.
- Do not introduce runtime agent frameworks, autonomous outreach, or autonomous compliance decisions.
- Keep Supabase as the only database and Prisma-backed API routes on Node.js runtime.
- Prefer findings with concrete file/line evidence and a minimal fix.
