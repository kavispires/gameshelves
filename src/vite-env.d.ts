/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_A: string;
  readonly VITE_FIREBASE_P: string;
  readonly VITE_FIREBASE_I: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_DATABASE_URL?: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_API_ID: string;
  readonly VITE_BGG_USERNAME: string;
}
