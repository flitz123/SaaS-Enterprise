/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: "https://saas-enterprise-2ehf.onrender.com/";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}