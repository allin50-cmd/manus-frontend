# UltraTech Master Architecture v2.3

Date: 14 August 2026

## North Star
One governed Runtime -> many verticals -> reusable agents/skills -> measurable commercial outcomes

## Non-negotiable boundary
UltraCore and specialist agents may reason, plan, propose and delegate. UltraTech Runtime is the authority and execution kernel. External frameworks such as Vercel eve remain replaceable harnesses/adapters.

## Skill lifecycle
DISCOVER -> INSPECT -> TEST -> ADAPT_OR_CLONE -> REGISTER -> PERMISSION -> USE -> MEASURE -> IMPROVE_OR_REVOKE

## Runtime receipt
OBJECTIVE -> INTENT -> POLICY -> AUTHORITY -> ACTION -> APPROVAL -> EXECUTION -> RESULT -> EVIDENCE

## Operational Build Profile
- Profile: ultratech-production-lite
- Priority: reliability over performance
- Edge: Cloudflare Free initially
- Origin: AWS Lightsail London Small-2GB Linux bundle
- Orchestration: Docker Compose
- Target origin cost: USD 12/month plus existing API/service usage
- FineGuard production remains untouched during this sprint

## Current Proven State
### Property and Builders commercial journeys
- Source proof lives on `allin50-cmd/fineguard`, branch `claude/cash-generation-sprint-5feu2g`, in `docs/evidence/PROPERTY-BUILDERS-JOURNEY-PROOF.md` and `dist/property-builders-console.html`.
- Property journey is PROVEN locally against persisted MariaDB records and read back after process restart: 2 properties, 1 tenancy, GBP 950 monthly rent, 50% occupancy, 3 compliance certificates, 1 remedial job, tenant notification, completed recorded outcome and commercial CTA.
- Compliance status is derived from expiry on read using the 28-day threshold. Proven defect: an EICR expired 1 February 2026 had remained stored as `valid`; derived logic surfaces it as expired.
- Builders / JustWorks journey is PROVEN locally: opportunity -> qualified 8/10 -> quote/invoice -> sent -> paid -> lead promoted to customer -> activity recorded.
- Proven won value: invoice `ACC-2026-0147`, GBP 48,750, status paid.
- UltraTech application suite recorded in the evidence run: `pnpm test` 68 passed / 0 failed after seeding the shipped Luxe fixtures; `tsc --noEmit` clean.
- The self-contained offline console carries the proven exported records and recomputes the certificate status client-side; it now declares UTF-8 explicitly so direct-file client demos preserve GBP signs, arrows, em dashes and checkmarks.
- These journeys are proven, not deployed. Production verification/cutover remains a separate gate.

### Property compute sidecar
- Property compute prototype merged to `manus-frontend/main` at `f09d5d4217a97790501e84ca6db53c73d4d4fbd0` via PR #79.
- Canonical property compute path: normalized portfolio JSON or Manus export adapter -> IPython/Jupyter kernel -> rent/compliance/maintenance/data-quality analysis -> SHA-256 evidence receipt -> concise business summary.
- Fixture proof: 2 properties, 2 active tenancies, GBP 2,200 monthly rent, GBP 26,400 annualised rent, 1 certificate expiring within 30 days, 1 high-priority open maintenance job, status `REVIEW_REQUIRED`.
- Evidence hashes from the proven fixture: input `3eeab3e8e1afd3ad09c8b478bf0ed9bfcaa8d24b35d73032f5dc507055f91865`; result `7e89ab69ff2b77eb9e264fc2d8aee63cb62651782b183f5bcc3bbcdad13f9862`.
- Compute is evidence/analysis only: no protected production writes and no authority escalation.

## Property Compute Contract
Command:
`python tools/compute/run_property_business.py --manus`

Flow:
`SOURCE_EXPORT -> NORMALISE -> COMPUTE -> RECONCILE -> EVIDENCE -> REVIEW -> VALIDATED_PROPERTY_STORE`

Promotion rule:
Only reconciled records that pass validation may move into the dedicated property schema. Unknown, conflicting or incomplete records remain review-required and must not be silently repaired by an LLM.

Authority rule:
Compute may analyse and propose. It may not grant itself authority, approve consequential actions, mutate protected production state or bypass the Runtime receipt path.

## Roadmap
### NOW
- Treat Property and Builders as proven commercial journeys; stop rebuilding their proof and move to deployment/customer use.
- Reconcile the proven UltraTech property records with the canonical property schema and compute contract without inventing identities or fields.
- Complete the dedicated property schema against validated records.
- Provision ultratech-production-lite: Cloudflare -> AWS Lightsail London -> Docker Compose.
- Put the Property journey in front of real landlords/agents and capture onboarding/revenue outcomes.
- Put the Builders journey in front of real builders and capture the next real quoted/won GBP outcome.
- Deploy UltraTech Runtime authority/receipt path and bounded Hermes worker on the same origin host.
- Prove reboot recovery, database persistence, backup/restore and HITL bypass resistance.
- Preserve FineGuard production operation; do not migrate it during this sprint.

### NEXT
- Formal UltraCore agent registry and shared mission protocol.
- A2A gateway with scoped delegation envelopes and receipt return.
- Capability/skill registry with provenance, versions, permissions, evals and revocation.
- First eve adapter: run selected replaceable agents/skills on eve while Runtime remains authority kernel.
- Unified Runtime Receipt v1 across Property, Builders, FineGuard and MediaWorks.
- Hermes/MediaWorks acquisition loop tied to revenue telemetry.

### LATER
- Automated skill discovery from trusted A2A/MCP/open-source agent ecosystems.
- Controlled skill cloning/adaptation with sandbox evaluation and promotion gates.
- Multi-region/global vertical rollout.
- Agent marketplace/internal capability exchange.
- Cross-vertical learning while preserving tenant/domain boundaries.
- Dynamic model/harness routing by cost, quality, latency and risk.

## Immediate Acceptance Gate
PASS for the next deployment slice only when all are true:
1. Property and Builders proven source records are mapped without loss or invented identity.
2. Compliance status remains derived, not writable stored truth.
3. Counts and GBP totals reconcile to the proven source records.
4. Property actions/communications/outcomes remain attributable in the activity trail.
5. Builders quote/won value remains attributable to the correct customer/job.
6. Compute/evidence output remains non-authoritative and receipt-linked.
7. No protected production write occurs outside UltraTech Runtime authority.
8. Full build/test gate passes on the exact release head.
9. Deployment preserves persistent database state through restart.

Current state: `JOURNEYS_PROVEN / COMPUTE_PROVEN / DEPLOYMENT_PENDING`.
