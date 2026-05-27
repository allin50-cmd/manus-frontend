# PIE → VaultLine Ingestion

**Repository:** allin50-cmd/manus-frontend
**Date:** 2026-05-25

---

## Overview

`POST /api/pie/opportunity` is the upstream ingestion endpoint for Accuracy PIE planning opportunities. It accepts a PIE payload, validates it with Zod, persists the opportunity through the existing VaultLine intake flow, and writes a full audit event with PIE lineage.

The endpoint is **idempotent**: repeated delivery of the same `externalRef` returns the existing matter reference and appends a `ingestion_replayed` audit event without creating a duplicate intake row.

---

## Payload Contract

```ts
{
  // Required
  externalRef: string;          // Planning application reference — idempotency key
                                // e.g. "24/AP/1234", "BRO/2024/0042/FUL"
  applicantName: string;        // Maps to intake clientName

  // Optional
  applicantEmail?: string;      // Valid email — maps to clientEmail
  applicantPhone?: string;      // Max 50 chars — maps to clientPhone
  description?: string;         // Max 2000 chars — maps to intake description
  siteAddress?: string;         // Max 500 chars — stored in audit metadata
  district?: string;            // Local authority / district — stored in audit metadata
  urgency?: 'low' | 'medium' | 'high' | 'critical'; // Default: 'medium'
  estimatedValue?: string;      // Max 50 chars — maps to intake claimValue
  submittedAt?: string;         // ISO 8601 with timezone offset — stored in audit metadata
}
```

### Example

```json
{
  "externalRef": "24/AP/1234",
  "applicantName": "Bromley Development Ltd",
  "applicantEmail": "contact@bromleydev.co.uk",
  "description": "Residential development, 4 dwellings",
  "siteAddress": "12 High Street, Bromley BR1 1AB",
  "district": "Bromley",
  "urgency": "high",
  "estimatedValue": "£2,400,000",
  "submittedAt": "2026-05-25T09:00:00+01:00"
}
```

---

## sourceRef Contract

All PIE opportunities use the canonical prefix format:

```
sourceRef = "PIE:<externalRef>"
```

Example: `PIE:24/AP/1234`

This is deterministic — the same `externalRef` always produces the same `sourceRef`. The `sourceRef` is stored in:

1. `intake_forms.source_ref` — operational state, queryable
2. `clerk_audit_events.metadata.sourceRef` — immutable audit trail

This is the dual-layer lineage design (see `docs/dual-layer-lineage.md`).

---

## Response Shapes

### 201 Created — first ingestion

```json
{
  "ok": true,
  "replayed": false,
  "message": "PIE opportunity ingested successfully",
  "matterRef": "MAT-1779700788808",
  "sourceRef": "PIE:24/AP/1234",
  "urgency": "high"
}
```

### 200 OK — replay detected

```json
{
  "ok": true,
  "replayed": true,
  "message": "PIE opportunity already ingested",
  "matterRef": "MAT-1779700788808",
  "sourceRef": "PIE:24/AP/1234"
}
```

### 400 Bad Request — validation failure

```json
{
  "ok": false,
  "error": "Invalid PIE payload",
  "details": {
    "fieldErrors": {
      "externalRef": ["Required"],
      "applicantEmail": ["Invalid email"]
    },
    "formErrors": []
  }
}
```

---

## Idempotency / Replay Semantics

| Scenario | Behavior |
|---|---|
| First delivery | Insert `intake_forms` row, write `captured` audit event, return 201 |
| Repeated delivery (same `externalRef`) | No new intake row, write `ingestion_replayed` audit event, return 200 with `replayed: true` |
| Different `externalRef`, same applicant | New intake row created — treated as a distinct opportunity |

The idempotency check is a `SELECT` on `intake_forms.source_ref` before the `INSERT`. No distributed lock is used. Under extreme concurrency, two simultaneous first deliveries of the same `externalRef` could theoretically produce a race; in practice, PIE delivers sequentially with retries. If a duplicate row constraint is needed for strict enforcement, add a `UNIQUE` index on `intake_forms.source_ref` in a future migration.

---

## Audit Lineage

### First ingestion — audit event

```json
{
  "entityType": "intake",
  "entityUuid": "<intake_forms.id>",
  "action": "captured",
  "correlationId": "<uuid>",
  "metadata": {
    "matterRef": "MAT-...",
    "matterType": "planning",
    "urgency": "high",
    "sourceRef": "PIE:24/AP/1234",
    "upstreamSystem": "PIE",
    "pieExternalRef": "24/AP/1234",
    "siteAddress": "12 High Street, Bromley BR1 1AB",
    "district": "Bromley",
    "submittedAt": "2026-05-25T09:00:00+01:00"
  }
}
```

### Replay — audit event

```json
{
  "entityType": "intake",
  "entityUuid": "<same intake_forms.id as original>",
  "action": "ingestion_replayed",
  "correlationId": "<new uuid per replay>",
  "metadata": {
    "matterRef": "MAT-...",
    "sourceRef": "PIE:24/AP/1234",
    "upstreamSystem": "PIE",
    "pieExternalRef": "24/AP/1234",
    "replayDetected": true
  }
}
```

Replays use a **new** `correlationId` per delivery. This traces each PIE delivery attempt independently in the audit trail.

---

## Structured Logs

| Event | Level | Fields |
|---|---|---|
| `pie.ingestion.captured` | info | correlationId, matterRef, sourceRef, pieExternalRef, urgency, durationMs |
| `pie.ingestion.replayed` | info | correlationId, sourceRef, pieExternalRef, existingMatterRef, durationMs |
| `pie.ingestion.validation_failed` | warn | correlationId, errors |
| `pie.ingestion.failed` | error | correlationId, sourceRef, error |
| `vaultline.write.failed` | error | correlationId, endpoint=pie-opportunity, error |

---

## Error Handling

- Zod validation failure: `400` with structured field errors; no DB write
- DB write failure: `500` with safe message; no stack trace exposed to client
- VaultLine audit write failure: logged as `vaultline.write.failed`; intake row write is NOT rolled back (audit is secondary)
- Missing/empty `externalRef`: caught by Zod validation, `400`

---

## Integration with Downstream Flows

The intake row created by PIE ingestion is identical in structure to a manual intake submission. The `sourceRef = "PIE:<ref>"` makes it queryable by origin. Downstream consumers (compliance check, UltAi workflow) can:

- Filter `intake_forms` by `source_ref LIKE 'PIE:%'` for PIE-originated matters
- Cross-reference `clerk_audit_events.metadata->>'sourceRef'` for the full immutable lineage
- The `matterRef` follows the same `MAT-<timestamp>` format as all other intakes

---

## Operational Notes

- **Authentication**: Currently unauthenticated — protected by network/Cloudflare rules in production
- **Rate limiting**: Apply Cloudflare rate limiting at `/api/pie/*` (recommended: 60 req/min per IP)
- **Concurrency**: See idempotency note above — sequential PIE delivery is safe; extreme concurrency may need a DB unique constraint
- **matterType**: Always `"planning"` — all PIE opportunities are planning matters
- **No schema change**: Uses existing `intake_forms` and `clerk_audit_events` tables unchanged
