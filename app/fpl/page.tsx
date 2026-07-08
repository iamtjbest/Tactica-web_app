"use client";
import { useState } from "react";
import TeamSelect from "@/components/TeamSelect";
import ErrorBox from "@/components/ErrorBox";
import { EUROPEAN_TEAMS } from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://tactica-backend-hdbd.onrender.com";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Fixture {
  gameweek: number | null; date: string; opponent: string;
  venue: "H" | "A"; opp_defence: number; fdr: number;
  fdr_label: string; fdr_colour: "green" | "amber" | "red";
}
interface TickerResponse { team: string; fixtures: Fixture[]; cached: boolean }

interface CaptainPick {
  name: string; position: string; market_value: number | null;
  form_score: number; weighted_score: number;
  apps_last5: number; avg_goals: number; avg_assists: number;
  avg_shots_on_target: number; avg_rating: number;
  next_fixture: { opponent: string; venue: string; date: string; fdr: number; fdr_label: string; fdr_colour: string };
  reason: string;
}
interface CaptainResponse {
  team: string; recommendation: string;
  next_fixture: CaptainPick["next_fixture"];
  picks: CaptainPick[]; cached: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FDR_BG: Record<string, string> = { green: "bg-grn/15 border-grn/40", amber: "bg-amber/15 border-amber/40", red: "bg-red/15 border-red/40" };
const FDR_TX: Record<string, string> = { green: "text-grn", amber: "text-amber", red: "text-red" };
const FDR_DOT: Record<string, string> = { green: "bg-grn", amber: "bg-amber", red: "bg-red" };

const PL_TEAMS = EUROPEAN_TEAMS.filter(t => [
  "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
  "Chelsea", "Crystal Palace", "Everton", "Fulham", "Ipswich",
  "Leicester City", "Liverpool", "Manchester City", "Manchester United",
  "Newcastle United", "Nottingham Forest", "Southampton",
  "Tottenham Hotspur", "West Ham United", "Wolverhampton",
  "Sunderland", "Leeds United", "Sheffield United",
].includes(t));

function fmtVal(eur: number | null): string {
  if (!eur) return "—";
  return eur >= 1_000_000 ? `£${(eur / 1_000_000).toFixed(1)}m` : `£${(eur / 1000).toFixed(0)}k`;
}

// ── Step 1 — Fixture Ticker ───────────────────────────────────────────────────

function FixtureTicker() {
  const [team, setTeam] = useState("Arsenal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<TickerResponse | null>(null);

  async function fetch_() {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch(`${API_BASE}/api/fpl/fixtures?team=${encodeURIComponent(team)}&gws=38`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(typeof e?.detail === "string" ? e.detail : `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <TeamSelect label="Premier League Club" teams={PL_TEAMS} value={team} onChange={setTeam} />
        <button onClick={fetch_} disabled={loading}
          className="btn-volt w-full py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><span className="animate-spin">⚡</span> Loading…</> : <>📅 Get Fixture Ticker</>}
        </button>
      </div>
      <ErrorBox msg={error} />
      {data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-white">{data.team}</h2>
              <p className="text-mt text-xs">{data.fixtures.length} remaining fixtures · FDR rated</p>
            </div>
            {data.cached && <span className="text-mt text-[10px] border border-bd px-2 py-0.5 rounded-full">📦 cached</span>}
          </div>
          {/* Legend */}
          <div className="flex gap-4 text-xs text-mt">
            {[["green", "Easy (1–2)"], ["amber", "Medium (3)"], ["red", "Hard (4–5)"]].map(([c, l]) => (
              <div key={c} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${FDR_DOT[c]}`} />{l}
              </div>
            ))}
          </div>
          {/* Rows */}
          <div className="space-y-2">
            {data.fixtures.map((fix, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${FDR_BG[fix.fdr_colour]}`}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${FDR_DOT[fix.fdr_colour]}`} />
                <div className="w-16 flex-shrink-0">
                  {fix.gameweek != null && <p className="text-[10px] font-bold uppercase opacity-60">GW{fix.gameweek}</p>}
                  <p className="text-xs font-bold">{fix.date}</p>
                </div>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black border flex-shrink-0 ${fix.venue === "H" ? "bg-volt/10 border-volt/30 text-volt" : "bg-white/5 border-white/15 text-mt"}`}>
                  {fix.venue}
                </div>
                <p className="flex-1 font-bold text-sm">vs {fix.opponent}</p>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] opacity-60 uppercase">Opp Def</p>
                  <p className="text-sm font-bold">{fix.opp_defence}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg border flex-shrink-0 ${FDR_BG[fix.fdr_colour]} ${FDR_TX[fix.fdr_colour]}`}>
                  {fix.fdr}
                </div>
              </div>
            ))}
          </div>
          {/* Quick read */}
          <div className="card border-volt/20">
            <p className="section-label mb-2">📊 Quick Read</p>
            <p className="text-sm text-white leading-relaxed">
              {(() => {
                const easy = data.fixtures.filter(f => f.fdr_colour === "green").length;
                const hard = data.fixtures.filter(f => f.fdr_colour === "red").length;
                const total = data.fixtures.length;
                if (easy >= Math.ceil(total * 0.6))
                  return `${data.team} have an excellent run — ${easy} of ${total} fixtures rated easy. Hold their attackers.`;
                if (hard >= Math.ceil(total * 0.6))
                  return `Tough run ahead for ${data.team} — ${hard} of ${total} fixtures rated hard. Sell before it hits.`;
                const fh = data.fixtures.find(f => f.fdr_colour === "red");
                return `${data.team}: ${easy} easy, ${total - easy - hard} medium, ${hard} hard.${fh ? ` Next tough: ${fh.opponent} (${fh.date}).` : ""}`;
              })()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2 — Captain Pick ─────────────────────────────────────────────────────

function CaptainPick() {
  const [team, setTeam] = useState("Arsenal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<CaptainResponse | null>(null);

  async function fetch_() {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch(`${API_BASE}/api/fpl/captain?team=${encodeURIComponent(team)}&top=5`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(typeof e?.detail === "string" ? e.detail : `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      {/* Explainer */}
      <p className="text-mt text-sm leading-relaxed">
        Picks the best captain from a club's attackers based on last 5 match stats
        (goals, assists, shots on target, rating) weighted by next fixture difficulty.
      </p>

      <div className="card space-y-4">
        <TeamSelect label="Pick a Club" teams={PL_TEAMS} value={team} onChange={setTeam} />
        <button onClick={fetch_} disabled={loading}
          className="btn-volt w-full py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><span className="animate-spin">🎯</span> Analysing squad…</> : <>🎯 Find Captain Pick</>}
        </button>
      </div>

      <ErrorBox msg={error} />

      {data && (
        <div className="space-y-4">
          {/* Top recommendation banner */}
          <div className="card border-volt/30 bg-volt/5 space-y-2">
            <p className="section-label">⚡ Recommendation</p>
            <p className="text-white font-bold text-sm leading-relaxed">{data.recommendation}</p>
            {/* Next fixture pill */}
            {data.next_fixture?.opponent && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${FDR_BG[data.next_fixture.fdr_colour]} ${FDR_TX[data.next_fixture.fdr_colour]}`}>
                <div className={`w-2 h-2 rounded-full ${FDR_DOT[data.next_fixture.fdr_colour]}`} />
                Next: {data.next_fixture.venue} vs {data.next_fixture.opponent} · {data.next_fixture.date} · FDR {data.next_fixture.fdr} ({data.next_fixture.fdr_label})
              </div>
            )}
          </div>

          {/* Player cards */}
          <div className="space-y-3">
            {data.picks.map((p, i) => (
              <div key={i} className={`card space-y-3 ${i === 0 ? "border-volt/30" : ""}`}>
                {/* Header row */}
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${i === 0 ? "bg-volt text-black" : "bg-white/5 text-mt border border-bd"
                    }`}>
                    {i === 0 ? "©" : i + 1}
                  </div>

                  {/* Name + position */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${i === 0 ? "text-volt" : "text-white"}`}>
                      {p.name}
                    </p>
                    <p className="text-mt text-xs">{p.position} · {fmtVal(p.market_value)}</p>
                  </div>

                  {/* Weighted score */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-mt uppercase tracking-wider">Score</p>
                    <p className={`text-lg font-black ${i === 0 ? "text-volt" : "text-white"}`}>
                      {p.weighted_score.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Avg Goals", value: p.avg_goals.toFixed(2) },
                    { label: "Avg Assists", value: p.avg_assists.toFixed(2) },
                    { label: "Avg SoT", value: p.avg_shots_on_target.toFixed(1) },
                    { label: "Avg Rating", value: p.avg_rating.toFixed(1) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/3 rounded-lg px-2 py-2 text-center border border-bd">
                      <p className="text-[10px] text-mt uppercase tracking-wider leading-tight">{label}</p>
                      <p className="text-white font-bold text-sm mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Reason */}
                <p className="text-mt text-xs leading-relaxed">{p.reason}</p>

                {/* Apps */}
                <p className="text-mt text-[10px]">Based on {p.apps_last5} appearance{p.apps_last5 !== 1 ? "s" : ""} (last 5 games, 45+ min)</p>
              </div>
            ))}
          </div>

          {/* Coming soon */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[{ icon: "🔄", title: "Transfer Recommender" }, { icon: "💡", title: "Differential Finder" }].map(({ icon, title }) => (
              <div key={title} className="card opacity-50 text-center py-4">
                <p className="text-2xl mb-1">{icon}</p>
                <p className="text-white text-xs font-bold">{title}</p>
                <p className="text-mt text-[10px] mt-0.5">Coming soon</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root page — tabbed ────────────────────────────────────────────────────────

const STEPS = [
  { id: "ticker", label: "📅 Fixture Ticker", pill: "Step 1" },
  { id: "captain", label: "🎯 Captain Pick", pill: "Step 2" },
];

export default function FplPage() {
  const [step, setStep] = useState<"ticker" | "captain">("ticker");

  return (
    <div className="max-w-screen-md mx-auto px-5 py-10 space-y-6">
      {/* Header */}
      <div>
        <p className="section-label mb-2">FPL Scout</p>
        <h1 className="font-display font-black text-3xl text-white mb-1">
          Fantasy Premier League
        </h1>
        <p className="text-mt text-sm leading-relaxed">
          Real BSD match data · Fixture difficulty ratings · AI-powered captain picks
        </p>
      </div>

      {/* Step tabs */}
      <div className="flex gap-2">
        {STEPS.map(s => (
          <button
            key={s.id}
            onClick={() => setStep(s.id as any)}
            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${step === s.id
              ? "bg-volt/10 border-volt/40 text-volt"
              : "border-bd text-mt hover:border-volt/20 hover:text-white"
              }`}
          >
            <span className="block text-[10px] opacity-60 mb-0.5">{s.pill}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Active step */}
      {step === "ticker" && <FixtureTicker />}
      {step === "captain" && <CaptainPick />}
    </div>
  );
}
