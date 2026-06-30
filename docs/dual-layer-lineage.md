# Dual-Layer Lineage Design

**Repository:** allin50-cmd/manus-frontend
**Date:** 2026-05-25

---

## Intent

`sourceRef` is stored in **two places by design**, not by accident:

| Layer | Location | Purpose |
|---|---|---|
| Operational state | `intake_forms.source_ref` | Current queryable record — supports filtering, joins, admin UI |
| Immutable event history | `clerk_audit_events.metadata.sourceRef` | Append-only audit trail — survives row updates, deletions, and migrations |

Do not normalize these into a single location. The redundancy is the point.

---

## Why Two Layers

Operational rows change over time: status updates, enrichment, manual overrides, soft deletes. When that happens, the DB row reflects the *current* state, not the *original* event.

The audit event is written once at capture time and never modified. It records what was true *at the moment the event occurred* — including the upstream reference that triggered it.

This means:

- You can reconstruct the full history of a matter even after the operational row has been updated or deleted.
- Cross-system reconciliation (e.g. matching a PIE opportunity to a VaultLine audit entry) works off the immutable event record, not the mutable operational record.
- Retries, delayed enrichment, and manual overrides all produce additional audit events — the lineage is additive, not overwritten.

---

## The `sourceRef` Contract

```
PIE:<planning-application-ref>
```

Example: `PIE:24/AP/1234`

This is the canonical upstream reference format. It is:

- **Deterministic** — the same opportunity always produces the same `sourceRef`
- **Traceable** — queryable in both `intake_forms` and `clerk_audit_events`
- **System-agnostic** — does not embed PIE-specific foreign keys or internal IDs into the VaultLine schema
- **Replayable** — re-submitting the same intake with the same `sourceRef` produces a new audit event that references the same upstream opportunity

The `PIE:` prefix namespace leaves room for future upstream systems to use the same field without collision (e.g. `CRM:`, `PORTAL:`, `MANUAL`).

---

## Where This Appears in Code

```
server/index.ts         POST /api/intake → reads sourceRef from req.body
server/db/schema.ts     intake_forms.source_ref column (varchar 100, nullable)
server/drizzle/schema.ts clerk_audit_events.metadata (JSON, contains sourceRef key)
server/integration.test.ts  "writes intake audit event with entityUuid and correct metadata"
```

The audit event metadata is written as:

```json
{
  "matterRef": "MAT-...",
  "matterType": "planning",
  "urgency": "high",
  "sourceRef": "PIE:24/AP/1234"
}
```

---

## Future Refactoring Constraint

**Do not remove `intake_forms.source_ref` on the grounds that `clerk_audit_events.metadata` already contains it.**

**Do not remove `sourceRef` from audit metadata on the grounds that `intake_forms.source_ref` already stores it.**

Each layer serves a different consumer:

- Operational layer → application queries, admin UI, workflow state machines
- Audit layer → compliance reporting, cross-system reconciliation, event replay

Removing either breaks a consumer that may not be visible until an incident requires reconstruction.
