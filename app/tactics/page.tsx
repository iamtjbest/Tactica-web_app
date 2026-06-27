"use client";
import { useState } from "react";
import { api, type FormResponse, type PredictResponse, type LineupResponse } from "@/lib/api";
import TeamSelect from "@/components/TeamSelect";
import FormTable from "@/components/FormTable";
import FormationBar from "@/components/FormationBar";
import PlayerCard from "@/components/PlayerCard";
import StatCard from "@/components/StatCard";
import ErrorBox from "@/components/ErrorBox";


// Normalise 0-1 or 0-100 probability to display string
const fmtProb = (v: number) => (v <= 1 ? (v * 100).toFixed(1) : v.toFixed(1));

export default function TacticsPage() {
  const [myTeam,  setMyTeam]  = useState("Arsenal");
  const [oppTeam, setOppTeam] = useState("Chelsea");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [myForm,  setMyForm]  = useState<FormResponse | null>(null);
  const [oppForm, setOppForm] = useState<FormResponse | null>(null);
  const [predict, setPredict] = useState<PredictResponse | null>(null);
  const [lineup,  setLineup]  = useState<LineupResponse | null>(null);

  async function run() {
    if (myTeam === oppTeam) { setError("A team cannot face itself!"); return; }
    setLoading(true); setError(""); setPredict(null); setLineup(null);
    try {
      const [mf, of_] = await Promise.all([api.form(myTeam), api.form(oppTeam)]);
      setMyForm(mf); setOppForm(of_);

      const pred = await api.predict({
        my_team: myTeam,
        opp_team: oppTeam,
        my_att: mf.attack,
        my_def: mf.defence,
        opp_att: of_.attack,
        opp_def: of_.defence,
        familiarity_formation: mf.best_formation ?? undefined,
        opp_habit_formation:   of_.best_formation ?? undefined,
      });
      setPredict(pred);

      try {
        setLineup(await api.lineup(myTeam, pred.best_formation));
      } catch {
        // Squad may not be loaded yet — non-fatal
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API error — check your backend URL in .env.local");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-10 space-y-6">
      <div>
        <p className="section-label mb-2">⚡ Module 1</p>
        <h1 className="font-display font-black text-4xl text-white mb-2">Auto-Tactics</h1>
        <p className="text-mt text-sm leading-relaxed max-w-2xl">
          Select two teams. The engine fetches their last 5 matches via BSD API, extracts real
          formations used, calculates dynamic attack/defence ratings from actual results, then
          recommends the optimal game plan. Covers 130+ European clubs and all 48 WC 2026 nations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeamSelect label="Your Team" value={myTeam}  onChange={setMyTeam}  id="my-team"  disabled={loading} />
        <TeamSelect label="Opponent"  value={oppTeam} onChange={setOppTeam} id="opp-team" disabled={loading} />
      </div>

      <ErrorBox msg={error} />

      <button onClick={run} disabled={loading} className="btn-volt w-full text-base py-4 flex items-center justify-center gap-2">
        {loading
          ? (<><span className="animate-spin">⏳</span> Fetching matches &amp; generating tactics…</>)
          : (<>🔍 Fetch Last 5 Matches &amp; Generate Optimal Tactics</>)
        }
      </button>

      {myForm && oppForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card">
            <FormTable matches={myForm.matches} teamName={myTeam}
              attack={myForm.attack} defence={myForm.defence} cached={myForm.cached} />
          </div>
          <div className="card">
            <FormTable matches={oppForm.matches} teamName={oppTeam}
              attack={oppForm.attack} defence={oppForm.defence} cached={oppForm.cached} />
          </div>
        </div>
      )}

      {predict && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="✅ Recommended Formation" value={predict.best_formation} />
            <StatCard label="🤖 AI Win Probability" value={`${fmtProb(predict.probability)}%`} />
            <StatCard label="📐 Opp. Usual Formation" value={oppForm?.best_formation ?? "—"} />
          </div>

          <div className="card">
            <p className="section-label mb-5">🏆 Formation Win-Probability Ranking</p>
            <FormationBar items={predict.all_formations} />
          </div>
        </div>
      )}

      {lineup && (
        <div className="card">
          <p className="section-label mb-1">👕 Recommended Starting XI</p>
          <p className="text-volt font-display font-bold text-xl mb-4">{lineup.formation}</p>
          <div className="space-y-2">
            {lineup.xi.map((p, i) => <PlayerCard key={i} player={p} />)}
          </div>
          {lineup.xi.some(p => p.fallback) && (
            <p className="text-mt text-xs mt-3">
              ⚠️ Some slots filled with best available — fetch the squad first for a precise XI.
              Go to Coach&apos;s Sandbox → load squad → come back.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
