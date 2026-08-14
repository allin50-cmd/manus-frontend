# UltraTech Master Architecture v2.2

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
- Property compute prototype merged to `main` at `f09d5d4217a97790501e84ca6db53c73d4d4fbd0` via PR #79.
- Canonical property compute path: normalized portfolio JSON or Manus export adapter -> IPython/Jupyter kernel -> rent/compliance/maintenance/data-quality analysis -> SHA-256 evidence receipt -> concise business summary.
- Fixture proof: 2 properties, 2 active tenancies, GBP 2,200 monthly rent, GBP 26,400 annualised rent, 1 certificate expiring within 30 days, 1 high-priority open maintenance job, status `REVIEW_REQUIRED`.
- Evidence hashes from the proven fixture: input `3eeab3e8e1afd3ad09c8b478bf0ed9bfcaa8d24b35d73032f5dc507055f91865`; result `7e89ab69ff2b77eb9e264fc2d8aee63cb62651782b183f5bcc3bbcdad13f9862`.
- Live Manus adapter exists and is hardened, but a real Manus export has not yet been proven from the execution environment. Do not promote fixture results as live portfolio evidence.
- Property domain migration remains gated until real exported records are reconciled and validated.
- Production customer app remains separate from this compute proof; no FineGuard production migration is authorised by this update.

## Property Compute Contract
Command:
`python tools/compute/run_property_business.py --manus`

Flow:
`MANUS_EXPORT -> NORMALISE -> COMPUTE -> RECONCILE -> EVIDENCE -> REVIEW -> VALIDATED_PROPERTY_STORE`

Promotion rule:
Only reconciled records that pass validation may move into the dedicated property schema. Unknown, conflicting or incomplete records remain review-required and must not be silently repaired by an LLM.

Authority rule:
Compute may analyse and propose. It may not grant itself authority, approve consequential actions, mutate protected production state or bypass the Runtime receipt path.

## Roadmap
### NOW
- Run the real Manus property export through the merged compute path and capture the evidence receipt.
- Reconcile live property, tenancy, compliance and maintenance records; quarantine conflicts rather than guessing.
- Complete the dedicated property schema only against the validated compute contract.
- Provision ultratech-production-lite: Cloudflare -> AWS Lightsail London -> Docker Compose.
- Property cash journey: portfolio -> need -> action -> recorded outcome -> onboarding/revenue CTA.
- Builders cash journey: opportunity -> qualify -> quote/job -> WON -> GBP value -> activity receipt.
- Deploy UltraTech Runtime authority/receipt path and bounded Hermes worker on the same origin host.
- Prove reboot recovery, database persistence, backup/restore and HITL bypass resistance.
- Preserve FineGuard production operation; do not migrate it during the 24-hour sprint.

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
PASS only when all are true:
1. Real Manus export is obtained without weakening production or preview security.
2. The merged compute command completes against that export.
3. Counts and monetary totals reconcile to source records.
4. Compliance and maintenance exceptions are surfaced deterministically.
5. Input and result hashes are captured.
6. Conflicts remain explicit and review-required.
7. No protected production write occurs outside UltraTech Runtime authority.
8. Validated records can be mapped losslessly into the property schema.

Until then the state is: `COMPUTE_PROVEN / LIVE_DATA_PENDING`.
