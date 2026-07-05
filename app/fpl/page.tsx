"use client";
import { useState } from "react";
import TeamSelect from "@/components/TeamSelect";
import ErrorBox from "@/components/ErrorBox";
import { EUROPEAN_TEAMS } from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://tactica-backend-hdbd.onrender.com";

interface Fixture {
  gameweek: number | null;
  date: string;
  date_iso: string;
  opponent: string;
  venue: "H" | "A";
  opp_defence: number;
  fdr: number;
  fdr_label: "Easy" | "Medium" | "Hard";
  fdr_colour: "green" | "amber" | "red";
}

interface TickerResponse {
  team: string;
  bsd_name: string;
  fixtures: Fixture[];
  cached: boolean;
}

const FDR_CLASSES: Record<string, string> = {
  green: "bg-grn/15 border-grn/40 text-grn",
  amber: "bg-amber/15 border-amber/40 text-amber",
  red: "bg-red/15 border-red/40 text-red",
};

const FDR_DOT: Record<string, string> = {
  green: "bg-grn",
  amber: "bg-amber",
  red: "bg-red",
};

const PL_TEAMS = EUROPEAN_TEAMS.filter(t =>
  [
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
    "Chelsea", "Coventry City", "Crystal Palace", "Everton", "Fulham",
    "Hull City", "ipswitch Town", "Leeds united", "Liverpool", "Manchester City",
    "Manchester United", "Newcastle United", "Nottingham Forest", "Sunderland", "Tottenham Hotspur"
  ].includes(t)
);

export default function FplPage() {
  const [team, setTeam] = useState("Arsenal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<TickerResponse | null>(null);

  // Always fetch all remaining GWs (max 38 per season)
  const GWS = 38;

  async function fetchTicker() {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/fpl/fixtures?team=${encodeURIComponent(team)}&gws=${GWS}`
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        let errMsg = `Error ${res.status}`;
        if (typeof e.detail === "string") {
          errMsg = e.detail;
        } else if (Array.isArray(e.detail)) {
          errMsg = e.detail.map((err: any) => err.msg || JSON.stringify(err)).join(", ");
        } else if (e.detail) {
          errMsg = JSON.stringify(e.detail);
        }
        throw new Error(errMsg);
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
          Pick any Premier League club to see all remaining fixtures rated by difficulty.
          Green = target their attackers · Red = sell before it hits.
        </p>
      </div>

      {/* Controls */}
      <div className="card space-y-4">
        <TeamSelect
          label="Your FPL Club"
          teams={PL_TEAMS}
          value={team}
          onChange={setTeam}
        />

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
              <p className="text-mt text-xs">
                {data.fixtures.length} remaining fixtures · FDR rated
              </p>
            </div>
            {data.cached && (
              <span className="text-mt text-[10px] font-mono border border-bd px-2 py-0.5 rounded-full">
                📦 cached
              </span>
            )}
          </div>

          {/* FDR legend */}
          <div className="flex gap-4 text-xs text-mt">
            {[
              { colour: "green", label: "Easy (1–2)" },
              { colour: "amber", label: "Medium (3)" },
              { colour: "red", label: "Hard (4–5)" },
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
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${FDR_DOT[fix.fdr_colour]}`} />

                {/* GW + Date */}
                <div className="w-16 flex-shrink-0">
                  {fix.gameweek != null && (
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                      GW{fix.gameweek}
                    </p>
                  )}
                  <p className="text-xs font-bold">{fix.date}</p>
                </div>

                {/* H/A badge */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 border ${fix.venue === "H"
                  ? "bg-volt/10 border-volt/30 text-volt"
                  : "bg-white/5 border-white/15 text-mt"
                  }`}>
                  {fix.venue}
                </div>

                {/* Opponent */}
                <p className="flex-1 font-bold text-sm">vs {fix.opponent}</p>

                {/* Opp defence */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] opacity-60 uppercase tracking-wider">Opp Def</p>
                  <p className="text-sm font-bold">{fix.opp_defence}</p>
                </div>

                {/* FDR number */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg flex-shrink-0 border ${FDR_CLASSES[fix.fdr_colour]}`}>
                  {fix.fdr}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Read summary */}
          <div className="card border-volt/20">
            <p className="section-label mb-2">📊 Quick Read</p>
            <p className="text-sm text-white leading-relaxed">
              {(() => {
                const easy = data.fixtures.filter(f => f.fdr_colour === "green").length;
                const hard = data.fixtures.filter(f => f.fdr_colour === "red").length;
                const total = data.fixtures.length;
                const firstHard = data.fixtures.find(f => f.fdr_colour === "red");
                const firstEasy = data.fixtures.find(f => f.fdr_colour === "green");
                if (easy >= Math.ceil(total * 0.6))
                  return `${data.team} have an excellent run — ${easy} of ${total} fixtures rated easy. Strong season to hold their attackers.`;
                if (hard >= Math.ceil(total * 0.6))
                  return `Tough season ahead for ${data.team} — ${hard} of ${total} fixtures rated hard. Be selective with their players.`;
                const nextStr = firstHard
                  ? ` Next tough fixture: ${firstHard.opponent} (${firstHard.date}).`
                  : "";
                return `${data.team} have a mixed schedule — ${easy} easy, ${total - easy - hard} medium, ${hard} hard fixture${hard !== 1 ? "s" : ""} remaining.${nextStr}`;
              })()}
            </p>
          </div>

          {/* Coming soon teasers */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: "🎯", title: "Captain Pick" },
              { icon: "🔄", title: "Transfer Recommender" },
              { icon: "💡", title: "Differential Finder" },
            ].map(({ icon, title }) => (
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
