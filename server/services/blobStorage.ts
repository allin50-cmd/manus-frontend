import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT ?? '';
const ACCOUNT_KEY = process.env.AZURE_STORAGE_KEY ?? '';
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING ?? '';
const CONTAINER = process.env.AZURE_STORAGE_CONTAINER ?? 'clerkos-documents';

// ─── Lazy client ──────────────────────────────────────────────────────────────

let _blobClient: BlobServiceClient | null = null;

function getClient(): BlobServiceClient | null {
  if (_blobClient) return _blobClient;
  if (CONNECTION_STRING) {
    try {
      _blobClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
      return _blobClient;
    } catch (err) {
      console.warn('[BlobStorage] Failed to create client:', err);
    }
  }
  return null;
}

// ─── Path convention ─────────────────────────────────────────────────────────
// tenants/{tenantId}/cases/{caseId}/documents/{documentId}/v{version}

export function buildBlobPath(
  tenantId: string,
  caseId: number,
  documentId: number,
  version: number,
  fileName: string,
): string {
  return `tenants/${tenantId}/cases/${caseId}/documents/${documentId}/v${version}/${fileName}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const BlobStorage = {
  /**
   * Upload a Buffer or stream to blob storage.
   * Returns the blob URL or null if storage is not configured.
   */
  async upload(blobPath: string, data: Buffer, mimeType: string): Promise<string | null> {
    const client = getClient();
    if (!client) {
      console.debug('[BlobStorage] Not configured — upload skipped for:', blobPath);
      return null;
    }

    const container = client.getContainerClient(CONTAINER);
    await container.createIfNotExists({ access: 'blob' });

    const blob = container.getBlockBlobClient(blobPath);
    await blob.upload(data, data.length, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });

    return blob.url;
  },

  /**
   * Generate a short-lived SAS token URL for direct client uploads.
   * Expires in the given number of minutes (default 15).
   */
  generateUploadSasUrl(blobPath: string, expiresInMinutes = 15): string | null {
    if (!ACCOUNT_NAME || !ACCOUNT_KEY) {
      console.debug('[BlobStorage] Not configured — SAS URL not generated');
      return null;
    }

    const credential = new StorageSharedKeyCredential(ACCOUNT_NAME, ACCOUNT_KEY);
    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + expiresInMinutes);

    const sas = generateBlobSASQueryParameters(
      {
        containerName: CONTAINER,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse('cw'), // create + write
        expiresOn,
      },
      credential,
    );

    return `https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER}/${blobPath}?${sas.toString()}`;
  },

  /**
   * Generate a read SAS URL for secure client downloads.
   */
  generateReadSasUrl(blobPath: string, expiresInMinutes = 60): string | null {
    if (!ACCOUNT_NAME || !ACCOUNT_KEY) return null;

    const credential = new StorageSharedKeyCredential(ACCOUNT_NAME, ACCOUNT_KEY);
    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + expiresInMinutes);

    const sas = generateBlobSASQueryParameters(
      {
        containerName: CONTAINER,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn,
      },
      credential,
    );

    return `https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER}/${blobPath}?${sas.toString()}`;
  },
};
