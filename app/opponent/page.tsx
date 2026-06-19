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

  // AI scout tips derived from live ratings
  const tips: string[] = [];
  if (myForm && oppForm) {
    const mA = myForm.attack, mD = myForm.defence;
    const oA = oppForm.attack, oD = oppForm.defence;
    if (mA > oD + 10)  tips.push("🎯 Offensive Dominance — our attack significantly outrates their defence. High press, direct play, exploit channels behind their fullbacks from the first whistle.");
    if (mA < oD)       tips.push("🧱 Solid Defence Ahead — their backline is well organised. Focus on wide overloads, set-piece delivery, and long-range efforts to open them up.");
    if (oA > mD + 10)  tips.push("⚠️ Defensive Alert — their attack is dangerous against our defence. A double pivot is essential. Do not play a high line — sit deep and hit on the counter.");
    if (mD > oA + 5)   tips.push("🛡️ Defensive Superiority — we handle their attack comfortably. Fullbacks can push high aggressively without fear of exposure.");
    const myW  = myForm.matches.filter(m => m.result === "W").length;
    const oppW = oppForm.matches.filter(m => m.result === "W").length;
    const oppConceded = oppForm.matches.reduce((s, m) => s + m.conceded, 0) / (oppForm.matches.length || 1);
    if (myW >= 4)       tips.push(`📈 Strong Momentum — ${myW}/5 wins in recent form. Confidence is high. Keep the same structure that has been working.`);
    if (oppW >= 4)      tips.push(`📉 Opponent In Form — ${oppTeam} have won ${oppW} of their last 5. Respect their momentum but do not change your game plan.`);
    if (oppConceded > 1.8) tips.push(`🔓 Leaky Opponents — ${oppTeam} have been conceding ${oppConceded.toFixed(1)} goals per game recently. Attack early, test them often.`);
    if (Math.abs(mA - oA) <= 5 && Math.abs(mD - oD) <= 5)
      tips.push("⚖️ Even Matchup — ratings are closely matched. Midfield transitions and set pieces will decide this. Discipline and tactical detail is everything.");
    if (!tips.length)
      tips.push("✅ Standard matchup. No extreme mismatches detected. Play to your structure, execute your game plan, and capitalise on transitions.");
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
        <TeamSelect label="Your Team" value={myTeam}  onChange={v => { setMyTeam(v);  setMyForm(null);  }} id="opp-my"  />
        <TeamSelect label="Opponent"  value={oppTeam} onChange={v => { setOppTeam(v); setOppForm(null); }} id="opp-opp" />
      </div>

      <ErrorBox msg={error} />

      <button onClick={run} disabled={loading} className="btn-volt w-full py-4 text-base flex items-center justify-center gap-2">
        {loading ? <><span className="animate-spin">⏳</span> Fetching…</> : "📡 Get Scout Report"}
      </button>

      {myForm && oppForm && (
        <>
          {/* Head-to-head comparison */}
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

          {/* Recent form */}
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

          {/* AI Scout Report */}
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
