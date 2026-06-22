"use client";
import { useState, useRef, useEffect } from "react";
import { api, type ChatMessage, type LiveResponse, type SquadPlayer } from "@/lib/api";
import TeamSelect from "@/components/TeamSelect";
import LiveBadge from "@/components/LiveBadge";
import ErrorBox from "@/components/ErrorBox";
import clsx from "clsx";

export default function ChatPage() {
  const [myTeam,  setMyTeam]  = useState("Arsenal");
  const [oppTeam, setOppTeam] = useState("Chelsea");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input,   setInput]   = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [live,    setLive]    = useState<LiveResponse | null>(null);
  const [squad,   setSquad]   = useState<SquadPlayer[]>([]);
  const [error,   setError]   = useState("");
  const [lastSync, setLastSync] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const busy = sending || syncing; // lock team selection while a request is in flight

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function changeMyTeam(v: string) { setMyTeam(v); setMessages([]); setLive(null); setSquad([]); }
  function changeOppTeam(v: string) { setOppTeam(v); setMessages([]); setLive(null); }

  async function syncLive() {
    const now = Date.now();
    if (now - lastSync < 30000) {
      setError("Please wait 30 seconds between live syncs — BSD data refreshes every 30s.");
      return;
    }
    setSyncing(true); setError("");
    try {
      const data = await api.live(myTeam, oppTeam);
      setLive(data);
      setLastSync(Date.now());
      if (!data.match_found) setError(`No live fixture found for ${myTeam} vs ${oppTeam} right now. ${data.live_count ?? 0} matches checked worldwide.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Live sync failed");
    } finally { setSyncing(false); }
  }

  async function send() {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setSending(true);
    try {
      let sq = squad;
      if (sq.length === 0) {
        try {
          const r = await api.squad(myTeam);
          setSquad(r.players);
          sq = r.players;
        } catch { /* squad optional */ }
      }

      const liveCtx = live?.match_found
        ? `LIVE (${live.competition}): Minute ${live.minute}'. Score: ${live.home_team} ${live.home_score} – ${live.away_score} ${live.away_team}. Status: ${live.status}.`
        : undefined;

      const res = await api.chat({
        my_team: myTeam,
        opp_team: oppTeam,
        message: userMsg.content,
        history: messages,
        live_context: liveCtx,
        squad: sq.length ? sq : undefined,
      });

      setMessages([...updated, { role: "assistant", content: res.reply }]);
    } catch (e: unknown) {
      setMessages([...updated, {
        role: "assistant",
        content: `⚠️ Error: ${e instanceof Error ? e.message : "API error"}`,
      }]);
    } finally { setSending(false); }
  }

  const cooldownSecs = Math.max(0, Math.ceil((30000 - (Date.now() - lastSync)) / 1000));
  const syncReady = cooldownSecs === 0;

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-10 space-y-5">
      <div>
        <p className="section-label mb-2">💬 Module 5</p>
        <h1 className="font-display font-black text-4xl text-white mb-2">AI Tactical Chat</h1>
        <p className="text-mt text-sm max-w-2xl">
          Select your teams, optionally sync a live match score from any competition worldwide,
          then chat with your AI assistant manager. It knows your squad and the live context.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeamSelect label="Your Team" value={myTeam}  onChange={changeMyTeam}  id="chat-my"  disabled={busy} />
        <TeamSelect label="Opponent"  value={oppTeam} onChange={changeOppTeam} id="chat-opp" disabled={busy} />
      </div>

      <div className="card space-y-3">
        <p className="section-label">📡 Live Match Intel</p>
        {live && <LiveBadge data={live} />}
        {!live && (
          <p className="text-mt text-sm">Not synced — hit the button to scan all live matches worldwide.</p>
        )}
        <ErrorBox msg={error} />
        <div className="flex gap-3">
          <button onClick={syncLive} disabled={syncing || !syncReady}
            className={clsx("flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all",
              syncReady
                ? "border-cyan/30 text-cyan bg-cyan/5 hover:bg-cyan/10"
                : "border-bd text-mt cursor-not-allowed"
            )}>
            {syncing
              ? <><span className="animate-spin">⏳</span> Scanning all competitions…</>
              : syncReady
              ? "🔄 Sync Live Data (All Competitions)"
              : `🔄 Sync (cooldown: ${cooldownSecs}s)`
            }
          </button>
          {live && (
            <button onClick={() => { setLive(null); setError(""); }}
              className="px-4 py-2.5 rounded-xl text-xs text-mt border border-bd hover:text-white transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="card flex flex-col" style={{ minHeight: "500px" }}>
        <p className="section-label mb-4">🧠 Assistant Manager</p>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1" style={{ maxHeight: "440px" }}>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-mt text-sm">
                  Ask anything — &ldquo;How do we beat {oppTeam}?&rdquo;<br/>
                  &ldquo;What changes at minute 70 losing 1-0?&rdquo;<br/>
                  &ldquo;Which players should start today?&rdquo;
                </p>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={clsx(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-volt/10 border border-volt/25 text-white"
                  : "bg-sur2 border border-bd text-white"
              )}>
                {m.role === "assistant" && (
                  <p className="text-volt font-mono text-[10px] font-bold mb-1.5 tracking-widest uppercase">
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
                    <span key={i} className="w-2 h-2 rounded-full bg-volt animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-bd pt-4 flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`Ask your assistant about ${myTeam} vs ${oppTeam}…`}
            disabled={sending}
            className="flex-1 bg-bg border border-bd rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-volt transition-colors placeholder:text-mt2"
          />
          <button onClick={send} disabled={sending || !input.trim()}
            className="btn-volt px-5 py-2.5 disabled:opacity-40">
            Send
          </button>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
              className="text-mt text-sm px-3 hover:text-white transition-colors">
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
