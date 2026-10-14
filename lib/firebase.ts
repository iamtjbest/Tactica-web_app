// lib/firebase.ts — Tactica Engine Firebase client (web)
//
// Same Firebase project as the mobile app (project ID "tactica-backend").
// The appId below is a web-type app already registered in that project
// (the mobile app's firebase.ts uses the same credentials via the JS SDK),
// so no new Firebase console setup is needed for the web app.
//
// Values fall back to the real project config if env vars aren't set,
// but prefer setting them via .env.local / Vercel env vars — see
// .env.local.example in the project root.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBlbYAyEcKJfmHnSzXzAtDnJECS1IM9iuY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tactica-backend.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tactica-backend",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tactica-backend.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "749983115247",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:749983115247:web:99314e2040bff8bd76781a",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
