"use client";
import { useState } from "react";
import TeamSelect from "@/components/TeamSelect";
import ErrorBox from "@/components/ErrorBox";
import { EUROPEAN_TEAMS } from "@/lib/api";

// Normalise prob values (0-1 or 0-100)
const fmtProb = (v: number) => (v <= 1 ? (v * 100).toFixed(1) : v.toFixed(1));

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://tactica-backend-hdbd.onrender.com";

interface Fixture {
  gameweek:    number | null;
  date:        string;
  date_iso:    string;
  opponent:    string;
  venue:       "H" | "A";
  opp_defence: number;
  fdr:         number;
  fdr_label:   "Easy" | "Medium" | "Hard";
  fdr_colour:  "green" | "amber" | "red";
}

interface TickerResponse {
  team:     string;
  bsd_name: string;
  fixtures: Fixture[];
  cached:   boolean;
}

// FDR colour → CSS class
const FDR_CLASSES: Record<string, string> = {
  green: "bg-grn/15 border-grn/40 text-grn",
  amber: "bg-amber/15 border-amber/40 text-amber",
  red:   "bg-red/15 border-red/40 text-red",
};

const FDR_DOT: Record<string, string> = {
  green: "bg-grn",
  amber: "bg-amber",
  red:   "bg-red",
};

// Premier League teams only for FPL
const PL_TEAMS = EUROPEAN_TEAMS.filter(t =>
  [
    "Arsenal","Aston Villa","Bournemouth","Brentford","Brighton",
    "Chelsea","Crystal Palace","Everton","Fulham","Ipswich",
    "Leicester City","Liverpool","Manchester City","Manchester United",
    "Newcastle United","Nottingham Forest","Southampton",
    "Tottenham Hotspur","West Ham United","Wolverhampton",
    // 2025-26 promoted
    "Sunderland","Leeds United","Sheffield United",
  ].includes(t)
);

export default function FplPage() {
  const [team,    setTeam]    = useState("Arsenal");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [data,    setData]    = useState<TickerResponse | null>(null);
  const [gws,     setGws]     = useState(6);

  async function fetchTicker() {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/fpl/fixtures?team=${encodeURIComponent(team)}&gws=${gws}`
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(e.detail || `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load fixtures.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-screen-md mx-auto px-5 py-10 space-y-6">

      {/* Header */}
      <div>
        <p className="section-label mb-2">FPL Scout · Step 1</p>
        <h1 className="font-display font-black text-3xl text-white mb-1">
          Fixture Ticker
        </h1>
        <p className="text-mt text-sm leading-relaxed">
          Pick any Premier League club to see their next fixtures rated by difficulty.
          Green = blank that gameweek or easy opponent · Red = avoid their players.
        </p>
      </div>

      {/* Controls */}
      <div className="card space-y-4">
        <div>
          <TeamSelect
            label="Your FPL Club"
            teams={PL_TEAMS}
            value={team}
            onChange={setTeam}
            placeholder="Search Premier League clubs…"
          />
        </div>

        {/* GW count toggle */}
        <div>
          <p className="section-label mb-2">Gameweeks to show</p>
          <div className="flex gap-2">
            {[5, 6, 8, 10].map(n => (
              <button
                key={n}
                onClick={() => setGws(n)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                  gws === n
                    ? "bg-volt/10 border-volt/40 text-volt"
                    : "border-bd text-mt hover:border-volt/30"
                }`}
              >
                GW{n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchTicker}
          disabled={loading}
          className="btn-volt w-full py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin text-base">⚡</span> Loading fixtures…</>
          ) : (
            <><span>📅</span> Get Fixture Ticker</>
          )}
        </button>
      </div>

      <ErrorBox msg={error} />

      {/* Results */}
      {data && (
        <div className="space-y-4">

          {/* Team header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-white">{data.team}</h2>
              <p className="text-mt text-xs">Next {data.fixtures.length} fixtures · FDR rated</p>
            </div>
            {data.cached && (
              <span className="text-mt text-[10px] font-mono border border-bd px-2 py-0.5 rounded-full">
                📦 cached
              </span>
            )}
          </div>

          {/* FDR legend */}
          <div className="flex gap-3 text-xs text-mt">
            {[
              { colour:"green", label:"Easy (FDR 1-2)" },
              { colour:"amber", label:"Medium (FDR 3)" },
              { colour:"red",   label:"Hard (FDR 4-5)" },
            ].map(({ colour, label }) => (
              <div key={colour} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${FDR_DOT[colour]}`} />
                {label}
              </div>
            ))}
          </div>

          {/* Fixture rows */}
          <div className="space-y-2">
            {data.fixtures.map((fix, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${FDR_CLASSES[fix.fdr_colour]}`}
              >
                {/* FDR dot */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${FDR_DOT[fix.fdr_colour]}`} />

                {/* GW + Date */}
                <div className="w-16 flex-shrink-0">
                  {fix.gameweek && (
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                      GW{fix.gameweek}
                    </p>
                  )}
                  <p className="text-xs font-bold">{fix.date}</p>
                </div>

                {/* Venue badge */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 border ${
                  fix.venue === "H"
                    ? "bg-volt/10 border-volt/30 text-volt"
                    : "bg-white/5 border-white/15 text-mt"
                }`}>
                  {fix.venue}
                </div>

                {/* Opponent */}
                <p className="flex-1 font-bold text-sm">
                  vs {fix.opponent}
                </p>

                {/* Opponent defence */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] opacity-60 uppercase tracking-wider">Opp Def</p>
                  <p className="text-sm font-bold">{fix.opp_defence}</p>
                </div>

                {/* FDR badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg flex-shrink-0 border ${FDR_CLASSES[fix.fdr_colour]}`}>
                  {fix.fdr}
                </div>
              </div>
            ))}
          </div>

          {/* FDR summary insight */}
          <div className="card border-volt/20">
            <p className="section-label mb-2">📊 Quick Read</p>
            <p className="text-sm text-white leading-relaxed">
              {(() => {
                const easy  = data.fixtures.filter(f => f.fdr_colour === "green").length;
                const hard  = data.fixtures.filter(f => f.fdr_colour === "red").length;
                const total = data.fixtures.length;
                if (easy >= total * 0.6)
                  return `${data.team} have a great run of fixtures — ${easy} of ${total} are rated easy. Strong week to bring in their attackers.`;
                if (hard >= total * 0.6)
                  return `Tough run ahead for ${data.team} — ${hard} of ${total} fixtures are rated hard. Consider selling their players before GW${data.fixtures[0].gameweek ?? ""}.`;
                return `${data.team} have a mixed run — ${easy} easy, ${total - easy - hard} medium, ${hard} hard fixture${hard !== 1 ? "s" : ""} in the next ${total} gameweeks.`;
              })()}
            </p>
          </div>

          {/* Coming soon teaser */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon:"🎯", title:"Captain Pick",        status:"Coming soon" },
              { icon:"🔄", title:"Transfer Recommender", status:"Coming soon" },
              { icon:"💡", title:"Differential Finder",  status:"Coming soon" },
            ].map(({ icon, title, status }) => (
              <div key={title} className="card opacity-50 text-center py-4">
                <p className="text-2xl mb-1">{icon}</p>
                <p className="text-white text-xs font-bold">{title}</p>
                <p className="text-mt text-[10px] mt-0.5">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
