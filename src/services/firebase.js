import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// FCM not initialized immediately unless token is needed.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  if (!auth) {
    console.error("Firebase not initialized. Provide env variables.");
    return;
  }
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error("Login failed", err);
  }
};

export const logout = async () => {
  if (auth) await signOut(auth);
};

export { app, db, auth };
