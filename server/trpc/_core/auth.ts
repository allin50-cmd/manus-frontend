import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Request } from 'express';
import type { Tenant } from '../../drizzle/schema.js';

// ─── Azure AD B2C config (from env) ──────────────────────────────────────────

const B2C_TENANT = process.env.AZURE_B2C_TENANT_NAME ?? '';
const B2C_POLICY = process.env.AZURE_B2C_POLICY ?? 'B2C_1_signupsignin';
const B2C_CLIENT_ID = process.env.AZURE_B2C_CLIENT_ID ?? '';

function getJwksUri(): string {
  return `https://${B2C_TENANT}.b2clogin.com/${B2C_TENANT}.onmicrosoft.com/${B2C_POLICY}/discovery/v2.0/keys`;
}

function getIssuer(): string {
  return `https://${B2C_TENANT}.b2clogin.com/${process.env.AZURE_B2C_TENANT_ID ?? B2C_TENANT}/v2.0/`;
}

// Lazy JWKS set (cached in-process)
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!_jwks && B2C_TENANT) {
    _jwks = createRemoteJWKSet(new URL(getJwksUri()));
  }
  return _jwks;
}

// ─── Token payload shape ──────────────────────────────────────────────────────

export type B2CTokenClaims = {
  oid: string;        // Azure object ID — used as openId
  emails?: string[];  // Email addresses
  name?: string;
  given_name?: string;
  family_name?: string;
  extension_tenantSlug?: string; // Custom attribute for tenant (optional)
  roles?: string[];   // App roles
};

export type VerifiedAuthUser = {
  openId: string;
  email: string | null;
  name: string | null;
};

// ─── Verify Azure AD B2C JWT ──────────────────────────────────────────────────

export async function verifyB2CToken(token: string): Promise<VerifiedAuthUser | null> {
  const jwks = getJwks();
  if (!jwks) return null;

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: getIssuer(),
      audience: B2C_CLIENT_ID || undefined,
    });

    const claims = payload as unknown as B2CTokenClaims;

    return {
      openId: claims.oid,
      email: claims.emails?.[0] ?? null,
      name: claims.name ?? ([claims.given_name, claims.family_name].filter(Boolean).join(' ') || null),
    };
  } catch {
    return null;
  }
}

// ─── Extract auth user from Express request ───────────────────────────────────

export async function getUserFromRequest(req: Request): Promise<VerifiedAuthUser | null> {
  // 1. Try Azure AD B2C Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = await verifyB2CToken(token);
    if (user) return user;
  }

  // 2. Dev/test fallback: x-user-open-id header (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    const openId = req.headers['x-user-open-id'] as string | undefined;
    if (openId) {
      return {
        openId,
        email: (req.headers['x-user-email'] as string) ?? null,
        name: (req.headers['x-user-name'] as string) ?? null,
      };
    }
  }

  return null;
}

// ─── Resolve tenant from request ─────────────────────────────────────────────

export function getTenantSlugFromRequest(req: Request): string | null {
  // 1. Explicit header (e.g. X-Tenant: acme)
  const headerSlug = req.headers['x-tenant'] as string | undefined;
  if (headerSlug) return headerSlug.toLowerCase();

  // 2. Subdomain: acme.clerkos.app → slug = acme
  const host = req.headers.host ?? '';
  // Strip port, strip www, take first subdomain part
  const hostOnly = host.split(':')[0];
  const parts = hostOnly.split('.');
  // e.g. acme.clerkos.app → ['acme', 'clerkos', 'app'] → parts.length >= 3
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0].toLowerCase();
  }

  // 3. Dev fallback: DEFAULT_TENANT_SLUG env var
  if (process.env.DEFAULT_TENANT_SLUG) {
    return process.env.DEFAULT_TENANT_SLUG;
  }

  return null;
}

// ─── Tenant lookup helper (imported by context.ts) ───────────────────────────

export type { Tenant };
