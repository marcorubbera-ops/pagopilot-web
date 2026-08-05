/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;

  readonly VITE_RC_ANDROID_API_KEY: string;
  readonly VITE_RC_IOS_API_KEY: string;
  readonly VITE_RC_WEB_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}