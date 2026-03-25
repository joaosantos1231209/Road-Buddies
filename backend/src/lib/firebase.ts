import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  if (process.env.FIREBASE_PRIVATE_KEY) {
    // Handling literal newlines if passed through .env string
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID as string,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
        privateKey: privateKey,
      }),
    });
  } else {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "demo-app",
    });
  }
}

export const authAdmin = getAuth();
