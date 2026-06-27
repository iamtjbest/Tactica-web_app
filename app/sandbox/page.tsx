"use client";
import { useState } from "react";
import { api, type SquadPlayer, type PredictResponse } from "@/lib/api";
import TeamSelect from "@/components/TeamSelect";
import ErrorBox from "@/components/ErrorBox";
import StatCard from "@/components/StatCard";
import clsx from "clsx";


// Normalise 0-1 or 0-100 probability to display string
const fmtProb = (v: number) => (v <= 1 ? (v * 100).toFixed(1) : v.toFixed(1));

const FORMATIONS = [
  "3-4-3","3-5-2","3-4-1-2","3-2-4-1","3-4-2-1","3-3-1-3",
  "4-2-3-1","4-3-3","4-4-2","4-4-2 Diamond","4-1-4-1","4-3-2-1","4-2-2-2",
  "5-3-2","5-4-1","5-2-2-1","5-2-3",
];

const POS_COLOR: Record<string, string> = {
  GK: "text-amber",
  DF: "text-blue-400",
  MF: "text-volt",
  FW: "text-red",
};

export default function SandboxPage() {
  const [myTeam,    setMyTeam]    = useState("Arsenal");
  const [oppTeam,   setOppTeam]   = useState("Chelsea");
  const [formation, setFormation] = useState("4-3-3");
  const [squad,     setSquad]     = useState<SquadPlayer[]>([]);
  const [selected,  setSelected]  = useState<string[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(false);
  const [result,    setResult]    = useState<PredictResponse | null>(null);
  const [error,     setError]     = useState("");

  const busy = fetching || loading; // lock team selection during any in-flight request

  async function fetchSquad() {
    setFetching(true); setError(""); setSquad([]); setSelected([]);
    try {
      const res = await api.squad(myTeam);
      setSquad(res.players);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not fetch squad — team not in BSD yet");
    } finally { setFetching(false); }
  }

  function toggle(name: string) {
    setSelected(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : prev.length < 11 ? [...prev, name] : prev
    );
  }

  async function analyse() {
    if (selected.length < 11) { setError("Draft exactly 11 players before analysing."); return; }
    setLoading(true); setError("");
    try {
      // Fetch real form ratings for both teams so predict uses actual data, not fallback 80/80
      const [mf, of_] = await Promise.all([
        api.form(myTeam).catch(() => null),
        api.form(oppTeam).catch(() => null),
      ]);
      const pred = await api.predict({
        my_team:  myTeam,
        opp_team: oppTeam,
        my_att:   mf?.attack,
        my_def:   mf?.defence,
        opp_att:  of_?.attack,
        opp_def:  of_?.defence,
        familiarity_formation: formation,
        opp_habit_formation:   of_?.best_formation ?? undefined,
      });
      setResult(pred);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API error");
    } finally { setLoading(false); }
  }

  const byPos: Record<string, SquadPlayer[]> = { GK: [], DF: [], MF: [], FW: [] };
  squad.forEach(p => { if (byPos[p.Pos]) byPos[p.Pos].push(p); });

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-10 space-y-6">
      <div>
        <p className="section-label mb-2">🧠 Module 3</p>
        <h1 className="font-display font-black text-4xl text-white mb-2">Coach&apos;s Sandbox</h1>
        <p className="text-mt text-sm max-w-2xl">
          Pick your formation, load the real squad from BSD, draft your Starting XI manually,
          and get an AI win-probability estimate. Your tactics, validated by the ML model.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeamSelect label="Your Team" value={myTeam}  onChange={v => { setMyTeam(v); setSquad([]); setSelected([]); }} id="sb-my"  disabled={busy} />
        <TeamSelect label="Opponent"  value={oppTeam} onChange={setOppTeam} id="sb-opp" disabled={busy} />
      </div>

      <div>
        <label className="block text-mt text-xs font-semibold mb-2 tracking-wide uppercase">Your Preferred Formation</label>
        <div className="flex flex-wrap gap-2">
          {FORMATIONS.map(f => (
            <button key={f} onClick={() => setFormation(f)} disabled={busy}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-sm font-semibold font-mono border transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                formation === f
                  ? "bg-volt/10 text-volt border-volt/40"
                  : "text-mt border-bd hover:text-white hover:border-bd2"
              )}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <ErrorBox msg={error} />

      <button onClick={fetchSquad} disabled={busy}
        className="btn-outline w-full py-3 flex items-center justify-center gap-2">
        {fetching ? <><span className="animate-spin">⏳</span> Loading squad…</> : `📥 Load ${myTeam} Squad from BSD`}
      </button>

      {squad.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">Select Your XI ({selected.length}/11)</p>
            {selected.length > 0 && (
              <button onClick={() => setSelected([])} disabled={busy} className="text-mt text-xs hover:text-white transition-colors disabled:opacity-40">
                Clear all
              </button>
            )}
          </div>

          {(["GK","DF","MF","FW"] as const).map(pos => {
            const group = byPos[pos];
            if (!group.length) return null;
            return (
              <div key={pos} className="mb-5">
                <p className={`text-xs font-mono font-bold mb-2 tracking-widest uppercase ${POS_COLOR[pos]}`}>{pos}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.map(p => {
                    const isSelected = selected.includes(p.Name);
                    const badge = p.SpecPos && !["G","D","M","F"].includes(p.SpecPos) ? p.SpecPos : p.Pos;
                    return (
                      <button key={p.Name} onClick={() => toggle(p.Name)} disabled={busy}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                          isSelected
                            ? "bg-volt/10 border-volt/40 text-volt"
                            : "bg-bg border-bd text-mt hover:text-white hover:border-bd2"
                        )}>
                        <span className={clsx("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border",
                          isSelected ? "bg-volt/15 border-volt/30 text-volt" : "bg-sur border-bd text-mt2")}>
                          {badge}
                        </span>
                        <span className="text-sm font-semibold flex-1 truncate">{p.Name}</span>
                        {isSelected && <span className="text-volt text-base">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <button onClick={analyse} disabled={busy || selected.length < 11}
            className="btn-volt w-full mt-2 py-3 flex items-center justify-center gap-2">
            {loading ? <><span className="animate-spin">⏳</span> Analysing…</> : "⚙️ Analyse My Gameplan"}
          </button>

          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              <StatCard label="Your Formation"     value={formation} />
              <StatCard label="AI Win Probability" value={`${fmtProb(result.probability)}%`} />
              <StatCard label="vs Opponent"        value={oppTeam}   />
            </div>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="card">
          <p className="section-label mb-4">👕 Your Drafted XI — {formation}</p>
          <div className="space-y-2">
            {selected.map(name => {
              const p = squad.find(pl => pl.Name === name);
              const badge = p?.SpecPos && !["G","D","M","F"].includes(p.SpecPos) ? p.SpecPos : (p?.Pos ?? "?");
              return (
                <div key={name} className="flex items-center justify-between bg-bg border border-bd rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="pos-badge">{badge}</span>
                    <span className="text-white text-sm font-semibold">{name}</span>
                  </div>
                  {p && <span className="text-mt text-xs">⏱ {p.Min}m · ⚽ {p.G_A} G+A</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
