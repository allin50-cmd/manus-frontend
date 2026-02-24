/**
 * Secrets Manager — Azure Key Vault integration with managed identity support.
 * Falls back to environment variable encryption for local development.
 *
 * Production: Use DefaultAzureCredential (Managed Identity / Service Principal).
 * Local dev: Uses AES-256-GCM with LOCAL_ENCRYPTION_KEY env var.
 */
import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeyVaultClient {
  getSecret(name: string): Promise<{ value: string }>;
  setSecret(name: string, value: string): Promise<void>;
}

// ─── Key Vault Client Factory ─────────────────────────────────────────────────

let _kvClient: KeyVaultClient | null = null;

async function getKeyVaultClient(): Promise<KeyVaultClient | null> {
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  if (!vaultUrl) return null;

  try {
    // Dynamic import to avoid hard dependency in environments without Azure SDK
    const { SecretClient } = await import('@azure/keyvault-secrets');
    const { DefaultAzureCredential } = await import('@azure/identity');
    if (!_kvClient) {
      const credential = new DefaultAzureCredential();
      _kvClient = new SecretClient(vaultUrl, credential) as unknown as KeyVaultClient;
    }
    return _kvClient;
  } catch {
    console.warn('[SecretsManager] Azure Key Vault SDK not available — using local encryption');
    return null;
  }
}

// ─── Secret Retrieval ─────────────────────────────────────────────────────────

/**
 * Retrieve a named secret from Azure Key Vault, or fall back to environment variable.
 * NEVER logs the secret value.
 *
 * @param secretName  Key Vault secret name (e.g. 'xero-client-secret')
 * @param envFallback Environment variable name to use if Key Vault unavailable
 */
export async function getSecret(secretName: string, envFallback?: string): Promise<string> {
  const kv = await getKeyVaultClient();
  if (kv) {
    try {
      const secret = await kv.getSecret(secretName);
      return secret.value;
    } catch (err) {
      console.warn(`[SecretsManager] Key Vault lookup failed for ${secretName}:`, (err as Error).message);
    }
  }

  // Fall back to environment variable
  const envKey = envFallback ?? secretName.toUpperCase().replace(/-/g, '_');
  const value = process.env[envKey];
  if (!value) {
    throw new Error(`Secret '${secretName}' not found in Key Vault or environment (${envKey})`);
  }
  return value;
}

// ─── Token Encryption / Decryption ───────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const keyHex = process.env.LOCAL_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('LOCAL_ENCRYPTION_KEY not set — required for token encryption');
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('LOCAL_ENCRYPTION_KEY must be 32 bytes (64 hex chars) for AES-256-GCM');
  }
  return key;
}

/**
 * Encrypt a token for storage in the database.
 * Uses AES-256-GCM with a random IV; format: iv:authTag:ciphertext (all base64).
 * In production, the encryption key is sourced from Azure Key Vault.
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt a token retrieved from the database.
 * Expects the format produced by encryptToken.
 */
export async function decryptToken(ciphertext: string): Promise<string> {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

// ─── Key Rotation Helper ──────────────────────────────────────────────────────

/**
 * Re-encrypt a token with a new encryption key.
 * Used during key rotation procedures (see SECURITY.md).
 *
 * @param ciphertext   Existing encrypted token
 * @param oldKey       32-byte hex key that was used to encrypt
 * @param newKey       32-byte hex key for re-encryption
 */
export async function rotateTokenEncryption(
  ciphertext: string,
  oldKey: string,
  newKey: string
): Promise<string> {
  // Temporarily set old key to decrypt
  const original = process.env.LOCAL_ENCRYPTION_KEY;
  process.env.LOCAL_ENCRYPTION_KEY = oldKey;
  let plaintext: string;
  try {
    plaintext = await decryptToken(ciphertext);
  } finally {
    process.env.LOCAL_ENCRYPTION_KEY = original;
  }

  // Re-encrypt with new key
  const saved = process.env.LOCAL_ENCRYPTION_KEY;
  process.env.LOCAL_ENCRYPTION_KEY = newKey;
  try {
    return await encryptToken(plaintext);
  } finally {
    process.env.LOCAL_ENCRYPTION_KEY = saved;
  }
}
