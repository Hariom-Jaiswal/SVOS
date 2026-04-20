import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

/**
 * Firebase Client SDK Configuration
 *
 * Centralized initialization for client-side Firebase services.
 * Features safe initialization checks to avoid errors during Next.js build-time
 * when environment variables may be missing.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized and we have an API key
const app =
  getApps().length > 0
    ? getApp()
    : process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      ? initializeApp(firebaseConfig)
      : null;

/**
 * Firebase Auth client instance.
 * Type-safe fallback provided for non-initialized states.
 */
export const auth = app ? getAuth(app) : ({} as ReturnType<typeof getAuth>);

/**
 * Firebase Realtime Database client instance.
 */
export const db = app ? getDatabase(app) : ({} as ReturnType<typeof getDatabase>);

export default app;
