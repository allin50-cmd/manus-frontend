/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AZURE_CLIENT_ID?: string;
  readonly VITE_AZURE_TENANT_ID?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
