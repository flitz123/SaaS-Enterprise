/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: "https://saa-s-enterprise-oabb.vercel.app";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}