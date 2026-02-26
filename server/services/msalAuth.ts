import {
  ConfidentialClientApplication,
  Configuration,
  AuthenticationResult,
  ClientCredentialRequest,
  OnBehalfOfRequest,
} from '@azure/msal-node';

if (!process.env.AZURE_CLIENT_ID) throw new Error('AZURE_CLIENT_ID is not set');
if (!process.env.AZURE_CLIENT_SECRET) throw new Error('AZURE_CLIENT_SECRET is not set');
if (!process.env.AZURE_TENANT_ID) throw new Error('AZURE_TENANT_ID is not set');

const config: Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
  },
};

// Equivalent of ConfidentialClientApplicationBuilder.Create(...).WithClientSecret(...).WithAuthority(...).Build()
const app = new ConfidentialClientApplication(config);

/**
 * Acquire a token using the client credentials flow (app-only, no user context).
 * Use for server-to-server calls, e.g. Microsoft Graph, SharePoint.
 */
export async function getAppToken(scopes: string[]): Promise<AuthenticationResult> {
  const request: ClientCredentialRequest = { scopes };
  const result = await app.acquireTokenByClientCredential(request);
  if (!result) throw new Error('Failed to acquire app token');
  return result;
}

/**
 * Acquire a token on behalf of an authenticated user (OBO flow).
 * Pass the bearer token received from the frontend.
 */
export async function getOboToken(
  userBearerToken: string,
  scopes: string[]
): Promise<AuthenticationResult> {
  const request: OnBehalfOfRequest = { oboAssertion: userBearerToken, scopes };
  const result = await app.acquireTokenOnBehalfOf(request);
  if (!result) throw new Error('Failed to acquire OBO token');
  return result;
}

export { app as msalClient };
