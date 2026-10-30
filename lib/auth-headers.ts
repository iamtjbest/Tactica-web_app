// lib/auth-headers.ts — attach the signed-in user's Firebase ID token.
//
// The backend (app/auth.py + app/usage.py) reads "Authorization: Bearer
// <token>" so it can attribute a usage event to a real uid, and falls back
// to "anon" when the header isn't there. It is never an access gate: every
// endpoint works signed out.
//
// So this must never block or fail a request. Any problem getting a token
// just means the call goes out unauthenticated, exactly as it did before
// this file existed.

import { auth } from "./firebase";

export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const user = auth.currentUser;
    if (!user) return {};
    // Firebase caches the ID token and only goes to the network when it
    // actually needs refreshing, so this is not a round trip per call.
    const token = await user.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
