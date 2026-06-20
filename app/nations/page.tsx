"use client";
import { useState, useRef, useEffect } from "react";
import {
  api, WC_2026_NATIONS, type WcNation,
  type NationsPredictResponse, type NationsLineupResponse, type ChatMessage,
} from "@/lib/api";
import FormationBar from "@/components/FormationBar";
import ErrorBox from "@/components/ErrorBox";
import StatCard from "@/components/StatCard";
import clsx from "clsx";

const CONF_ORDER = ["UEFA", "CONMEBOL", "CAF", "AFC", "CONCACAF", "OFC"];

function byConf(nations: WcNation[]) {
  const map: Record<string, WcNation[]> = {};
  nations.forEach(n => { (map[n.conf] ||= []).push(n); });
  return map;
}

function NationPicker({
  label, value, onSelect, exclude,
}: {
  label: string; value: WcNation; onSelect: (n: WcNation) => void; exclude: WcNation;
}) {
  const grouped = byConf(WC_2026_NATIONS);
  return (
    <div>
      <p className="text-mt text-xs font-semibold mb-3 tracking-wide uppercase">{label}</p>
      <div className="border border-bd rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-volt/10 border-b border-bd">
          <span className="text-2xl">{value.flag}</span>
          <div>
            <p className="text-volt font-bold text-sm">{value.name}</p>
            <p className="text-mt text-[10px] font-mono">{value.conf}</p>
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "320px" }}>
          {CONF_ORDER.filter(c => grouped[c]).map(conf => (
            <div key={conf}>
              <p className="px-4 py-2 text-[10px] font-mono font-bold text-mt2 uppercase tracking-widest bg-bg2 border-b border-bd/40 sticky top-0">
                {conf} <span className="text-mt2/60">({grouped[conf].length})</span>
              </p>
              <div className="grid grid-cols-2 gap-1 p-2">
                {grouped[conf].map(n => {
                  const isSelected = n.id === value.id;
                  const isExcluded = n.id === exclude.id;
                  return (
                    <button key={n.id}
                      onClick={() => !isExcluded && onSelect(n)}
                      disabled={isExcluded}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm font-semibold transition-all",
                        isSelected ? "bg-volt/15 border border-volt/40 text-volt"
                          : isExcluded ? "opacity-30 cursor-not-allowed text-mt bg-bg border border-transparent"
                          : "text-mt bg-bg border border-transparent hover:text-white hover:border-bd2 hover:bg-sur2"
                      )}>
                      <span className="text-lg w-7 shrink-0">{n.flag}</span>
                      <span className="truncate text-xs">{n.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FORMATIONS = ["4-3-3","4-2-3-1","4-4-2","3-4-3","3-5-2","5-3-2","4-1-4-1"];

export default function NationsPage() {
  const defaultMy  = WC_2026_NATIONS.find(n => n.name === "Brazil")!;
  const defaultOpp = WC_2026_NATIONS.find(n => n.name === "France")!;

  const [myNation,  setMyNation]  = useState<WcNation>(defaultMy);
  const [oppNation, setOppNation] = useState<WcNation>(defaultOpp);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState<NationsPredictResponse | null>(null);

  const [lineupFormation, setLineupFormation] = useState("4-3-3");
  const [lineup,    setLineup]    = useState<NationsLineupResponse | null>(null);
  const [lineupLoading, setLineupLoading] = useState(false);
  const [lineupError, setLineupError] = useState("");

  const [showChat,  setShowChat]  = useState(false);
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState("");
  const [sending,   setSending]   = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function resetAll() {
    setResult(null); setLineup(null); setLineupError("");
    setShowChat(false); setMessages([]);
  }
  function changeMyNation(n: WcNation)  { setMyNation(n);  resetAll(); }
  function changeOppNation(n: WcNation) { setOppNation(n); resetAll(); }

  async function predict() {
    setLoading(true); setError(""); resetAll();
    try {
      const res = await api.nationsPredict({
        team_id: myNation.id, opp_id: oppNation.id,
        team_name: myNation.name, opp_name: oppNation.name,
      });
      setResult(res);
      setLineupFormation(res.best_formation || "4-3-3");
      if (res.warnings?.length) setError(res.warnings.join(" "));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not fetch squad data.");
    } finally { setLoading(false); }
  }

  async function getLineup() {
    setLineupLoading(true); setLineupError("");
    try {
      const res = await api.nationsLineup({
        nation_id: myNation.id, nation_name: myNation.name, formation: lineupFormation,
      });
      setLineup(res);
    } catch (e: unknown) {
      setLineupError(e instanceof Error ? e.message : "Could not fetch probable lineup.");
    } finally { setLineupLoading(false); }
  }

  async function sendChat() {
    if (!input.trim() || sending || !result) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated); setInput(""); setSending(true);
    try {
      const liveCtx = `WORLD CUP 2026 ANALYSIS: ${myNation.name} vs ${oppNation.name}.
Best formation: ${result.best_formation} (${result.probability}% win probability).
${myNation.name} — Attack: ${result.my_attack}, Defence: ${result.my_defence}, Squad: ${result.my_squad_count} players.
${oppNation.name} — Attack: ${result.opp_attack}, Defence: ${result.opp_defence}, Squad: ${result.opp_squad_count} players.`;
      const res = await api.chat({
        my_team: myNation.name, opp_team: oppNation.name,
        message: userMsg.content, history: messages, live_context: liveCtx,
      });
      setMessages([...updated, { role: "assistant", content: res.reply }]);
    } catch (e: unknown) {
      setMessages([...updated, { role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : "Chat error"}` }]);
    } finally { setSending(false); }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-10 space-y-6">
      <div>
        <p className="section-label mb-2">🌍 Module 6</p>
        <h1 className="font-display font-black text-4xl text-white mb-2">World Cup 2026</h1>
        <p className="text-mt text-sm max-w-2xl">
          All 48 FIFA-confirmed nations. Player ratings use caps, international goals, age,
          and club league quality — pulled live from BSD&apos;s official World Cup squads.
        </p>
      </div>

      <div className="card bg-volt/5 border-volt/20">
        <p className="section-label mb-4">📐 Player Rating Formula</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            ["Attackers / Midfielders", "Caps 35% · Goals 35% · Age 30%"],
            ["Defenders / GK",          "Caps 55% · Age 25% · Goals 20%"],
            ["Every player",            "× league weight (club quality)"],
          ].map(([t, d]) => (
            <div key={t} className="bg-bg2 rounded-xl py-3 px-2">
              <p className="text-white font-semibold text-sm">{t}</p>
              <p className="text-mt text-[11px] mt-1">{d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <NationPicker label="Your Nation" value={myNation}  onSelect={changeMyNation}  exclude={oppNation} />
        <NationPicker label="Opponent"    value={oppNation} onSelect={changeOppNation} exclude={myNation}  />
      </div>

      <div className="card py-8">
        <div className="flex items-center justify-center gap-10">
          <div className="text-center">
            <span className="text-6xl block mb-3 leading-none">{myNation.flag}</span>
            <p className="text-volt font-display font-bold text-xl">{myNation.name}</p>
            <p className="text-mt text-xs font-mono">{myNation.conf}</p>
          </div>
          <p className="font-display font-black text-4xl text-mt2">VS</p>
          <div className="text-center">
            <span className="text-6xl block mb-3 leading-none">{oppNation.flag}</span>
            <p className="text-white font-display font-bold text-xl">{oppNation.name}</p>
            <p className="text-mt text-xs font-mono">{oppNation.conf}</p>
          </div>
        </div>
      </div>

      <ErrorBox msg={error} />

      <button onClick={predict} disabled={loading} className="btn-volt w-full py-4 text-base flex items-center justify-center gap-2">
        {loading ? <><span className="animate-spin">⏳</span> Scoring squads…</> : "⚽ Predict Optimal Formation"}
      </button>

      {result && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="✅ Best Formation"   value={result.best_formation} />
            <StatCard label="🤖 Win Probability"  value={`${result.probability}%`} />
            <StatCard label="⚔️ Our Attack"       value={result.my_attack} />
            <StatCard label="🛡️ Our Defence"      value={result.my_defence} />
          </div>

          <div className="card">
            <p className="section-label mb-5">🏆 Formation Ranking</p>
            <FormationBar items={result.all_formations} />
          </div>

          <div className="card">
            <p className="section-label mb-4">📊 Rating Breakdown — {result.team} vs {result.opponent}</p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { name: result.team,     att: result.my_attack,  def: result.my_defence,  count: result.my_squad_count,  color: "text-volt" },
                { name: result.opponent, att: result.opp_attack, def: result.opp_defence, count: result.opp_squad_count, color: "text-red"  },
              ].map(r => (
                <div key={r.name}>
                  <p className="font-mono text-[10px] text-mt uppercase tracking-wider mb-3">{r.name}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-mt">Attack</span><span className={`${r.color} font-bold font-mono`}>{r.att}</span></div>
                    <div className="flex justify-between"><span className="text-mt">Defence</span><span className={`${r.color} font-bold font-mono`}>{r.def}</span></div>
                    <div className="flex justify-between"><span className="text-mt">Squad size</span><span className="text-white font-mono">{r.count}</span></div>
                  </div>
                </div>
              ))}
            </div>
            {result.bsd_resolved && (
              <p className="text-mt text-[11px] mt-4 pt-3 border-t border-bd/40 font-mono">
                BSD matched: &ldquo;{result.bsd_resolved.team ?? "—"}&rdquo; vs &ldquo;{result.bsd_resolved.opp ?? "—"}&rdquo;
              </p>
            )}
          </div>

          {/* Probable Lineup */}
          {!lineup && (
            <div className="card">
              <p className="section-label mb-4">👕 Probable Lineup</p>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-mt text-xs">Formation:</span>
                {FORMATIONS.map(f => (
                  <button key={f} onClick={() => setLineupFormation(f)}
                    className={clsx("px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all",
                      lineupFormation === f ? "bg-volt/10 text-volt border-volt/40" : "text-mt border-bd hover:text-white")}>
                    {f}
                  </button>
                ))}
              </div>
              <ErrorBox msg={lineupError} />
              <button onClick={getLineup} disabled={lineupLoading}
                className="btn-outline w-full py-3 flex items-center justify-center gap-2 mt-2">
                {lineupLoading ? <><span className="animate-spin">⏳</span> Building XI…</> : `📋 See Probable ${myNation.name} Lineup`}
              </button>
            </div>
          )}

          {lineup && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="section-label">👕 Probable Lineup — {lineup.nation}</p>
                  <p className="text-volt font-display font-bold text-xl mt-1">{lineup.formation}</p>
                </div>
                <button onClick={() => setLineup(null)} className="text-mt text-xs hover:text-white px-3 py-1.5 rounded-lg border border-bd">
                  Change formation
                </button>
              </div>
              <div className="space-y-2">
                {lineup.xi.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-bg border border-bd border-l-2 border-l-volt rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="pos-badge">{p.pos}</span>
                      <span className="text-white text-sm font-semibold">{p.name}</span>
                      {p.fallback && <span className="text-amber text-xs">⚠️</span>}
                    </div>
                    <div className="flex gap-3 text-mt text-xs">
                      <span>{p.club || "—"}</span>
                      <span>🧢 {p.caps}</span>
                      <span>⚽ {p.goals}</span>
                      <span>{p.age}y</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-mt text-xs mt-3">
                Squad size: {lineup.squad_size} players · BSD match: {lineup.bsd_resolved ?? "—"}
              </p>
            </div>
          )}

          {!showChat && (
            <button onClick={() => setShowChat(true)}
              className="w-full py-4 rounded-2xl border border-cyan/30 bg-cyan/5 text-cyan font-bold text-base flex items-center justify-center gap-2 hover:bg-cyan/10 hover:border-cyan transition-all">
              💬 Chat with AI about this matchup
            </button>
          )}

          {showChat && (
            <div className="card border-cyan/20 bg-cyan/3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="section-label">💬 AI Assistant Manager</p>
                  <p className="text-mt text-xs mt-0.5">{myNation.name} vs {oppNation.name} · {result.best_formation} recommended</p>
                </div>
                <button onClick={() => { setShowChat(false); setMessages([]); }} className="text-mt text-xs hover:text-white px-3 py-1.5 rounded-lg border border-bd">Close</button>
              </div>
              <div className="space-y-3 mb-4 overflow-y-auto pr-1" style={{ maxHeight: "380px" }}>
                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-3">🧠</p>
                    <p className="text-mt text-sm leading-relaxed">
                      Ask anything about this matchup.<br/>
                      &ldquo;Why {result.best_formation} against {result.opponent}?&rdquo;
                    </p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={clsx("max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "user" ? "bg-volt/10 border border-volt/25 text-white" : "bg-sur2 border border-bd text-white")}>
                      {m.role === "assistant" && <p className="text-cyan font-mono text-[10px] font-bold mb-1.5 tracking-widest uppercase">Assistant Manager</p>}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-sur2 border border-bd rounded-2xl px-4 py-3">
                      <div className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
              <div className="border-t border-bd/60 pt-4 flex gap-3">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder={`Ask about ${myNation.name} vs ${oppNation.name}…`} disabled={sending}
                  className="flex-1 bg-bg border border-bd rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan placeholder:text-mt2" />
                <button onClick={sendChat} disabled={sending || !input.trim()} className="btn-cyan-outline px-5 py-2.5 disabled:opacity-40">Send</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
