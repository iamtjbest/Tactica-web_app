"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState, useRef, useEffect } from "react";
import { Zap, BarChart2, Brain, Clock, MessageCircle, Target, Globe, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { openSignUpModal } from "@/lib/track-module-action";

const NAV = [
  { href: "/tactics", label: "Auto-Tactics", short: "Auto-Tactics", icon: Zap },
  { href: "/opponent", label: "Opponent Analysis", short: "Opponent", icon: BarChart2 },
  { href: "/sandbox", label: "Coach's Sandbox", short: "Sandbox", icon: Brain },
  { href: "/simulator", label: "Live Simulator", short: "Simulator", icon: Clock },
  { href: "/chat", label: "AI Chat", short: "Chat", icon: MessageCircle },
  { href: "/fpl", label: "FPL Scout", short: "FPL Scout", icon: Target },
  { href: "/nations", label: "Nations", short: "Nations", icon: Globe },
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  // Close the account dropdown on an outside click.
  useEffect(() => {
    if (!accountOpen) return;
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [accountOpen]);

  return (
    <>
      <nav className="border-b border-bd bg-sur/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-5 flex items-center justify-between h-[70px] gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-volt to-cyan flex items-center justify-center font-display font-black text-bg text-lg">T</div>
            <div className="hidden sm:block">
              <p className="font-display font-black text-xl text-white leading-none tracking-tight">Tactica</p>
              <p className="font-mono text-[9px] tracking-[0.2em] text-mt uppercase">Engine</p>
            </div>
          </Link>

          {/* Desktop nav — only at xl+, so it never fights the logo + account control for space */}
          <div className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map(({ href, short, icon: Icon }) => (
              <Link key={href} href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 whitespace-nowrap",
                  path.startsWith(href)
                    ? "bg-volt/10 text-volt border border-volt/25"
                    : "text-mt hover:text-white hover:bg-sur2"
                )}>
                <Icon size={16} />
                <span>{short}</span>
              </Link>
            ))}
          </div>

          {/* Account control — compact on all sizes, details live in a dropdown */}
          <div className="relative flex-shrink-0" ref={accountRef}>
            {user ? (
              <>
                <button
                  onClick={() => setAccountOpen(v => !v)}
                  className="flex items-center gap-1 p-2 rounded-xl text-mt hover:text-white hover:bg-sur2 transition-colors"
                  aria-label="Account"
                >
                  <UserIcon size={17} className="text-volt" />
                  <ChevronDown size={13} className={clsx("transition-transform", accountOpen && "rotate-180")} />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-sur border border-bd rounded-xl shadow-2xl p-2 z-50">
                    <div className="px-2.5 py-2 text-xs text-mt truncate border-b border-bd mb-1">
                      {user.email}
                    </div>
                    <button
                      onClick={() => { signOut(); setAccountOpen(false); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-mt hover:text-white hover:bg-sur2 transition-colors"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => openSignUpModal()}
                className="px-3.5 py-2 rounded-xl text-[13px] font-bold bg-volt text-bg hover:bg-volt2 transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Hamburger — shown any time the full desktop nav isn't (below xl) */}
          <button onClick={() => setOpen(!open)}
            className="xl:hidden flex flex-col gap-1.5 p-2 flex-shrink-0">
            <span className={clsx("w-5 h-0.5 bg-white rounded transition-all", open && "rotate-45 translate-y-2")} />
            <span className={clsx("w-5 h-0.5 bg-white rounded transition-all", open && "opacity-0")} />
            <span className={clsx("w-5 h-0.5 bg-white rounded transition-all", open && "-rotate-45 -translate-y-2")} />
          </button>
        </div>
      </nav>

      {/* Mobile / tablet menu (below xl) */}
      {open && (
        <div className="xl:hidden fixed inset-0 z-40 bg-bg/98 backdrop-blur-xl flex flex-col items-center justify-center gap-4" onClick={() => setOpen(false)}>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={clsx(
                "flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-display font-bold transition-all",
                path.startsWith(href) ? "text-volt" : "text-mt hover:text-white"
              )}>
              <Icon size={22} /><span>{label}</span>
            </Link>
          ))}

          <div className="mt-4 pt-6 border-t border-bd w-64 flex flex-col items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-mt">
                  <UserIcon size={15} className="text-volt" />
                  <span className="truncate max-w-[200px]">{user.email}</span>
                </div>
                <button
                  onClick={() => { signOut(); setOpen(false); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-mt border border-bd hover:text-white transition-colors"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => { openSignUpModal(); setOpen(false); }}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-volt text-bg hover:bg-volt2 transition-colors"
              >
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}