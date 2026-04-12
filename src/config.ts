/**
 * Runtime configuration.
 *
 * Reads all env vars once at module load, logs a warning for any that are
 * missing or malformed, but does NOT throw.  Throws only when a caller
 * accesses a getter for a var that is not set — so the process starts and
 * only the affected route/handler fails, not the entire server.
 *
 * Classification
 * ─────────────
 *   Boot-critical  : NODE_ENV (throws immediately if invalid)
 *   App-critical   : DATABASE_URL (getter — throws at call time)
 *   Feature-gated  : Stripe, Companies House (getters — return 503 when called without config)
 */

import { log } from '@/lib/logger';

const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

/** Logs a startup warning when a var is missing/malformed. Silent at build time. */
function warnIfMissing(name: string, value: string, prefix?: string): void {
  if (isBuild) return;
  if (!value) {
    log.warn('[config] env var not set — dependent routes will return errors', { env: name });
    return;
  }
  if (prefix && !value.startsWith(prefix)) {
    log.warn('[config] env var has unexpected format', { env: name, expectedPrefix: prefix });
  }
}

/** Throws a clear error at call time when a required var is absent. */
function demand(name: string, value: string): string {
  if (!value) {
    throw new Error(
      `[config] ${name} is required but not set. ` +
      `Add it in Azure → App Service → Settings → Environment variables.`,
    );
  }
  return value;
}

function asPort(raw: string): number {
  const p = parseInt(raw, 10);
  return Number.isInteger(p) && p > 0 && p <= 65535 ? p : 8080;
}

// ── Read all vars once ──────────────────────────────────────────────────────
const _db  = readEnv('DATABASE_URL');
const _sk  = readEnv('STRIPE_SECRET_KEY');
const _wh  = readEnv('STRIPE_WEBHOOK_SECRET');
const _pa  = readEnv('STRIPE_PRICE_ACCOUNTS_FILING');
const _pc  = readEnv('STRIPE_PRICE_CONFIRMATION_STATEMENT');
const _ps  = readEnv('STRIPE_PRICE_STRIKE_OFF');
const _ch  = readEnv('COMPANIES_HOUSE_API_KEY');
const _aiKey   = readEnv('ANTHROPIC_API_KEY');
const _aiModel = readEnv('ANTHROPIC_MODEL') || 'claude-opus-4-6';

// ── Warn once at startup ────────────────────────────────────────────────────
warnIfMissing('DATABASE_URL',                      _db);
warnIfMissing('STRIPE_SECRET_KEY',                 _sk,  'sk_');
warnIfMissing('STRIPE_WEBHOOK_SECRET',             _wh,  'whsec_');
warnIfMissing('STRIPE_PRICE_ACCOUNTS_FILING',      _pa,  'price_');
warnIfMissing('STRIPE_PRICE_CONFIRMATION_STATEMENT', _pc, 'price_');
warnIfMissing('STRIPE_PRICE_STRIKE_OFF',           _ps,  'price_');
warnIfMissing('COMPANIES_HOUSE_API_KEY',           _ch);
warnIfMissing('ANTHROPIC_API_KEY',                 _aiKey);

// ── NODE_ENV — throw immediately if invalid (Next.js always sets this) ──────
const nodeEnvRaw = readEnv('NODE_ENV') || 'development';
if (!['development', 'production', 'test'].includes(nodeEnvRaw)) {
  throw new Error(`NODE_ENV must be development|production|test. Got: ${nodeEnvRaw}`);
}

// ── Exported config object ──────────────────────────────────────────────────
export const config = {
  nodeEnv:      nodeEnvRaw as 'development' | 'production' | 'test',
  host:         readEnv('HOST') || '0.0.0.0',
  port:         asPort(readEnv('PORT') || readEnv('WEBSITES_PORT') || '8080'),
  publicAppUrl: readEnv('PUBLIC_APP_URL') || readEnv('APP_URL') || 'http://localhost:3000',

  /** Throws if DATABASE_URL is not set. */
  get databaseUrl(): string { return demand('DATABASE_URL', _db); },

  stripe: {
    /** Throws if STRIPE_SECRET_KEY is not set. */
    get secretKey(): string            { return demand('STRIPE_SECRET_KEY', _sk); },
    /** Throws if STRIPE_WEBHOOK_SECRET is not set. */
    get webhookSecret(): string        { return demand('STRIPE_WEBHOOK_SECRET', _wh); },
    /** Throws if STRIPE_PRICE_ACCOUNTS_FILING is not set. */
    get priceAccountsFiling(): string  { return demand('STRIPE_PRICE_ACCOUNTS_FILING', _pa); },
    /** Throws if STRIPE_PRICE_CONFIRMATION_STATEMENT is not set. */
    get priceConfirmationStatement(): string { return demand('STRIPE_PRICE_CONFIRMATION_STATEMENT', _pc); },
    /** Throws if STRIPE_PRICE_STRIKE_OFF is not set. */
    get priceStrikeOff(): string       { return demand('STRIPE_PRICE_STRIKE_OFF', _ps); },
  },

  companiesHouse: {
    /** Throws if COMPANIES_HOUSE_API_KEY is not set. */
    get apiKey(): string { return demand('COMPANIES_HOUSE_API_KEY', _ch); },
    baseUrl: readEnv('COMPANIES_HOUSE_BASE_URL') ||
             'https://api.company-information.service.gov.uk',
  },

  ai: {
    /** Returns API key or null — never throws. Callers must check null for graceful degradation. */
    get apiKey(): string | null { return _aiKey || null; },
    /** Model ID — accepts any string (Mythos or otherwise). */
    model: _aiModel,
  },
};

export type AppConfig = {
  nodeEnv: 'development' | 'production' | 'test';
  host: string;
  port: number;
  publicAppUrl: string;
  databaseUrl: string;
  stripe: {
    secretKey: string;
    webhookSecret: string;
    priceAccountsFiling: string;
    priceConfirmationStatement: string;
    priceStrikeOff: string;
  };
  companiesHouse: {
    apiKey: string;
    baseUrl: string;
  };
};
