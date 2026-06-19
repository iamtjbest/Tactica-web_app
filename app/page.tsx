import Link from "next/link";

const MODULES = [
  {
    href: "/tactics",
    icon: "⚡",
    title: "Auto-Tactics",
    desc: "Fetches last 5 real matches from BSD API, computes live attack/defence ratings, and recommends the optimal formation + Starting XI.",
    pill: "Module 1",
  },
  {
    href: "/opponent",
    icon: "📊",
    title: "Opponent Analysis",
    desc: "Head-to-head rating comparison, recent form, and an AI scout report with plain-language tactical guidance for the specific matchup.",
    pill: "Module 2",
  },
  {
    href: "/sandbox",
    icon: "🧠",
    title: "Coach's Sandbox",
    desc: "Pick your formation, manually draft your Starting XI from the real squad, and get an AI win-probability estimate for your game plan.",
    pill: "Module 3",
  },
  {
    href: "/simulator",
    icon: "⏱️",
    title: "Live Simulator",
    desc: "Set the match minute and current scoreline. The AI returns real-time tactical advice — hold shape, push forward, or protect the lead.",
    pill: "Module 4",
  },
  {
    href: "/chat",
    icon: "💬",
    title: "AI Tactical Chat",
    desc: "Sync a live score from any competition worldwide, then ask the AI assistant manager anything. It knows your squad and the live context.",
    pill: "Module 5",
  },
  {
    href: "/nations",
    icon: "🌍",
    title: "World Cup 2026",
    desc: "All 48 nations. Player scores derived from club form, match ratings, caps, and age — weighted by league quality — powering true international analysis.",
    pill: "Module 6",
  },
];

export default function Home() {
  return (
    <div className="hex-bg min-h-[calc(100vh-70px)]">
      {/* Hero */}
      <div className="max-w-screen-xl mx-auto px-5 pt-24 pb-16 text-center">
        <p className="section-label mb-5">Football Intelligence Engine</p>
        <h1
          className="font-display font-black text-white mb-6 leading-tight"
          style={{ fontSize: "clamp(42px, 8vw, 80px)", textShadow: "0 0 60px rgba(204,255,0,0.18)" }}>
          The AI brain behind<br/>
          <span className="text-volt italic">every great formation.</span>
        </h1>
        <p className="text-mt text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          ML-powered formation prediction · BSD live match data · Gemini AI tactical chat<br/>
          130+ clubs · 48 World Cup 2026 nations · 100% free
        </p>
        <Link href="/tactics" className="btn-volt inline-flex items-center gap-2 text-base px-8 py-4">
          Start Analysing
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>

      {/* Module grid */}
      <div className="max-w-screen-xl mx-auto px-5 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map(({ href, icon, title, desc, pill }) => (
            <Link key={href} href={href}
              className="card hover:border-volt/40 hover:bg-sur2 transition-all duration-200 group block">
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{icon}</span>
                <span className="font-mono text-[10px] text-mt border border-bd px-2 py-0.5 rounded-full tracking-wider">{pill}</span>
              </div>
              <h2 className="font-display font-bold text-lg text-white mb-2 group-hover:text-volt transition-colors">{title}</h2>
              <p className="text-mt text-sm leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
