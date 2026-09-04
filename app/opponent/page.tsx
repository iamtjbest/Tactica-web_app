"use client";
import { useState } from "react";
import { api, type FormResponse } from "@/lib/api";
import TeamSelect from "@/components/TeamSelect";
import FormTable from "@/components/FormTable";
import ErrorBox from "@/components/ErrorBox";

export default function OpponentPage() {
  const [myTeam,  setMyTeam]  = useState("Arsenal");
  const [oppTeam, setOppTeam] = useState("Borussia Dortmund");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [myForm,  setMyForm]  = useState<FormResponse | null>(null);
  const [oppForm, setOppForm] = useState<FormResponse | null>(null);

  async function run() {
    if (myTeam === oppTeam) { setError("Pick two different teams!"); return; }
    setLoading(true); setError(""); setMyForm(null); setOppForm(null);
    try {
      const [mf, of_] = await Promise.all([api.form(myTeam), api.form(oppTeam)]);
      setMyForm(mf); setOppForm(of_);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API error");
    } finally { setLoading(false); }
  }

  const tips: string[] = [];
  if (myForm && oppForm) {
    const mA = myForm.attack, mD = myForm.defence;
    const oA = oppForm.attack, oD = oppForm.defence;

    const myRecent  = myForm.matches.slice(0, 5);
    const oppRecent = oppForm.matches.slice(0, 5);
    const myW       = myRecent.filter(m => m.result === "W").length;
    const oppW      = oppRecent.filter(m => m.result === "W").length;
    const oppL      = oppRecent.filter(m => m.result === "L").length;
    const totalOpp  = oppRecent.length || 1;
    const totalMy   = myRecent.length || 1;
    const oppConceded = oppRecent.reduce((s, m) => s + m.conceded, 0) / totalOpp;
    const oppScored   = oppRecent.reduce((s, m) => s + m.scored, 0) / totalOpp;
    const myScored    = myRecent.reduce((s, m) => s + m.scored, 0) / totalMy;

    // Tactical scouting breakdown based on real BSD metrics
    if (mA > oD + 8) {
      tips.push(`🎯 Offensive Advantage — ${myTeam} (Attack: ${mA}) holds a strong edge over ${oppTeam}'s defensive structure (Defence: ${oD}). Exploit space behind their fullbacks early with direct wide passes.`);
    } else if (mA < oD - 5) {
      tips.push(`🧱 Compact Backline Ahead — ${oppTeam}'s defence (${oD}) is disciplined. Work through controlled buildup, set pieces, and second balls around the 18-yard box.`);
    }

    if (oA > mD + 8) {
      tips.push(`⚠️ Defensive Threat — ${oppTeam}'s attacking rating (${oA}) poses danger against our defence (${mD}). Maintain a compact mid-block and double-cover their primary wingers.`);
    } else if (mD > oA + 5) {
      tips.push(`🛡️ Defensive Superiority — ${myTeam}'s backline (${mD}) comfortably covers ${oppTeam}'s goal threat (${oA}). Fullbacks are free to support high line overlaps.`);
    }

    // Form breakdown (strictly out of last 5 matches)
    if (myW >= 4) {
      tips.push(`📈 High Momentum — ${myTeam} have won ${myW} of their last ${totalMy} matches in BSD fixtures. Squad confidence is high; maintain current tactical rhythm.`);
    }
    if (oppW >= 3) {
      tips.push(`📉 Opponent Form — ${oppTeam} have won ${oppW} of their last ${totalOpp} matches (scoring ${oppScored.toFixed(1)} goals/game). Exercise discipline in early transitions.`);
    } else if (oppL >= 3) {
      tips.push(`⚡ Vulnerable Form — ${oppTeam} have lost ${oppL} of their last ${totalOpp} matches. Press them high from kickoff to force defensive errors.`);
    }

    if (oppConceded >= 1.6) {
      tips.push(`🔓 Defensive Leakage — ${oppTeam} have been conceding ${oppConceded.toFixed(1)} goals per match in recent fixtures. Test their goalkeeper with early shots.`);
    }

    if (oppForm.best_formation && myForm.best_formation) {
      tips.push(`📐 Tactical Setup — ${oppTeam} frequently operate in a ${oppForm.best_formation} shape. Matching or countering with ${myTeam}'s preferred ${myForm.best_formation} provides optimal midfield coverage.`);
    }

    if (!tips.length) {
      tips.push(`⚖️ Balanced Matchup — ${myTeam} and ${oppTeam} present closely matched ratings (${mA}/${mD} vs ${oA}/${oD}). Midfield execution and set-piece efficiency will decide the result.`);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-10 space-y-6">
      <div>
        <p className="section-label mb-2">📊 Module 2</p>
        <h1 className="font-display font-black text-4xl text-white mb-2">Opponent Analysis</h1>
        <p className="text-mt text-sm max-w-2xl">
          Scout any opponent before the match. Compare live attack/defence ratings, recent form,
          and receive an AI-generated tactical briefing with specific advice for this matchup.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeamSelect label="Your Team" value={myTeam}  onChange={v => { setMyTeam(v);  setMyForm(null);  }} id="opp-my"  disabled={loading} />
        <TeamSelect label="Opponent"  value={oppTeam} onChange={v => { setOppTeam(v); setOppForm(null); }} id="opp-opp" disabled={loading} />
      </div>

      <ErrorBox msg={error} />

      <button onClick={run} disabled={loading} className="btn-volt w-full py-4 text-base flex items-center justify-center gap-2">
        {loading ? <><span className="animate-spin">⏳</span> Fetching…</> : "📡 Get Scout Report"}
      </button>

      {myForm && oppForm && (
        <>
          <div className="card">
            <p className="section-label mb-5">⚔️ Head-to-Head</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-mono text-[10px] text-mt uppercase tracking-wider mb-3">{myTeam}</p>
                <div className="space-y-2">
                  {[["⚔️ Attack", myForm.attack, true], ["🛡️ Defence", myForm.defence, false]].map(([lbl, val, isAtt]) => (
                    <div key={String(lbl)} className={`rounded-xl p-3 border ${isAtt ? "bg-volt/8 border-volt/20" : "bg-cyan/8 border-cyan/20"}`}>
                      <p className="text-[10px] text-mt mb-0.5">{String(lbl)}</p>
                      <p className={`font-display font-black text-3xl ${isAtt ? "text-volt" : "text-cyan"}`}>{String(val)}</p>
                      <p className="text-[10px] text-mt mt-0.5">
                        {isAtt
                          ? `${Number(val) - oppForm.defence > 0 ? "+" : ""}${Number(val) - oppForm.defence} vs opp def`
                          : `${Number(val) - oppForm.attack > 0 ? "+" : ""}${Number(val) - oppForm.attack} vs opp att`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <p className="font-display font-black text-4xl text-mt2">VS</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-mt uppercase tracking-wider mb-3">{oppTeam}</p>
                <div className="space-y-2">
                  {[["⚔️ Attack", oppForm.attack, true], ["🛡️ Defence", oppForm.defence, false]].map(([lbl, val, isAtt]) => (
                    <div key={String(lbl)} className={`rounded-xl p-3 border ${isAtt ? "bg-red/8 border-red/20" : "bg-bd/40 border-bd"}`}>
                      <p className="text-[10px] text-mt mb-0.5">{String(lbl)}</p>
                      <p className={`font-display font-black text-3xl ${isAtt ? "text-red" : "text-mt"}`}>{String(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

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

          <div className="card">
            <p className="section-label mb-4">📋 AI Scout Report</p>
            <div className="space-y-3">
              {tips.map((t, i) => (
                <div key={i} className="bg-bg border-l-2 border-l-volt rounded-xl px-4 py-3 text-sm text-white leading-relaxed">{t}</div>
              ))}
            </div>
            <p className="text-mt text-xs mt-4">
              Usual formations — {myTeam}: <span className="text-volt">{myForm.best_formation ?? "—"}</span>
              &nbsp;·&nbsp; {oppTeam}: <span className="text-volt">{oppForm.best_formation ?? "—"}</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
