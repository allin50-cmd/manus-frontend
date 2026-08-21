# Architecture Authority

## Canonical source

UltraTech Master Architecture Blueprint v2.0 is the controlling architecture for this repository.

The earlier UltraTech System Architecture Blueprint v1.0 remains useful for financial-product boundaries, shared connector rules, replaceable accounting engines, and the one-financial-truth principle, but its level numbering is superseded by v2.0.

## Authority boundary

- Human/commercial objectives define the intended outcome.
- UltraCore plans, coordinates, proposes, and delegates.
- UltraTech Runtime is the authority and execution kernel.
- Runtime validates identity, permissions, policy, authority, HITL requirements, workflow state, execution, immutable events, audit, and connector governance.
- Agents, external frameworks, models, and harnesses never self-grant production authority.
- Verticals own domain UX and domain data, but reuse Runtime authority, audit, receipts, and shared connectors.

## Production release invariant

Production schema migration is a consequential action. It must not be hidden inside the application build lifecycle.

The approved sequence is:

1. Identify the exact release ref and immutable commit SHA.
2. Record a non-secret change reference and backup/rollback reference.
3. Obtain explicit production migration approval.
4. Execute `npm run db:migrate:deploy` through the governed production environment.
5. Build the application after the migration succeeds.
6. Produce and retain a release receipt containing objective, intent, policy, authority, action, approval, execution, result, and evidence.
7. Perform authenticated no-write production acceptance before calling the release proven.

`npm run build` must remain free of production database mutation side effects.

## Connector invariant

No vertical should hold standing external-provider authority outside the shared connector and Runtime governance layers. Integrations with accounting providers, HMRC, Companies House, banking/open-banking, Gmail/Calendar, GitHub, MCP, HTTP, or API tools must remain governed connector capabilities.

## Commercial priority

Do not rebuild platform layers merely because they can be improved. Prefer the existing Runtime/audit boundaries and return engineering effort to commercially usable vertical journeys once release safety is satisfied.
