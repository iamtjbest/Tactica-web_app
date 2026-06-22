"use client";
import { useState } from "react";
import { api, type PredictResponse } from "@/lib/api";
import TeamSelect from "@/components/TeamSelect";
import FormationBar from "@/components/FormationBar";
import ErrorBox from "@/components/ErrorBox";
import clsx from "clsx";

const FORMATIONS = [
  "4-3-3","4-2-3-1","4-4-2","4-4-2 Diamond","4-1-4-1",
  "3-4-3","3-5-2","3-4-2-1","5-3-2","5-4-1","5-2-3",
];

export default function SimulatorPage() {
  const [myTeam,   setMyTeam]   = useState("Arsenal");
  const [oppTeam,  setOppTeam]  = useState("Chelsea");
  const [formation,setFormation]= useState("4-3-3");
  const [minute,   setMinute]   = useState(45);
  const [myGoals,  setMyGoals]  = useState(0);
  const [oppGoals, setOppGoals] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [result,   setResult]   = useState<(PredictResponse & { advice: string[] }) | null>(null);

  async function simulate() {
    if (myTeam === oppTeam) { setError("A team cannot face itself!"); return; }
    setLoading(true); setError("");
    try {
      const pred = await api.predict({ my_team: myTeam, opp_team: oppTeam });

      const advice: string[] = [];
      const timeLeft = 90 - minute;

      if (myGoals > oppGoals) {
        if (timeLeft <= 15)
          advice.push("🧱 Protect the lead — drop into a 5-4-1 or 5-3-2. Absorb the pressure, stay compact. One goal is all you need.");
        else if (timeLeft <= 30)
          advice.push("✅ Comfortable lead — maintain your shape. No need for changes yet. Stay disciplined, keep the press triggers active.");
        else
          advice.push("🎯 You're ahead early — push for the second goal. Don't sit too deep. A second goal kills the game.");
      } else if (myGoals < oppGoals) {
        if (timeLeft <= 10)
          advice.push("🔥 Desperate measures — all-out attack. Go to 3-4-3 or 3-2-5 shape. Pack the box on set pieces. You need a miracle and they happen.");
        else if (timeLeft <= 25)
          advice.push("🔄 Tactical switch urgent — go to a more attacking formation immediately. Remove a midfielder, push wingers high, striker makes runs in behind.");
        else if (timeLeft <= 45)
          advice.push("📐 Regroup and build — you have time. Adjust the shape, stay patient, create overloads wide. Do not panic and give away counter-attack goals.");
        else
          advice.push("⚠️ You're losing but have time — focus on structure first, create overloads in wide areas, and build through midfield. Don't chase the game too early.");
      } else {
        if (timeLeft <= 10)
          advice.push("⚡ Final push — commit both fullbacks forward. High press, no regard for the counter now. Win it or take the draw.");
        else if (timeLeft <= 30)
          advice.push("🎯 Push for the winner — bring on an extra attacking player. You can still win this. Fullbacks join attacks, forwards press their backline.");
        else
          advice.push("⚖️ Level game — control possession through midfield, be patient. The next goal decides this. Don't gift set pieces away.");
      }

      if (formation.startsWith("5"))
        advice.push(`💡 Your ${formation} is very defensive — with ${timeLeft} minutes left and score ${myGoals}–${oppGoals}, consider pushing one of the wide defenders into midfield to create more overloads going forward.`);

      setResult({ ...pred, advice });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API error");
    } finally { setLoading(false); }
  }

  const scoreline = myGoals > oppGoals ? "WINNING" : myGoals < oppGoals ? "LOSING" : "LEVEL";
  const scoreColor = myGoals > oppGoals ? "text-grn" : myGoals < oppGoals ? "text-red" : "text-amber";

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-10 space-y-6">
      <div>
        <p className="section-label mb-2">⏱️ Module 4</p>
        <h1 className="font-display font-black text-4xl text-white mb-2">Live Simulator</h1>
        <p className="text-mt text-sm max-w-2xl">
          Set the current match scenario — minute, scoreline, and your formation.
          The AI returns situation-specific tactical advice and the best formation options
          for the remainder of the match.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeamSelect label="Your Team" value={myTeam}  onChange={setMyTeam}  id="sim-my"  disabled={loading} />
        <TeamSelect label="Opponent"  value={oppTeam} onChange={setOppTeam} id="sim-opp" disabled={loading} />
      </div>

      <div className="card space-y-5">
        <p className="section-label">Match Scenario</p>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-mt">Match Minute</span>
            <span className="text-volt font-mono font-bold">{minute}&apos;</span>
          </div>
          <input type="range" min={1} max={90} value={minute} onChange={e => setMinute(+e.target.value)} disabled={loading}
            className="w-full accent-volt cursor-pointer h-2 rounded-full disabled:opacity-40" />
          <div className="flex justify-between text-mt text-xs mt-1">
            <span>1&apos;</span><span>HT</span><span>90&apos;</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[["Your Goals", myGoals, setMyGoals], ["Opp Goals", oppGoals, setOppGoals]].map(([label, val, setter]) => (
            <div key={String(label)} className="text-center">
              <p className="text-mt text-xs mb-2 font-semibold uppercase tracking-wider">{String(label)}</p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => (setter as (n: number) => void)(Math.max(0, Number(val) - 1))} disabled={loading}
                  className="w-9 h-9 rounded-full border border-bd text-white hover:border-volt transition-colors text-lg font-bold disabled:opacity-40">
                  −
                </button>
                <span className="font-display font-black text-4xl text-volt w-10 text-center">{String(val)}</span>
                <button onClick={() => (setter as (n: number) => void)(Number(val) + 1)} disabled={loading}
                  className="w-9 h-9 rounded-full border border-bd text-white hover:border-volt transition-colors text-lg font-bold disabled:opacity-40">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-bg2 rounded-2xl border border-bd py-5 text-center">
          <p className={`font-display font-black text-2xl ${scoreColor} mb-1`}>{scoreline}</p>
          <p className="text-white font-display font-bold text-4xl">
            {myTeam.split(" ").slice(-1)[0]} {myGoals} – {oppGoals} {oppTeam.split(" ").slice(-1)[0]}
          </p>
          <p className="text-mt text-sm mt-1">Minute {minute}&apos; · {90 - minute} minutes remaining</p>
        </div>

        <div>
          <label className="block text-mt text-xs font-semibold mb-2 tracking-wide uppercase">Your Current Formation</label>
          <select value={formation} onChange={e => setFormation(e.target.value)} disabled={loading} className="input-select disabled:opacity-40">
            {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <ErrorBox msg={error} />

      <button onClick={simulate} disabled={loading} className="btn-volt w-full py-4 text-base flex items-center justify-center gap-2">
        {loading
          ? <><span className="animate-spin">⏳</span> Simulating…</>
          : "🎯 Get Tactical Recommendation"
        }
      </button>

      {result && (
        <div className="space-y-5">
          <div className="card">
            <p className="section-label mb-4">🧠 AI Tactical Advice</p>
            <div className="space-y-3">
              {result.advice.map((a, i) => (
                <div key={i} className="bg-bg border-l-2 border-l-volt rounded-xl px-4 py-3 text-sm text-white leading-relaxed">
                  {a}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="section-label mb-5">📐 Best Formation Options</p>
            <FormationBar items={result.all_formations} />
          </div>

          <div className="card text-center">
            <p className="text-mt text-xs mb-1">Your current {formation} win probability</p>
            <p className="font-display font-black text-4xl text-volt">{result.probability}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
