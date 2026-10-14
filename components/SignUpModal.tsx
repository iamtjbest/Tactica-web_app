// components/SignUpModal.tsx — replaces EmailCapture.tsx
//
// Old behaviour: after visiting 2 module pages, nag for an email address,
// post it to a Google Form (a waitlist, not a real account).
//
// New behaviour: on any of the 6 module pages, show a real sign-up/sign-in
// modal (Firebase email+password) either after the person has sat on the
// page for 3 minutes, or immediately once they've actually run the module
// (see lib/track-module-action.ts) — whichever happens first. Already
// signed-in users never see it. Once someone closes it or signs up/in, it
// won't reappear in that browser (same one-and-done behaviour the old
// EmailCapture modal had via localStorage).

"use client";

import { useState, useEffect, FormEvent } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { onModuleAction, onOpenSignUpModal } from "@/lib/track-module-action";

const MODULE_ROUTES = ["/tactics", "/opponent", "/sandbox", "/simulator", "/chat", "/fpl"];
const DWELL_MS = 3 * 60 * 1000; // 3 minutes
const STORAGE_KEY = "tactica_signup_modal_handled";

type Mode = "signup" | "signin";

export default function SignUpModal() {
  const { user, signIn, signUp } = useAuth();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const alreadyHandled = () =>
    typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEY);

  // Trigger A: 3 minutes of dwell time on a module page.
  useEffect(() => {
    if (user || alreadyHandled()) return;
    if (!MODULE_ROUTES.includes(pathname)) return;

    const timer = setTimeout(() => setIsOpen(true), DWELL_MS);
    return () => clearTimeout(timer);
  }, [pathname, user]);

  // Trigger B: fires the moment a module action completes successfully.
  useEffect(() => {
    if (user || alreadyHandled()) return;
    return onModuleAction(() => setIsOpen(true));
  }, [user]);

  // Trigger C: the "Sign in / Sign up" button in the navbar. This one
  // ignores the "already handled" flag — a person deliberately clicking
  // it wants the modal regardless of whether they dismissed the nudge
  // before, and opens straight into sign-in mode since they already know
  // what they want (no need for the "you've been running the numbers"
  // sales copy).
  useEffect(() => {
    if (user) return;
    return onOpenSignUpModal(() => {
      setMode("signin");
      setSuccess(false);
      setError("");
      setIsOpen(true);
    });
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      setSuccess(true);
      localStorage.setItem(STORAGE_KEY, "true");
      setTimeout(() => setIsOpen(false), 1800);
    } catch (err: any) {
      setError(friendlyError(err?.code) ?? err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 bg-sur border border-bd rounded-2xl shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-mt hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className="text-volt text-xs font-bold tracking-widest uppercase mb-2 font-body">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </p>
        <h3 className="font-display font-black text-2xl text-white mb-2">
          {mode === "signup" ? "Keep your tactics saved" : "Sign in to Tactica"}
        </h3>
        <p className="text-sm text-mt mb-6 font-body leading-relaxed">
          {mode === "signup"
            ? "You've been running the numbers for a bit. Create a free account so your analysis sticks around next time you're back."
            : "Sign in to pick up where you left off."}
        </p>

        {success ? (
          <div className="p-4 text-center text-volt border border-volt/30 bg-volt/10 rounded-xl font-body">
            {mode === "signup" ? "You're in. Welcome to Tactica." : "Signed in. Good to have you back."}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="px-4 py-3 rounded-xl bg-bg border border-bd text-white placeholder:text-mt2 focus:outline-none focus:border-volt transition-colors font-body"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="px-4 py-3 rounded-xl bg-bg border border-bd text-white placeholder:text-mt2 focus:outline-none focus:border-volt transition-colors font-body"
            />

            {error && <p className="text-red text-xs font-body">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-volt text-bg font-body font-bold hover:bg-volt2 transition-all disabled:opacity-60"
            >
              {loading ? "Working on it..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError("");
              }}
              className="text-xs text-mt hover:text-cyan transition-colors font-body text-center mt-1"
            >
              {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function friendlyError(code?: string): string | null {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email's already registered, try signing in instead.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email.";
    case "auth/weak-password":
      return "Password needs to be at least 6 characters.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Wrong email or password.";
    case "auth/user-not-found":
      return "No account found with that email.";
    default:
      return null;
  }
}