-- UltraCore App Platform schema
-- Additive only. Reuses existing `tenants` table — does not duplicate tenant data.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS apps (
  id            TEXT PRIMARY KEY,              -- stable slug, e.g. 'fineguard'
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  launch_url    TEXT NOT NULL,
  manifest_url  TEXT NOT NULL,
  health_url    TEXT,
  icon_url      TEXT,
  status        TEXT NOT NULL DEFAULT 'beta',   -- live | beta | coming_soon
  installable   BOOLEAN NOT NULL DEFAULT true,
  pwa           BOOLEAN NOT NULL DEFAULT false,
  latest_version TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  version       TEXT NOT NULL,
  changelog     TEXT,
  released_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (app_id, version)
);

CREATE TABLE IF NOT EXISTS app_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL,                  -- e.g. 'companies.read'
  description   TEXT,
  UNIQUE (app_id, permission)
);

CREATE TABLE IF NOT EXISTS workspace_app_installations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  app_id              TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'active', -- active | trial | suspended | uninstalled
  installed_by        TEXT,
  installed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at       TIMESTAMPTZ,
  granted_permissions JSONB NOT NULL DEFAULT '[]',
  config              JSONB NOT NULL DEFAULT '{}',
  UNIQUE (tenant_id, app_id)
);

CREATE TABLE IF NOT EXISTS app_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_events_app_tenant ON app_events(app_id, tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app_webhooks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  secret        TEXT NOT NULL,
  events        JSONB NOT NULL DEFAULT '[]',
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_categories (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
