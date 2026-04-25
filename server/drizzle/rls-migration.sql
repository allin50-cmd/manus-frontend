-- ============================================================================
-- ClerkOS v1.1 — Row-Level Security Migration
-- Apply AFTER the Drizzle schema migration (npx drizzle-kit push)
-- Run as a PostgreSQL superuser or the database owner.
-- ============================================================================

-- Helper function: returns the current tenant UUID from session context
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_tenant_id', true), ''),
    NULL
  )::uuid;
$$ LANGUAGE SQL STABLE;

-- ─── Enable RLS on all tenant-scoped tables ──────────────────────────────────

ALTER TABLE clerk_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerk_cases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerk_hearings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerk_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerk_bundles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerk_allocations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerk_diaries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerk_audit_events  ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ────────────────────────────────────────────────────────────
-- Note: Superusers bypass RLS. Use a dedicated app role, not the DB owner.

CREATE POLICY tenant_isolation ON clerk_users
  AS PERMISSIVE FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON clerk_cases
  AS PERMISSIVE FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON clerk_hearings
  AS PERMISSIVE FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON clerk_documents
  AS PERMISSIVE FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON clerk_bundles
  AS PERMISSIVE FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON clerk_allocations
  AS PERMISSIVE FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON clerk_diaries
  AS PERMISSIVE FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON clerk_audit_events
  AS PERMISSIVE FOR ALL
  USING (tenant_id = current_tenant_id());

-- ─── Application role (run as this user, not owner) ──────────────────────────

-- CREATE ROLE clerkos_app LOGIN PASSWORD '<strong-password>';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clerkos_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clerkos_app;

-- ─── Audit immutability: prevent deletes on audit_events ─────────────────────

CREATE RULE no_delete_audit AS ON DELETE TO clerk_audit_events DO INSTEAD NOTHING;

-- ─── Tenant scoping helper for backend ───────────────────────────────────────
-- The backend calls this before any query in a transaction:
--   SELECT set_config('app.current_tenant_id', '<uuid>', true);
-- The 'true' parameter makes it LOCAL to the current transaction.
