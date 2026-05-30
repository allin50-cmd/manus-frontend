-- ============================================================
-- FineGuard Alert Centre — Phase 1 Migration
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL CHECK (source IN ('voice_agent','api','manual','system')),
    severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    status TEXT NOT NULL CHECK (status IN ('OPEN','ESCALATED','CRITICAL','CLOSED')),
    owner_id UUID,
    acknowledged_at TIMESTAMPTZ,
    status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE alerts ADD CONSTRAINT uq_alerts_id_company UNIQUE (id, company_id);
CREATE INDEX idx_alerts_company_status ON alerts (company_id, status);
CREATE INDEX idx_alerts_owner ON alerts (owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_alerts_source ON alerts (source);
CREATE INDEX idx_alerts_severity ON alerts (severity);

CREATE TRIGGER trg_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS escalation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    condition JSONB NOT NULL,
    target_status TEXT NOT NULL CHECK (target_status IN ('ESCALATED','CRITICAL')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_escalation_rules_updated_at
    BEFORE UPDATE ON escalation_rules
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS alert_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL,
    company_id UUID NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'CREATED','ESCALATED','CLOSED','REOPENED','OWNER_CHANGED',
        'SEVERITY_CHANGED','ACKNOWLEDGED','NOTE_ADDED'
    )),
    previous_value JSONB,
    new_value JSONB,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE alert_events
    ADD CONSTRAINT fk_alert_events_alert_company
    FOREIGN KEY (alert_id, company_id) REFERENCES alerts(id, company_id);

CREATE INDEX idx_alert_events_alert ON alert_events (alert_id, created_at);
CREATE INDEX idx_alert_events_company ON alert_events (company_id, created_at);
