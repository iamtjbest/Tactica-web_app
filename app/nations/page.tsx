"use client";
import { useState, useRef, useEffect } from "react";
import {
  api, WC_2026_NATIONS, type WcNation,
  type NationsPredictResponse, type ChatMessage,
} from "@/lib/api";
import FormationBar from "@/components/FormationBar";
import ErrorBox from "@/components/ErrorBox";
import StatCard from "@/components/StatCard";
import clsx from "clsx";

const CONF_ORDER = ["UEFA","CONMEBOL","CAF","AFC","CONCACAF","OFC"];

// Group nations by confederation for display
function byConf(nations: WcNation[]) {
  const map: Record<string, WcNation[]> = {};
  nations.forEach(n => {
    if (!map[n.conf]) map[n.conf] = [];
    map[n.conf].push(n);
  });
  return map;
}

// Nation picker component — shows flag + code + name in a scrollable grid
function NationPicker({
  label, value, onSelect, exclude,
}: {
  label: string;
  value: WcNation;
  onSelect: (n: WcNation) => void;
  exclude: WcNation;
}) {
  const grouped = byConf(WC_2026_NATIONS);

  return (
    <div>
      <p className="text-mt text-xs font-semibold mb-3 tracking-wide uppercase">{label}</p>
      <div className="border border-bd rounded-2xl overflow-hidden">
        {/* Selected nation header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-volt/10 border-b border-bd">
          <span className="text-2xl">{value.flag}</span>
          <div>
            <p className="text-volt font-bold text-sm">{value.name}</p>
            <p className="text-mt text-[10px] font-mono">{value.conf}</p>
          </div>
        </div>

        {/* Scrollable confederation groups */}
        <div className="overflow-y-auto" style={{ maxHeight: "320px" }}>
          {CONF_ORDER.filter(c => grouped[c]).map(conf => (
            <div key={conf}>
              <p className="px-4 py-2 text-[10px] font-mono font-bold text-mt2 uppercase tracking-widest bg-bg2 border-b border-bd/40 sticky top-0">
                {conf}
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
                        isSelected
                          ? "bg-volt/15 border border-volt/40 text-volt"
                          : isExcluded
                          ? "opacity-30 cursor-not-allowed text-mt bg-bg border border-transparent"
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

export default function NationsPage() {
  // Default: Nigeria vs England
  const defaultMy  = WC_2026_NATIONS.find(n => n.name === "Nigeria")!;
  const defaultOpp = WC_2026_NATIONS.find(n => n.name === "England")!;

  const [myNation,  setMyNation]  = useState<WcNation>(defaultMy);
  const [oppNation, setOppNation] = useState<WcNation>(defaultOpp);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState<NationsPredictResponse | null>(null);

  // AI Chat state
  const [showChat,  setShowChat]  = useState(false);
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState("");
  const [sending,   setSending]   = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset when nations change
  function changeMyNation(n: WcNation) {
    setMyNation(n); setResult(null); setShowChat(false); setMessages([]);
  }
  function changeOppNation(n: WcNation) {
    setOppNation(n); setResult(null); setShowChat(false); setMessages([]);
  }

  async function predict() {
    setLoading(true); setError(""); setResult(null); setShowChat(false); setMessages([]);
    try {
      const res = await api.nationsPredict({
        team_id:   myNation.id,
        opp_id:    oppNation.id,
        team_name: myNation.name,
        opp_name:  oppNation.name,
      });
      setResult(res);
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not fetch squad data. BSD may not have this nation's WC2026 squad loaded yet."
      );
    } finally { setLoading(false); }
  }

  async function sendChat() {
    if (!input.trim() || sending || !result) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setSending(true);
    try {
      const liveCtx = `WORLD CUP 2026 ANALYSIS: ${myNation.name} vs ${oppNation.name}. 
Best formation: ${result.best_formation} (${result.probability}% win probability).
${myNation.name} — Attack: ${result.my_attack}, Defence: ${result.my_defence}, Squad: ${result.my_squad_count} players.
${oppNation.name} — Attack: ${result.opp_attack}, Defence: ${result.opp_defence}, Squad: ${result.opp_squad_count} players.
${result.players_scored} players rated using form, quality, experience and age × league weight.`;

      const res = await api.chat({
        my_team:      myNation.name,
        opp_team:     oppNation.name,
        message:      userMsg.content,
        history:      messages,
        live_context: liveCtx,
      });
      setMessages([...updated, { role: "assistant", content: res.reply }]);
    } catch (e: unknown) {
      setMessages([...updated, {
        role: "assistant",
        content: `⚠️ ${e instanceof Error ? e.message : "Chat error"}`,
      }]);
    } finally { setSending(false); }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-10 space-y-6">

      {/* Header */}
      <div>
        <p className="section-label mb-2">🌍 Module 6</p>
        <h1 className="font-display font-black text-4xl text-white mb-2">World Cup 2026</h1>
        <p className="text-mt text-sm max-w-2xl">
          All 48 qualified nations. Player scores are derived from club form, BSD match ratings,
          international caps, and age — weighted by league quality. Pick any two nations and
          generate the optimal formation with full tactical analysis.
        </p>
      </div>

      {/* Rating formula card */}
      <div className="card bg-volt/5 border-volt/20">
        <p className="section-label mb-4">📐 Player Rating Formula</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            ["35%", "Form",       "G+A per 90\nlast club season"],
            ["30%", "Quality",    "BSD avg match\nrating × 10"],
            ["20%", "Experience", "International\ncaps (0–100)"],
            ["15%", "Age",        "Peak 26–29\nyrs = 1.0"],
          ].map(([pct, label, desc]) => (
            <div key={label} className="bg-bg2 rounded-xl py-3 px-2">
              <p className="font-display font-black text-3xl text-volt">{pct}</p>
              <p className="text-white font-semibold text-sm mt-1">{label}</p>
              <p className="text-mt text-[11px] mt-1 leading-snug whitespace-pre-line">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-mt text-xs mt-3 pt-3 border-t border-bd/40">
          Final score × <span className="text-cyan font-semibold">league weight</span>
          {" "}(Premier League = 1.0 → outside Europe = 0.74)
        </p>
      </div>

      {/* Nation pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <NationPicker label="Your Nation" value={myNation}  onSelect={changeMyNation}  exclude={oppNation} />
        <NationPicker label="Opponent"    value={oppNation} onSelect={changeOppNation} exclude={myNation}  />
      </div>

      {/* Matchup preview */}
      <div className="card py-8">
        <div className="flex items-center justify-center gap-10">
          <div className="text-center">
            <span className="text-6xl block mb-3 leading-none">{myNation.flag}</span>
            <p className="text-volt font-display font-bold text-xl">{myNation.name}</p>
            <p className="text-mt text-xs font-mono">{myNation.conf}</p>
          </div>
          <div className="text-center">
            <p className="font-display font-black text-4xl text-mt2">VS</p>
          </div>
          <div className="text-center">
            <span className="text-6xl block mb-3 leading-none">{oppNation.flag}</span>
            <p className="text-white font-display font-bold text-xl">{oppNation.name}</p>
            <p className="text-mt text-xs font-mono">{oppNation.conf}</p>
          </div>
        </div>
      </div>

      <ErrorBox msg={error} />

      <button onClick={predict} disabled={loading}
        className="btn-volt w-full py-4 text-base flex items-center justify-center gap-2">
        {loading
          ? <><span className="animate-spin">⏳</span> Scoring squads &amp; computing…</>
          : "⚽ Predict Optimal Formation"
        }
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-5">

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="✅ Best Formation"   value={result.best_formation} />
            <StatCard label="🤖 Win Probability"  value={`${result.probability}%`} />
            <StatCard label="⚔️ Our Attack"       value={result.my_attack} />
            <StatCard label="🛡️ Our Defence"      value={result.my_defence} />
          </div>

          {/* Formation ranking */}
          <div className="card">
            <p className="section-label mb-5">🏆 Formation Ranking</p>
            <FormationBar items={result.all_formations} />
          </div>

          {/* Matchup breakdown */}
          <div className="card">
            <p className="section-label mb-4">📊 Rating Breakdown</p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { name: result.team, att: result.my_attack,  def: result.my_defence,  count: result.my_squad_count,  color: "text-volt" },
                { name: result.opponent, att: result.opp_attack, def: result.opp_defence, count: result.opp_squad_count, color: "text-red"  },
              ].map(r => (
                <div key={r.name}>
                  <p className="font-mono text-[10px] text-mt uppercase tracking-wider mb-3">{r.name}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-mt">Attack</span>
                      <span className={`${r.color} font-bold font-mono`}>{r.att}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mt">Defence</span>
                      <span className={`${r.color} font-bold font-mono`}>{r.def}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mt">Squad size</span>
                      <span className="text-white font-mono">{r.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-mt text-xs mt-4 pt-3 border-t border-bd/40">
              {result.players_scored} players rated · form + quality + experience + age × league weight
            </p>
          </div>

          {/* Chat with AI button */}
          {!showChat && (
            <button
              onClick={() => setShowChat(true)}
              className="w-full py-4 rounded-2xl border border-cyan/30 bg-cyan/5 text-cyan
                         font-bold text-base flex items-center justify-center gap-2
                         hover:bg-cyan/10 hover:border-cyan transition-all">
              💬 Chat with AI about this matchup
            </button>
          )}

          {/* Inline AI Chat panel */}
          {showChat && (
            <div className="card border-cyan/20 bg-cyan/3 space-y-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="section-label">💬 AI Assistant Manager</p>
                  <p className="text-mt text-xs mt-0.5">
                    Discussing {myNation.name} vs {oppNation.name} · {result.best_formation} recommended
                  </p>
                </div>
                <button onClick={() => { setShowChat(false); setMessages([]); }}
                  className="text-mt text-xs hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-bd hover:border-bd2">
                  Close
                </button>
              </div>

              {/* Messages */}
              <div className="space-y-3 mb-4 overflow-y-auto pr-1" style={{ maxHeight: "380px" }}>
                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-3">🧠</p>
                    <p className="text-mt text-sm leading-relaxed">
                      Ask anything about this matchup.<br/>
                      &ldquo;Why {result.best_formation} against {result.opponent}?&rdquo;<br/>
                      &ldquo;Who are {result.team}&apos;s key players?&rdquo;<br/>
                      &ldquo;How do we stop their attack?&rdquo;
                    </p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={clsx(
                      "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-volt/10 border border-volt/25 text-white"
                        : "bg-sur2 border border-bd text-white"
                    )}>
                      {m.role === "assistant" && (
                        <p className="text-cyan font-mono text-[10px] font-bold mb-1.5 tracking-widest uppercase">
                          Assistant Manager
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-sur2 border border-bd rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-2 h-2 rounded-full bg-cyan animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat input */}
              <div className="border-t border-bd/60 pt-4 flex gap-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder={`Ask about ${myNation.name} vs ${oppNation.name}…`}
                  disabled={sending}
                  className="flex-1 bg-bg border border-bd rounded-xl px-4 py-2.5 text-white
                             text-sm focus:outline-none focus:border-cyan transition-colors
                             placeholder:text-mt2"
                />
                <button onClick={sendChat} disabled={sending || !input.trim()}
                  className="btn-cyan-outline px-5 py-2.5 disabled:opacity-40">
                  Send
                </button>
                {messages.length > 0 && (
                  <button onClick={() => setMessages([])}
                    className="text-mt text-xs px-3 hover:text-white transition-colors">
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
