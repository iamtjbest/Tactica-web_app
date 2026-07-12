"use client";
import { useState } from "react";
import TeamSelect from "@/components/TeamSelect";
import ErrorBox from "@/components/ErrorBox";
import { EUROPEAN_TEAMS } from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://tactica-backend-hdbd.onrender.com";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Fixture {
  gameweek: number | null; date: string; opponent: string;
  venue: "H" | "A"; opp_defence: number; fdr: number;
  fdr_label: string; fdr_colour: "green" | "amber" | "red";
}
interface TickerResponse {
  team: string; fixtures: Fixture[];
  share_text: string; cached: boolean;
}
interface NextFixture {
  opponent: string; venue: string; date: string; fdr: number;
  fdr_label: string; fdr_colour: string; multiplier: number;
}
interface Pick {
  name: string; team?: string; position: string;
  market_value: number | null; market_value_m?: number;
  form_score: number; weighted_score: number; value_score?: number;
  apps_last5: number; avg_goals: number; avg_assists: number;
  avg_shots_on_target: number; avg_rating: number;
  next_fixture: NextFixture; reason: string;
}
interface CaptainResponse {
  team: string; recommendation: string;
  next_fixture: NextFixture; picks: Pick[];
  share_text: string; cached: boolean;
}
interface TransferResponse {
  position: string; budget_eur: number; total_found: number;
  picks: Pick[]; share_text: string; cached: boolean;
}

// ── Shared UI helpers ──────────────────────────────────────────────────────────

const FDR_BG:  Record<string,string> = {
  green:"bg-grn/15 border-grn/40", amber:"bg-amber/15 border-amber/40", red:"bg-red/15 border-red/40"
};
const FDR_TX:  Record<string,string> = { green:"text-grn", amber:"text-amber", red:"text-red" };
const FDR_DOT: Record<string,string> = { green:"bg-grn",   amber:"bg-amber",   red:"bg-red"  };

const PL_TEAMS = EUROPEAN_TEAMS.filter(t => [
  "Arsenal","Aston Villa","Bournemouth","Brentford","Brighton",
  "Chelsea","Crystal Palace","Everton","Fulham","Ipswich",
  "Leicester City","Liverpool","Manchester City","Manchester United",
  "Newcastle United","Nottingham Forest","Southampton",
  "Tottenham Hotspur","West Ham United","Wolverhampton",
  "Sunderland","Leeds United","Sheffield United",
].includes(t));

function fmtVal(eur: number | null): string {
  if (!eur) return "—";
  return eur >= 1_000_000 ? `£${(eur/1_000_000).toFixed(1)}m` : `£${(eur/1000).toFixed(0)}k`;
}

function FdrBadge({ fdr, label, colour }: { fdr:number; label:string; colour:string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${FDR_BG[colour]} ${FDR_TX[colour]}`}>
      <div className={`w-2 h-2 rounded-full ${FDR_DOT[colour]}`} />
      FDR {fdr} · {label}
    </div>
  );
}

// Share button — copies pre-built tweet text to clipboard
function ShareBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-volt/30
                 bg-volt/8 text-volt text-xs font-bold hover:bg-volt/15 transition-colors"
    >
      {copied ? "✅ Copied!" : "🐦 Copy tweet"}
    </button>
  );
}

// Player card — shared between Captain Pick and Transfer Recommender
function PlayerCard({ pick, rank, showTeam = false, showValue = false }:
  { pick: Pick; rank: number; showTeam?: boolean; showValue?: boolean }) {
  const nf = pick.next_fixture;
  const isTop = rank === 1;
  return (
    <div className={`card space-y-3 ${isTop ? "border-volt/30 bg-volt/5" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm border ${
          isTop
            ? "bg-volt/15 border-volt/40 text-volt"
            : "bg-sur2 border-bd text-mt"
        }`}>
          {isTop ? "C" : rank}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold truncate ${isTop ? "text-white text-base" : "text-white text-sm"}`}>
              {pick.name}
            </p>
            <span className="text-[10px] font-bold text-mt border border-bd rounded px-1.5 py-0.5">
              {pick.position}
            </span>
            {showTeam && pick.team && (
              <span className="text-[10px] font-bold text-cyan border border-cyan/30 rounded px-1.5 py-0.5">
                {pick.team}
              </span>
            )}
            {showValue && (
              <span className="text-[10px] font-mono text-mt border border-bd rounded px-1.5 py-0.5">
                {fmtVal(pick.market_value)}
              </span>
            )}
          </div>
          <p className="text-mt text-xs mt-1 leading-relaxed line-clamp-2">{pick.reason}</p>
        </div>

        {/* Weighted score */}
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-mt uppercase tracking-wider">Score</p>
          <p className={`font-black ${isTop ? "text-volt text-lg" : "text-white text-sm"}`}>
            {pick.weighted_score.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className={`grid grid-cols-4 gap-2 ${isTop ? "" : "opacity-80"}`}>
        {[
          { label:"G/Game",    val: pick.avg_goals.toFixed(2),             hi: pick.avg_goals >= 0.5 },
          { label:"A/Game",    val: pick.avg_assists.toFixed(2),           hi: false },
          { label:"SoT/Game",  val: pick.avg_shots_on_target.toFixed(2),  hi: pick.avg_shots_on_target >= 2 },
          { label:"Rating",    val: pick.avg_rating.toFixed(1),            hi: pick.avg_rating >= 7.5 },
        ].map(({ label, val, hi }) => (
          <div key={label} className={`text-center py-2 rounded-lg border ${hi ? "border-volt/30 bg-volt/8" : "border-bd bg-sur2"}`}>
            <p className={`text-sm font-black ${hi ? "text-volt" : "text-white"}`}>{val}</p>
            <p className="text-[10px] text-mt uppercase tracking-wider mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Next fixture */}
      {nf?.opponent && nf.opponent !== "Unknown" && (
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${FDR_BG[nf.fdr_colour]}`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${FDR_DOT[nf.fdr_colour]}`} />
          <p className={`text-xs flex-1 ${FDR_TX[nf.fdr_colour]}`}>
            <span className="font-bold">Next:</span> {nf.venue === "H" ? "Home" : "Away"} vs {nf.opponent}
            {nf.date && <span className="opacity-70"> · {nf.date}</span>}
          </p>
          <FdrBadge fdr={nf.fdr} label={nf.fdr_label} colour={nf.fdr_colour} />
        </div>
      )}

      {showValue && pick.value_score !== undefined && (
        <div className="flex items-center justify-between text-xs text-mt border-t border-bd/40 pt-2">
          <span>{pick.apps_last5} app{pick.apps_last5 !== 1 ? "s" : ""} · 45+ min</span>
          <span className="text-cyan font-bold">Value score: {pick.value_score.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

// ── Step 1: Fixture Ticker ────────────────────────────────────────────────────

function FixtureTicker() {
  const [team,    setTeam]    = useState("Arsenal");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [data,    setData]    = useState<TickerResponse | null>(null);

  async function fetch_() {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch(`${API_BASE}/api/fpl/fixtures?team=${encodeURIComponent(team)}&gws=38`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(typeof e?.detail === "string" ? e.detail : `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }

  const easy  = data?.fixtures.filter(f => f.fdr_colour === "green").length ?? 0;
  const hard  = data?.fixtures.filter(f => f.fdr_colour === "red").length ?? 0;
  const total = data?.fixtures.length ?? 0;

  return (
    <div className="space-y-5">
      <p className="text-mt text-sm">
        All remaining 2026/27 fixtures rated by difficulty.
        Green = buy their players · Red = sell before it hits.
      </p>
      <div className="card space-y-4">
        <TeamSelect label="Club" teams={PL_TEAMS} value={team} onChange={setTeam} />
        <button onClick={fetch_} disabled={loading}
          className="btn-volt w-full py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><span className="animate-spin">⚡</span> Loading…</> : <>📅 Get Fixture Ticker</>}
        </button>
      </div>
      <ErrorBox msg={error} />
      {data && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-display font-bold text-lg text-white">{data.team}</p>
              <p className="text-mt text-xs">{total} fixtures · {easy} easy · {hard} hard</p>
            </div>
            <div className="flex items-center gap-2">
              {data.cached && <span className="text-mt text-[10px] border border-bd px-2 py-0.5 rounded-full">📦 cached</span>}
              <ShareBtn text={data.share_text} />
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs text-mt">
            {[["green","Easy (1–2)"],["amber","Medium (3)"],["red","Hard (4–5)"]].map(([c,l]) => (
              <div key={c} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${FDR_DOT[c]}`} />
                {l}
              </div>
            ))}
          </div>

          {/* Fixtures */}
          <div className="space-y-2">
            {data.fixtures.map((fix, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${FDR_BG[fix.fdr_colour]}`}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${FDR_DOT[fix.fdr_colour]}`} />
                <div className="w-16 flex-shrink-0">
                  {fix.gameweek != null && <p className="text-[10px] font-bold uppercase opacity-60">GW{fix.gameweek}</p>}
                  <p className="text-xs font-bold">{fix.date}</p>
                </div>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 border ${
                  fix.venue === "H" ? "bg-volt/10 border-volt/30 text-volt" : "bg-white/5 border-white/15 text-mt"
                }`}>{fix.venue}</div>
                <p className="flex-1 font-bold text-sm">vs {fix.opponent}</p>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] opacity-60 uppercase">Def</p>
                  <p className="text-sm font-bold">{fix.opp_defence}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg flex-shrink-0 border ${FDR_BG[fix.fdr_colour]} ${FDR_TX[fix.fdr_colour]}`}>
                  {fix.fdr}
                </div>
              </div>
            ))}
          </div>

          {/* Quick read */}
          <div className="card border-volt/20">
            <p className="section-label mb-2">📊 Quick Read</p>
            <p className="text-sm text-white leading-relaxed">
              {easy >= total * 0.6
                ? `${data.team} have an excellent run — ${easy} of ${total} fixtures rated easy. Strong season to hold their attackers.`
                : hard >= total * 0.6
                ? `Tough season ahead for ${data.team} — ${hard} of ${total} fixtures rated hard. Be selective with their players.`
                : `${data.team} have a mixed schedule — ${easy} easy, ${total-easy-hard} medium, ${hard} hard fixtures remaining.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Captain Pick ──────────────────────────────────────────────────────

function CaptainPick() {
  const [team,    setTeam]    = useState("Arsenal");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [data,    setData]    = useState<CaptainResponse | null>(null);

  async function fetch_() {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch(`${API_BASE}/api/fpl/captain?team=${encodeURIComponent(team)}&top=5`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(typeof e?.detail === "string" ? e.detail : `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      <p className="text-mt text-sm">
        AI-ranked captain candidates based on goals, assists, shots on target,
        and next fixture difficulty. Updated every 30 min.
      </p>
      <div className="card space-y-4">
        <TeamSelect label="Club" teams={PL_TEAMS} value={team} onChange={setTeam} />
        <button onClick={fetch_} disabled={loading}
          className="btn-volt w-full py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><span className="animate-spin">🎯</span> Analysing…</> : <>🎯 Get Captain Pick</>}
        </button>
      </div>
      <ErrorBox msg={error} />
      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="font-display font-bold text-lg text-white">{data.team} — Captain</p>
            <div className="flex items-center gap-2">
              {data.cached && <span className="text-mt text-[10px] border border-bd px-2 py-0.5 rounded-full">📦 cached</span>}
              <ShareBtn text={data.share_text} />
            </div>
          </div>
          <div className="space-y-3">
            {data.picks.map((pick, i) => (
              <PlayerCard key={pick.bsd_id ?? i} pick={pick} rank={i + 1} />
            ))}
          </div>
          <details className="card cursor-pointer group">
            <summary className="flex items-center justify-between text-mt text-sm select-none">
              <span>⚙️ How scoring works</span>
              <span className="group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="mt-3 space-y-2 text-xs text-mt leading-relaxed border-t border-bd pt-3">
              <p><span className="text-white font-bold">Form score</span> = goals×6 + assists×3 + SoT×0.5 + rating×0.3</p>
              <p><span className="text-white font-bold">Weighted score</span> = form × fixture multiplier</p>
              <p><span className="text-white font-bold">Multipliers:</span> FDR 1 = ×1.30 · FDR 2 = ×1.15 · FDR 3 = ×1.00 · FDR 4 = ×0.85 · FDR 5 = ×0.70</p>
              <p>Only 45+ minute appearances counted. Live BSD data.</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Transfer Recommender ─────────────────────────────────────────────

const POSITIONS = [
  { id:"FW", label:"⚽ Forwards" },
  { id:"MF", label:"🎭 Midfielders" },
  { id:"DF", label:"🛡️ Defenders" },
];

const BUDGETS = [
  { val:15,  label:"£15m" },
  { val:25,  label:"£25m" },
  { val:50,  label:"£50m" },
  { val:100, label:"No limit" },
];

function TransferRecommender() {
  const [position, setPosition] = useState("FW");
  const [budget,   setBudget]   = useState(100);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [data,     setData]     = useState<TransferResponse | null>(null);

  async function fetch_() {
    setLoading(true); setError(""); setData(null);
    try {
      const url = `${API_BASE}/api/fpl/transfers?position=${position}&budget=${budget}&limit=10`;
      const res = await fetch(url);
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(typeof e?.detail === "string" ? e.detail : `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      <p className="text-mt text-sm">
        Best transfer targets across all Premier League teams — ranked by recent
        form and next fixture difficulty relative to market value. Your shortlist for the new season.
      </p>

      <div className="card space-y-5">
        {/* Position */}
        <div>
          <p className="section-label mb-2">Position</p>
          <div className="flex gap-2">
            {POSITIONS.map(p => (
              <button
                key={p.id}
                onClick={() => setPosition(p.id)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  position === p.id
                    ? "bg-volt/10 border-volt/40 text-volt"
                    : "border-bd text-mt hover:border-volt/20 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <p className="section-label mb-2">Max Market Value</p>
          <div className="flex gap-2 flex-wrap">
            {BUDGETS.map(b => (
              <button
                key={b.val}
                onClick={() => setBudget(b.val)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                  budget === b.val
                    ? "bg-volt/10 border-volt/40 text-volt"
                    : "border-bd text-mt hover:border-volt/20 hover:text-white"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={fetch_} disabled={loading}
          className="btn-volt w-full py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? <><span className="animate-spin">🔄</span> Scanning all PL teams…</>
            : <>🔄 Find Transfer Targets</>}
        </button>
      </div>

      <ErrorBox msg={error} />

      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-display font-bold text-lg text-white">
                Top {data.picks.length} {
                  {FW:"Forwards",MF:"Midfielders",DF:"Defenders"}[data.position] ?? data.position
                }
              </p>
              <p className="text-mt text-xs">
                {data.total_found} candidates scanned ·
                {budget < 100 ? ` budget ≤ £${budget}m ·` : ""} ranked by value
              </p>
            </div>
            <div className="flex items-center gap-2">
              {data.cached && <span className="text-mt text-[10px] border border-bd px-2 py-0.5 rounded-full">📦 cached</span>}
              <ShareBtn text={data.share_text} />
            </div>
          </div>

          {/* Value score explainer */}
          <div className="flex items-center gap-2 text-xs text-mt bg-sur2 rounded-xl px-4 py-3 border border-bd">
            <span>💡</span>
            <span>
              <span className="text-white font-bold">Value score</span> = weighted form ÷ market value.
              High output at low price = high value score. Ranked by this — not raw ability.
            </span>
          </div>

          <div className="space-y-3">
            {data.picks.map((pick, i) => (
              <PlayerCard
                key={pick.bsd_id ?? i}
                pick={pick}
                rank={i + 1}
                showTeam
                showValue
              />
            ))}
          </div>

          <details className="card cursor-pointer group">
            <summary className="flex items-center justify-between text-mt text-sm select-none">
              <span>⚙️ How value ranking works</span>
              <span className="group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="mt-3 space-y-2 text-xs text-mt leading-relaxed border-t border-bd pt-3">
              <p><span className="text-white font-bold">Form score</span> = goals×6 + assists×3 + SoT×0.5 + rating×0.3 (last 5 starts)</p>
              <p><span className="text-white font-bold">Weighted score</span> = form × fixture multiplier (FDR 1=×1.30 → FDR 5=×0.70)</p>
              <p><span className="text-white font-bold">Value score</span> = weighted score ÷ market value in £m</p>
              <p>Rewards high-output cheap players over expensive but average performers — the same logic FPL managers use for differentials.</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}


// ── Step 4: Differential Finder ───────────────────────────────────────────────

interface DiffResponse {
  position: string; max_value_eur: number; total_scanned: number;
  picks: (Pick & { diff_score: number; ownership_proxy: string })[]; 
  share_text: string; cached: boolean;
}

const MAX_VALUES = [
  { val:10, label:"€10m" },
  { val:15, label:"€15m" },
  { val:25, label:"€25m" },
  { val:40, label:"€40m" },
];

function DifferentialFinder() {
  const [position, setPosition] = useState("FW");
  const [maxVal,   setMaxVal]   = useState(15);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [data,     setData]     = useState<DiffResponse | null>(null);

  async function fetch_() {
    setLoading(true); setError(""); setData(null);
    try {
      const url = `${API_BASE}/api/fpl/differentials?position=${position}&max_value=${maxVal}&limit=8`;
      const res = await fetch(url);
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(typeof e?.detail === "string" ? e.detail : `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      <div className="bg-volt/5 border border-volt/20 rounded-xl px-4 py-3 text-sm text-mt leading-relaxed">
        <span className="text-volt font-bold">What is a differential?</span>{" "}
        A player owned by &lt;10% of managers who is in form with an easy fixture.
        If they score, you gain ground on rivals who don&apos;t have them.
        The most shared picks on FPL Twitter.
      </div>

      <div className="card space-y-5">
        {/* Position */}
        <div>
          <p className="section-label mb-2">Position</p>
          <div className="flex gap-2">
            {POSITIONS.map(p => (
              <button key={p.id} onClick={() => setPosition(p.id)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  position === p.id
                    ? "bg-volt/10 border-volt/40 text-volt"
                    : "border-bd text-mt hover:border-volt/20 hover:text-white"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max market value */}
        <div>
          <p className="section-label mb-1">Max Market Value</p>
          <p className="text-mt text-xs mb-2">Lower = more likely to be low ownership in FPL</p>
          <div className="flex gap-2 flex-wrap">
            {MAX_VALUES.map(b => (
              <button key={b.val} onClick={() => setMaxVal(b.val)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                  maxVal === b.val
                    ? "bg-volt/10 border-volt/40 text-volt"
                    : "border-bd text-mt hover:border-volt/20 hover:text-white"
                }`}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={fetch_} disabled={loading}
          className="btn-volt w-full py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? <><span className="animate-spin">💡</span> Hunting differentials…</>
            : <>💡 Find Differentials</>}
        </button>
      </div>

      <ErrorBox msg={error} />

      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-display font-bold text-lg text-white">
                Top Differential{" "}
                {{ FW:"Forwards", MF:"Midfielders", DF:"Defenders" }[data.position] ?? data.position}
              </p>
              <p className="text-mt text-xs">
                {data.total_scanned} candidates scanned · under €{maxVal}m ·
                easy fixtures only (FDR ≤ 3)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {data.cached && <span className="text-mt text-[10px] border border-bd px-2 py-0.5 rounded-full">📦 cached</span>}
              <ShareBtn text={data.share_text} />
            </div>
          </div>

          {/* What makes a differential banner */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon:"💰", label:"Low price", sub:"Proxy for low ownership" },
              { icon:"🔥", label:"In form",   sub:"Goals + assists recently" },
              { icon:"🟢", label:"Easy fix",  sub:"FDR 1, 2, or 3 only" },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="bg-sur2 border border-bd rounded-xl py-3 px-2">
                <p className="text-lg mb-0.5">{icon}</p>
                <p className="text-white text-xs font-bold">{label}</p>
                <p className="text-mt text-[10px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {data.picks.map((pick, i) => (
              <div key={pick.bsd_id ?? i} className="relative">
                {i === 0 && (
                  <div className="absolute -top-2 left-4 z-10">
                    <span className="bg-volt text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                      🔥 TOP DIFFERENTIAL
                    </span>
                  </div>
                )}
                <PlayerCard
                  pick={pick}
                  rank={i + 1}
                  showTeam
                  showValue
                />
              </div>
            ))}
          </div>

          <details className="card cursor-pointer group">
            <summary className="flex items-center justify-between text-mt text-sm select-none">
              <span>⚙️ How differential scoring works</span>
              <span className="group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="mt-3 space-y-2 text-xs text-mt leading-relaxed border-t border-bd pt-3">
              <p><span className="text-white font-bold">Form score</span> = goals×6 + assists×3 + SoT×0.5 + rating×0.3</p>
              <p><span className="text-white font-bold">Ease bonus</span> = FDR1 ×1.4 · FDR2 ×1.2 · FDR3 ×1.0. Only easy/medium fixtures shown.</p>
              <p><span className="text-white font-bold">Value bonus</span> = 100 ÷ market value in €m (capped ×3.0). Cheap players score higher.</p>
              <p><span className="text-white font-bold">Differential score</span> = form × ease × value. The number you want high.</p>
              <p>Market value is used as a proxy for FPL ownership — players under €15m are typically owned by &lt;10% of FPL managers.</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// ── Root page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id:"ticker",   label:"📅 Fixtures" },
  { id:"captain",  label:"🎯 Captain" },
  { id:"transfer", label:"🔄 Transfers" },
  { id:"diff",     label:"💡 Differentials" },
];

type Tab = "ticker" | "captain" | "transfer";

export default function FplPage() {
  const [tab, setTab] = useState<Tab>("ticker");

  return (
    <div className="max-w-screen-md mx-auto px-5 py-10 space-y-6">
      {/* Header */}
      <div>
        <p className="section-label mb-2">FPL Scout</p>
        <h1 className="font-display font-black text-3xl text-white mb-1">
          Fantasy Premier League
        </h1>
        <p className="text-mt text-sm leading-relaxed">
          Real match data · Fixture difficulty · Captain picks · Transfer targets
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`flex-1 py-3 px-2 rounded-xl border text-xs font-bold transition-all ${
              tab === t.id
                ? "bg-volt/10 border-volt/40 text-volt"
                : "border-bd text-mt hover:border-volt/20 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active tab */}
      {tab === "ticker"   && <FixtureTicker />}
      {tab === "captain"  && <CaptainPick />}
      {tab === "transfer" && <TransferRecommender />}
      {tab === "diff"     && <DifferentialFinder />}
    </div>
  );
}
