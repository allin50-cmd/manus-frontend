# Security Policy — FineGuard MTD

## Overview

FineGuard MTD handles sensitive financial data and HMRC submissions. This document
describes how secrets are stored, how to rotate credentials, and how to respond to incidents.

---

## Secret Storage

### Azure Key Vault (Production)
All secrets are stored in Azure Key Vault and accessed via Managed Identity:
- App Service → System-assigned Managed Identity
- Managed Identity → Key Vault access policy with `Get` + `List` secret permissions
- **No secrets are stored in environment variables in production**

Secrets managed in Key Vault:
| Secret Name | Description |
|-------------|-------------|
| `database-url` | PostgreSQL connection string |
| `local-encryption-key` | AES-256-GCM key for token encryption |
| `storage-connection-string` | Azure Blob Storage connection |
| `hmrc-client-id` | HMRC OAuth client ID |
| `hmrc-client-secret` | HMRC OAuth client secret |
| `xero-client-id` | Xero OAuth client ID |
| `xero-client-secret` | Xero OAuth client secret |
| `form-recognizer-key` | Azure Form Recognizer API key |

### Local Development
For local development, secrets are stored in a `.env` file (never committed to git).
The `.gitignore` excludes `.env` and `*.pem`.

The `LOCAL_ENCRYPTION_KEY` must be a 32-byte (64 hex chars) AES-256 key:
```bash
# Generate a secure key:
openssl rand -hex 32
```

---

## Token Encryption

OAuth tokens (Xero, QuickBooks, Sage, HMRC) are encrypted at rest using AES-256-GCM:
- Random 96-bit IV per encryption
- 128-bit authentication tag prevents tampering
- Stored as `base64(iv):base64(authTag):base64(ciphertext)`

Tokens are decrypted only at the point of use and are never logged.

---

## Key Rotation

### Encryption Key Rotation (`LOCAL_ENCRYPTION_KEY`)

1. Generate a new 64-char hex key: `openssl rand -hex 32`
2. Store new key in Key Vault under a new version:
   ```bash
   az keyvault secret set --vault-name <vault> --name local-encryption-key --value <new-key>
   ```
3. Run the rotation script to re-encrypt all stored tokens:
   ```bash
   OLD_KEY=<old-key> NEW_KEY=<new-key> tsx server/scripts/rotate-encryption.ts
   ```
4. Update the App Service environment to reference the new Key Vault secret version
5. Verify all connectors are still active after rotation

### HMRC / Xero / QuickBooks Credentials

1. Revoke the existing credentials in the respective developer portals
2. Create new credentials
3. Update Key Vault secrets:
   ```bash
   az keyvault secret set --vault-name <vault> --name hmrc-client-secret --value <new-secret>
   ```
4. Re-run the OAuth flow for each affected tenant

---

## Audit Trail

Every external API call, approval decision, and submission is written to:
1. **PostgreSQL `audit_events` table** — fast queryable copy with tenant isolation
2. **Azure Blob Storage `fineguard-audit/` container** — authoritative WORM-protected copy

Audit blobs are encrypted with AES-256-GCM before writing.

The blob storage container has a **time-based immutability policy** (7 years retention)
that prevents deletion or modification. In production, the policy is **locked** —
even subscription owners cannot delete blobs before the retention period expires.

---

## Tenant Isolation

- All database queries are scoped by `tenantId`
- The `x-tenant-id` header identifies the requesting tenant
- In production, tenant ID is extracted from Azure AD JWT claims (not the header)
- Cross-tenant queries are architecturally prevented by foreign key scoping

---

## Network Security

- HTTPS only (enforced by App Service `https_only = true`)
- HSTS headers enabled
- CORS restricted to the application domain only
- Database not publicly accessible (VNet integration recommended for production)
- Key Vault firewall restricts access to App Service outbound IPs

---

## Dependency Security

Run `npm audit` regularly to detect vulnerable dependencies:
```bash
npm audit
npm audit fix
```

Automated dependency updates are configured via GitHub Dependabot.

---

## Incident Response

### Suspected Token Compromise

1. Immediately revoke the affected OAuth application in the provider's developer portal
2. Delete the affected tokens from Key Vault and the database
3. Notify affected tenants
4. Create new credentials and run the OAuth flow again

### Data Breach Procedure

1. Isolate: Disable App Service immediately via Azure Portal
2. Investigate: Review Application Insights logs and audit blob trail
3. Notify: Follow ICO 72-hour breach notification requirement (GDPR)
4. Remediate: Identify root cause, patch, and re-deploy
5. Document: Update this document with findings and mitigations

---

## Compliance Notes

- Data residency: UK South Azure region
- Retention: 7-year audit trail per HMRC record-keeping requirements
- GDPR: Personal data minimised — invoice data does not include personal identifiers by default
- MTD liability: FineGuard is a software intermediary. The filing entity remains legally responsible for the accuracy of submitted VAT returns.

---

## Reporting Vulnerabilities

Report security vulnerabilities to: security@fineguard.io

Do NOT open public GitHub issues for security vulnerabilities.
