// lib/track-module-action.ts — module "run" signal (web)
//
// Each module page (Auto-Tactics, Opponent Analysis, Sandbox, Simulator,
// Chat, FPL Scout) calls trackModuleAction("<module>") once right after its
// main action succeeds (a prediction comes back, a lineup builds, a chat
// reply arrives, etc). SignUpModal listens via onModuleAction() and opens
// immediately on that signal, instead of waiting for the 3-minute dwell
// timer — the idea being: prompt right after the person has just seen the
// tool do something useful, not at an arbitrary time.
//
// This is a plain window CustomEvent rather than a shared library/context,
// so it works from any page with a two-line addition and no new provider.

const EVENT_NAME = "tactica:module-action";

export function trackModuleAction(moduleName: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, { detail: { module: moduleName } })
  );
}

export function onModuleAction(
  callback: (moduleName: string) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    callback((e as CustomEvent).detail?.module);
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
