# DESIGN.md | FineGuard Pro

> **Status:** Production Blueprint
> **Target Audience:** Claude Code, Gemini, and Senior Developers
> **Core Mission:** Prevent UK Companies House fines through authoritative, high-density monitoring.

## 1. Architectural Principles

- **Incremental Deployment:** Never overwrite stable core logic. Use feature flagging or "v2" naming for major refactors.
- **Data Integrity:** The UI is a reflection of the deadline-engine.ts. No date calculations should happen in React components.
- **Security:** Stripe keys and Companies House API secrets must be accessed via process.env. Hardcoding is a critical failure.

## 2. Visual Identity

The UI must project **Institutional Trust**. It should feel like a premium version of a UK Government service.

### Color Tokens

| Token    | Hex     | Tailwind Class   | Usage                                   |
| -------- | ------- | ---------------- | --------------------------------------- |
| Primary  | #1A2B3C | bg-slate-900     | Navigation, Headers, Primary Actions    |
| Success  | #059669 | text-emerald-600 | "Safe" status, Filings complete         |
| Warning  | #D97706 | text-amber-600   | Deadline < 14 days                      |
| Danger   | #DC2626 | text-red-600     | Deadline < 3 days / Overdue             |
| Surface  | #F9FAFB | bg-gray-50       | Main App Background                     |

### Components & UI Logic

- **Borders over Shadows:** Use `border: 1px solid #E5E7EB` instead of drop shadows for a cleaner, fintech look.
- **Corner Radius:** Strict 6px (`rounded-md`). No "bubbly" or pill-shaped UI elements.
- **Date Format:** Strictly DD MMM YYYY (e.g., 18 Apr 2026).

## 3. Subscription & Stripe Logic

The system enforces limits via the `SubscriptionGuard` component.

- **Free Tier:** 1 Company limit. Standard monitoring.
- **Pro Tier (£10/mo):** 10 Company limit. SMS Alerts + Fine Estimator.
- **Enterprise:** Unlimited. Fine reimbursement guarantee.

## 4. AI Guardrails

When modifying this repository, the AI must:

1. Check for existing hooks (`useSubscription`, `useCompanyCount`) before creating new state logic.
2. Every new component must have a TypeScript Interface.
3. UK Localization: GBP (£) currency, Europe/London timezone.
