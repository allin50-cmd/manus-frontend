/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POWER_AUTOMATE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
