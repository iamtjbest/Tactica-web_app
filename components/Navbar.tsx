"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";

const NAV = [
  { href: "/tactics",   label: "Auto-Tactics",      icon: "⚡" },
  { href: "/opponent",  label: "Opponent Analysis",  icon: "📊" },
  { href: "/sandbox",   label: "Coach's Sandbox",    icon: "🧠" },
  { href: "/simulator", label: "Live Simulator",     icon: "⏱️" },
  { href: "/chat",      label: "AI Chat",            icon: "💬" },
  { href: "/nations",   label: "World Cup 2026",     icon: "🌍" },
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

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
            {NAV.map(({ href, label, icon }) => (
              <Link key={href} href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200",
                  path.startsWith(href)
                    ? "bg-volt/10 text-volt border border-volt/25"
                    : "text-mt hover:text-white hover:bg-sur2"
                )}>
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
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
          {NAV.map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className={clsx(
                "flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-display font-bold transition-all",
                path.startsWith(href) ? "text-volt" : "text-mt hover:text-white"
              )}>
              <span>{icon}</span><span>{label}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
