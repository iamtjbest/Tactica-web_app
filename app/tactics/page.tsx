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
        <div className="card space-y-4">
          <div>
            <p className="section-label mb-1">👕 Recommended Starting XI</p>
            <p className="text-volt font-display font-bold text-xl">{lineup.formation}</p>
          </div>

          <div className="space-y-2">
            {lineup.xi.map((p, i) => <PlayerCard key={i} player={p} />)}
          </div>

          {lineup.xi.some(p => p.fallback) && (
            <p className="text-amber text-xs bg-amber/10 border border-amber/20 rounded-xl p-3">
              ⚠️ Some slots filled with best available — load the full squad in Coach&apos;s Sandbox to refine player stats.
            </p>
          )}

          <div className="bg-bg border border-bd rounded-xl p-4 text-xs space-y-2 text-mt">
            <p className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>📐</span> How Starting XI Selection &amp; Ranking Works
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">1. Tactical Mapping:</strong> Slots (GK, DF, MF, FW) are dynamically allocated based on the selected formation ({lineup.formation}). In 3+ forward setups (e.g. 4-3-3), wingers fill wide FW positions.
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">2. Selection Formula:</strong> Players are ranked within their natural positional group by <strong className="text-volt">Season Minutes Played (⏱)</strong> and <strong className="text-volt">Goal Contributions (⚽ G+A)</strong> to ensure match-fit, high-impact starters.
            </p>
          </div>
        </div>
      )}

      {predict && (
        <a
          href={`/chat?my_team=${encodeURIComponent(myTeam)}&opp_team=${encodeURIComponent(oppTeam)}`}
          className="card flex items-center gap-3 border-cyan/20 hover:border-cyan/40 transition-colors group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-lg flex-shrink-0">💬</div>
          <div>
            <p className="text-white font-bold text-sm group-hover:text-cyan transition-colors">
              Chat with AI about {myTeam} vs {oppTeam}
            </p>
            <p className="text-mt text-xs mt-0.5">
              The assistant will automatically check for a live match and know the current score.
            </p>
          </div>
          <span className="ml-auto text-mt group-hover:text-cyan transition-colors">→</span>
        </a>
      )}
    </div>
  );
}
