"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import { Zap, BarChart2, Brain, Clock, MessageCircle, Target, Globe, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { openSignUpModal } from "@/lib/track-module-action";

const NAV = [
  { href: "/tactics", label: "Auto-Tactics", icon: Zap },
  { href: "/opponent", label: "Opponent Analysis", icon: BarChart2 },
  { href: "/sandbox", label: "Coach's Sandbox", icon: Brain },
  { href: "/simulator", label: "Live Simulator", icon: Clock },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
  { href: "/fpl", label: "FPL Scout", icon: Target },
  { href: "/nations", label: "Nations", icon: Globe },
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <>
      <nav className="border-b border-bd bg-sur/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-5 flex items-center justify-between h-[70px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-volt to-cyan flex items-center justify-center font-display font-black text-bg text-lg">T</div>
            <div>
              <p className="font-display font-black text-xl text-white leading-none tracking-tight">Tactica</p>
              <p className="font-mono text-[9px] tracking-[0.2em] text-mt uppercase">Engine</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200",
                  path.startsWith(href)
                    ? "bg-volt/10 text-volt border border-volt/25"
                    : "text-mt hover:text-white hover:bg-sur2"
                )}>
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop auth control */}
          <div className="hidden lg:flex items-center gap-2 ml-3">
            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-bd">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sur2 border border-bd text-xs text-mt max-w-[160px]">
                  <UserIcon size={13} className="text-volt flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  className="p-2 rounded-xl text-mt hover:text-white hover:bg-sur2 transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openSignUpModal()}
                className="ml-1 px-4 py-2 rounded-xl text-[13px] font-bold bg-volt text-bg hover:bg-volt2 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)}
            className="lg:hidden flex flex-col gap-1.5 p-2">
            <span className={clsx("w-5 h-0.5 bg-white rounded transition-all", open && "rotate-45 translate-y-2")} />
            <span className={clsx("w-5 h-0.5 bg-white rounded transition-all", open && "opacity-0")} />
            <span className={clsx("w-5 h-0.5 bg-white rounded transition-all", open && "-rotate-45 -translate-y-2")} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-bg/98 backdrop-blur-xl flex flex-col items-center justify-center gap-4" onClick={() => setOpen(false)}>
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