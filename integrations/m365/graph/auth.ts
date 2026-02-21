// ============================================================
// FineGuard — Azure AD Authentication (MSAL + Client Credentials)
// ============================================================
//
// Supports two flows:
//   1. Client Credentials (daemon / service-to-service)
//   2. Authorization Code (delegated / on-behalf-of user)
//
// Dependencies:
//   npm install @azure/msal-node @azure/identity
// ============================================================

import {
  ConfidentialClientApplication,
  AuthenticationResult,
  Configuration,
} from "@azure/msal-node";
import type { AzureADConfig, TokenResponse } from "../types/index.js";

// ── MSAL Configuration Builder ──────────────────────────────

function buildMsalConfig(cfg: AzureADConfig): Configuration {
  return {
    auth: {
      clientId: cfg.clientId,
      authority: `https://login.microsoftonline.com/${cfg.tenantId}`,
      clientSecret: cfg.clientSecret,
    },
    system: {
      loggerOptions: {
        logLevel: 3, // Error only in production
      },
    },
  };
}

// ── Token Cache (in-memory; swap for Redis in production) ───

const tokenCache = new Map<string, { token: string; expiresOn: number }>();

function getCachedToken(key: string): string | null {
  const entry = tokenCache.get(key);
  if (!entry) return null;
  // 5-minute buffer before expiry
  if (Date.now() > entry.expiresOn - 5 * 60 * 1000) {
    tokenCache.delete(key);
    return null;
  }
  return entry.token;
}

function setCachedToken(key: string, token: string, expiresOn: Date): void {
  tokenCache.set(key, { token, expiresOn: expiresOn.getTime() });
}

// ── Client Credentials Flow (App-only) ─────────────────────

export async function getAppToken(config: AzureADConfig): Promise<TokenResponse> {
  const cacheKey = `app:${config.clientId}:${config.tenantId}`;
  const cached = getCachedToken(cacheKey);
  if (cached) {
    return {
      accessToken: cached,
      expiresOn: new Date(tokenCache.get(cacheKey)!.expiresOn),
      tokenType: "Bearer",
    };
  }

  const msalApp = new ConfidentialClientApplication(buildMsalConfig(config));

  const result: AuthenticationResult | null =
    await msalApp.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
    });

  if (!result) {
    throw new Error("Failed to acquire app token — null result from MSAL");
  }

  const expiresOn = result.expiresOn ?? new Date(Date.now() + 3600 * 1000);
  setCachedToken(cacheKey, result.accessToken, expiresOn);

  return {
    accessToken: result.accessToken,
    expiresOn,
    tokenType: "Bearer",
  };
}

// ── Authorization Code Flow (Delegated) ─────────────────────

export async function getDelegatedToken(
  config: AzureADConfig,
  authCode: string
): Promise<TokenResponse> {
  const msalApp = new ConfidentialClientApplication(buildMsalConfig(config));

  const result = await msalApp.acquireTokenByCode({
    code: authCode,
    scopes: config.scopes,
    redirectUri: config.redirectUri,
  });

  if (!result) {
    throw new Error("Failed to acquire delegated token");
  }

  const expiresOn = result.expiresOn ?? new Date(Date.now() + 3600 * 1000);

  return {
    accessToken: result.accessToken,
    refreshToken: undefined, // MSAL manages refresh internally
    expiresOn,
    tokenType: "Bearer",
  };
}

// ── On-Behalf-Of Flow (for Teams bot / middleware) ──────────

export async function getOnBehalfOfToken(
  config: AzureADConfig,
  userAssertion: string
): Promise<TokenResponse> {
  const msalApp = new ConfidentialClientApplication(buildMsalConfig(config));

  const result = await msalApp.acquireTokenOnBehalfOf({
    oboAssertion: userAssertion,
    scopes: config.scopes,
  });

  if (!result) {
    throw new Error("Failed to acquire OBO token");
  }

  const expiresOn = result.expiresOn ?? new Date(Date.now() + 3600 * 1000);

  return {
    accessToken: result.accessToken,
    expiresOn,
    tokenType: "Bearer",
  };
}

// ── Config Loader (from environment) ────────────────────────

export function loadAzureADConfig(): AzureADConfig {
  const required = (key: string): string => {
    const val = process.env[key];
    if (!val) throw new Error(`Missing required env var: ${key}`);
    return val;
  };

  return {
    tenantId: required("AZURE_TENANT_ID"),
    clientId: required("AZURE_CLIENT_ID"),
    clientSecret: required("AZURE_CLIENT_SECRET"),
    redirectUri: process.env["AZURE_REDIRECT_URI"] ?? "http://localhost:3000/auth/callback",
    scopes: (process.env["AZURE_SCOPES"] ?? "https://graph.microsoft.com/.default").split(","),
  };
}
