import admin from "firebase-admin";
import { env } from "../config/env.js";

let app;

export function getFirebaseApp() {
  if (app) return app;

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase credentials are missing. Check .env or GitHub Secrets.");
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY)
    })
  });

  return app;
}

export function getDb() {
  return getFirebaseApp().firestore();
}

export function getMessaging() {
  return getFirebaseApp().messaging();
}

function normalizePrivateKey(value) {
  return value
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "")
    .replace(/\\n/g, "\n")
    .trim();
}
