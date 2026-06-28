-- Migration 0008: add company_id to os_alerts for workspace scoping
--
-- company_id is nullable so all existing rows remain readable.
-- No FK constraint: company IDs live in the in-memory COMPANY_REGISTRY,
-- not in a database table, so referential integrity cannot be enforced at
-- the DB level (same pattern as os_documents.linked_company).
-- No backfill: there is no reliable mapping from existing alerts to a
-- specific company without guessing.
--
-- Idempotent — safe to run multiple times.

ALTER TABLE os_alerts
  ADD COLUMN IF NOT EXISTS company_id TEXT;

CREATE INDEX IF NOT EXISTS os_alerts_company_idx
  ON os_alerts (company_id)
  WHERE company_id IS NOT NULL;
