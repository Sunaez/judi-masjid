// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);

// Auth reads browser globals and validates API keys during initialization.
// Keep server prerendering from touching it; client code receives the real Auth.
export const auth: Auth =
  typeof window === 'undefined' ? (null as unknown as Auth) : getAuth(app);

// Firestore instance
export const db: Firestore = getFirestore(app);

