import {
  ConfidentialClientApplication,
  Configuration,
  AuthenticationResult,
  ClientCredentialRequest,
  OnBehalfOfRequest,
} from '@azure/msal-node';

// Lazy-initialised singleton — validated on first use, not at module load time.
// This prevents crashes when Azure AD env vars aren't set (e.g. non-Azure environments).
let _msalApp: ConfidentialClientApplication | null = null;

function getMsalApp(): ConfidentialClientApplication {
  if (_msalApp) return _msalApp;

  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId) throw new Error('AZURE_CLIENT_ID is not set');
  if (!clientSecret) throw new Error('AZURE_CLIENT_SECRET is not set');
  if (!tenantId) throw new Error('AZURE_TENANT_ID is not set');

  const config: Configuration = {
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  };

  _msalApp = new ConfidentialClientApplication(config);
  return _msalApp;
}

/**
 * Acquire a token using the client credentials flow (app-only, no user context).
 * Use for server-to-server calls, e.g. Microsoft Graph, SharePoint.
 */
export async function getAppToken(scopes: string[]): Promise<AuthenticationResult> {
  const request: ClientCredentialRequest = { scopes };
  const result = await getMsalApp().acquireTokenByClientCredential(request);
  if (!result) throw new Error('Failed to acquire app token');
  return result;
}

/**
 * Acquire a token on behalf of an authenticated user (OBO flow).
 * Pass the bearer token received from the frontend.
 */
export async function getOboToken(
  userBearerToken: string,
  scopes: string[],
): Promise<AuthenticationResult> {
  const request: OnBehalfOfRequest = { oboAssertion: userBearerToken, scopes };
  const result = await getMsalApp().acquireTokenOnBehalfOf(request);
  if (!result) throw new Error('Failed to acquire OBO token');
  return result;
}

export function getMsalClient(): ConfidentialClientApplication {
  return getMsalApp();
}
