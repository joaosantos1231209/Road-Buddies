import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

// As variáveis de ambiente do Vite começam com VITE_
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234:web:1234",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// messaging might throw instantly if browser doesn't support it (e.g. non-HTTPS/IP)
let messagingInstance: any = null;
try {
  if (typeof window !== 'undefined') {
    messagingInstance = getMessaging(app);
  }
} catch (error) {
  console.log('[FCM] Push notifications not supported in this environment.');
}

export const messaging = messagingInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
