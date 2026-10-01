import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
} from "firebase/firestore";

const useEmulators =
  import.meta.env.DEV && import.meta.env.VITE_FIREBASE_USE_EMULATORS === "true";
const config = {
  apiKey: useEmulators
    ? "demo-api-key"
    : import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: useEmulators
    ? "demo-applytrack.firebaseapp.com"
    : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: useEmulators
    ? "demo-applytrack"
    : import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: useEmulators
    ? "demo-app-id"
    : import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
};
const configured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);
const app = configured
  ? getApps().length
    ? getApp()
    : initializeApp(config)
  : null;
export const auth = app ? getAuth(app) : null;
export const db = app
  ? initializeFirestore(
      app,
      useEmulators ? { experimentalForceLongPolling: true } : {},
    )
  : null;
if (useEmulators && auth && db) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
export function requireFirebase() {
  if (!auth || !db)
    throw new Error(
      "Account services are not connected yet. Please explore the demo for now.",
    );
  return { auth, db };
}
export function requireAccount(ownerId: string) {
  const services = requireFirebase();
  if (!ownerId || services.auth.currentUser?.uid !== ownerId) {
    throw new Error("Please sign in again before accessing your applications.");
  }
  return services;
}
