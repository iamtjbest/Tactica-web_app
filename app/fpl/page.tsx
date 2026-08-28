"use client";
import { useState, useEffect } from "react";
import TeamSelect from "@/components/TeamSelect";
import ErrorBox from "@/components/ErrorBox";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://tactica-backend-hdbd.onrender.com";

/** Strip diacritics so "Guéhi" matches when the user types "guehi". */
function normalizeStr(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// ── Types (aligned exactly to new FPL API backend) ─────────────────────────────

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
  opponent: string; venue: string; date: string;
  fdr: number; fdr_label: string; fdr_colour: string; multiplier: number;
}
interface FplPlayer {
  id?: number;
  name: string; team?: string; position: string;
  price: number;        // real FPL £m price
  ownership: number;    // real FPL % ownership
  ppg: number;          // points per game
  total_pts: number;
  ep_next: number;      // expected points next GW
  goals: number; assists: number;
  xg90: number; xa90: number;
  minutes: number; form: number;
  status: string; news?: string;
  fpl_score: number;
  weighted_score: number;
  value_score?: number;
  diff_score?: number;
  next_fixture: NextFixture;
  reason: string;
}
interface CaptainResponse {
  team: string; recommendation: string;
  next_fixture: NextFixture; picks: FplPlayer[];
  share_text: string; cached: boolean;
}
interface TransferResponse {
  position: string; min_price: number; max_price: number;
  total_found: number; picks: FplPlayer[];
  share_text: string; cached: boolean;
}
interface DiffResponse {
  position: string; max_ownership: number; max_price: number;
  total_found: number; picks: FplPlayer[];
  share_text: string; cached: boolean;
}
interface PlayerListItem {
  id: number; name: string; search_name?: string; team: string; position: string;
  price: number; status: string;
}
interface TransferSuggestion {
  out: FplPlayer; in: FplPlayer; reason: string; flagged: boolean;
}
interface SquadResponse {
  formation: string;
  starting_xi: FplPlayer[]; bench: FplPlayer[];
  captain: FplPlayer; vice_captain: FplPlayer | null;
  squad_value: number; bank: number;
  transfer_suggestions: TransferSuggestion[];
  share_text: string; cached: boolean;
}

// ── FDR colour maps ────────────────────────────────────────────────────────────

const FDR_BG: Record<string, string> = {
  green: "bg-grn/15 border-grn/40",
  amber: "bg-amber/15 border-amber/40",
  red: "bg-red/15 border-red/40",
};
const FDR_TX: Record<string, string> = { green: "text-grn", amber: "text-amber", red: "text-red" };
const FDR_DOT: Record<string, string> = { green: "bg-grn", amber: "bg-amber", red: "bg-red" };

// --- Confirmed PL teams from FPL bootstrap -----------------------------------

const PL_TEAMS = [
  "AFC Bournemouth", "Arsenal", "Aston Villa", "Brentford", "Brighton & Hove Albion",
  "Chelsea", "Coventry City", "Crystal Palace", "Everton", "Fulham",
  "Hull City", "Ipswich Town", "Leeds United", "Liverpool", "Manchester City",
  "Manchester United", "Newcastle United", "Nottingham Forest", "Sunderland", "Tottenham Hotspur",
].sort();

// Positions — must match backend exactly (FWD/MID/DEF/GKP)
const POSITIONS = [
  { id: "FWD", label: "⚽ Forwards" },
  { id: "MID", label: "🎭 Midfielders" },
  { id: "DEF", label: "🛡️ Defenders" },
  { id: "GKP", label: "🧤 Goalkeepers" },
];

const POS_LABEL: Record<string, string> = {
  FWD: "Forwards", MID: "Midfielders", DEF: "Defenders", GKP: "Goalkeepers"
};

// ── Shared UI ──────────────────────────────────────────────────────────────────

function FdrBadge({ fdr, label, colour }: { fdr: number; label: string; colour: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold
                     ${FDR_BG[colour] || ""} ${FDR_TX[colour] || ""}`}>
      <div className={`w-2 h-2 rounded-full ${FDR_DOT[colour] || ""}`} />
      FDR {fdr} · {label}
    </div>
  );
}

function ShareBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => {
      await navigator.clipboard.writeText(text).catch(() => { });
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-volt/30
                  bg-volt/8 text-volt text-xs font-bold hover:bg-volt/15 transition-colors">
      {copied ? "✅ Copied!" : "🐦 Copy tweet"}
    </button>
  );
}

// PlayerCard uses ONLY FPL API fields (ppg, xg90, xa90, ep_next, price, ownership)
function PlayerCard({ pick, rank, showTeam = false }: {
  pick: FplPlayer; rank: number; showTeam?: boolean;
}) {
  const nf = pick.next_fixture || {};
  const isTop = rank === 1;
  return (
    <div className={`card space-y-3 ${isTop ? "border-volt/30 bg-volt/5" : ""}`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                         font-black text-sm border ${isTop ? "bg-volt/15 border-volt/40 text-volt" : "bg-sur2 border-bd text-mt"
          }`}>
          {isTop ? "★" : rank}
        </div>

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
            <span className="text-[10px] font-mono text-volt border border-volt/20 rounded px-1.5 py-0.5">
              £{(pick.price ?? 0).toFixed(1)}m
            </span>
            <span className="text-[10px] font-mono text-mt border border-bd rounded px-1.5 py-0.5">
              {(pick.ownership ?? 0).toFixed(1)}% owned
            </span>
            {pick.status && pick.status !== "a" && (
              <span className="text-[10px] font-bold text-amber border border-amber/30 rounded px-1.5 py-0.5">
                {pick.status === "d" ? "⚠️ Doubt" : "❌ Out"}
              </span>
            )}
          </div>
          {pick.news && (
            <p className="text-amber text-[10px] mt-0.5">{pick.news}</p>
          )}
          <p className="text-mt text-xs mt-1 leading-relaxed line-clamp-2">{pick.reason}</p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-mt uppercase tracking-wider">Score</p>
          <p className={`font-black ${isTop ? "text-volt text-lg" : "text-white text-sm"}`}>
            {(pick.weighted_score ?? 0).toFixed(1)}
          </p>
        </div>
      </div>

      {/* FPL stats — real API fields */}
      <div className={`grid grid-cols-4 gap-2 ${isTop ? "" : "opacity-80"}`}>
        {[
          { label: "Pts/G", val: (pick.ppg ?? 0).toFixed(1), hi: (pick.ppg ?? 0) >= 5.0 },
          { label: "xG/90", val: (pick.xg90 ?? 0).toFixed(2), hi: (pick.xg90 ?? 0) >= 0.3 },
          { label: "xA/90", val: (pick.xa90 ?? 0).toFixed(2), hi: (pick.xa90 ?? 0) >= 0.2 },
          { label: "ep_next", val: (pick.ep_next ?? 0).toFixed(1), hi: (pick.ep_next ?? 0) >= 5 },
        ].map(({ label, val, hi }) => (
          <div key={label} className={`text-center py-2 rounded-lg border ${hi ? "border-volt/30 bg-volt/8" : "border-bd bg-sur2"
            }`}>
            <p className={`text-sm font-black ${hi ? "text-volt" : "text-white"}`}>{val}</p>
            <p className="text-[10px] text-mt uppercase tracking-wider mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Next fixture */}
      {nf.opponent && nf.opponent !== "Unknown" && nf.fdr_colour && (
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${FDR_BG[nf.fdr_colour] || ""}`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${FDR_DOT[nf.fdr_colour] || ""}`} />
          <p className={`text-xs flex-1 ${FDR_TX[nf.fdr_colour] || ""}`}>
            <span className="font-bold">Next:</span>{" "}
            {nf.venue === "H" ? "Home" : "Away"} vs {nf.opponent}
            {nf.date && <span className="opacity-70"> · {nf.date}</span>}
          </p>
          <FdrBadge fdr={nf.fdr} label={nf.fdr_label} colour={nf.fdr_colour} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-mt border-t border-bd/40 pt-2">
        <span>{pick.total_pts ?? 0} pts last season · {pick.minutes ?? 0} min</span>
        {pick.value_score != null && (
          <span className="text-cyan font-bold">Value: {pick.value_score.toFixed(2)}</span>
        )}
        {pick.diff_score != null && pick.value_score == null && (
          <span className="text-volt font-bold">Diff score: {pick.diff_score.toFixed(2)}</span>
        )}
      </div>
    </div>
  );
}

// Price range input with presets
function PriceRange({ min, max, onMin, onMax }: {
  min: number; max: number;
  onMin: (v: number) => void; onMax: (v: number) => void;
}) {
  const presets = [
    { label: "Budget", min: 3.5, max: 6.0 },
    { label: "Mid", min: 6.0, max: 9.0 },
    { label: "Premium", min: 9.0, max: 12.0 },
    { label: "Elite", min: 12.0, max: 20.0 },
  ];
  return (
    <div>
      <p className="section-label mb-1">Price Range (£m)</p>
      <div className="flex gap-2 flex-wrap mb-3">
        {presets.map(p => (
          <button key={p.label} onClick={() => { onMin(p.min); onMax(p.max); }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${min === p.min && max === p.max
                ? "bg-volt/10 border-volt/40 text-volt"
                : "border-bd text-mt hover:border-volt/20 hover:text-white"
              }`}>
            {p.label} (£{p.min}–£{p.max}m)
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-mt uppercase tracking-wider mb-1 block">Min £m</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-volt font-bold text-sm">£</span>
            <input type="number" min={0} max={20} step={0.5} value={min}
              onChange={e => onMin(parseFloat(e.target.value) || 0)}
              className="w-full bg-bg border border-bd rounded-xl pl-7 pr-3 py-2.5
                         text-white font-bold text-sm focus:border-volt/50 focus:outline-none" />
          </div>
        </div>
        <span className="text-mt mt-5 text-sm">→</span>
        <div className="flex-1">
          <label className="text-[10px] text-mt uppercase tracking-wider mb-1 block">Max £m</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-volt font-bold text-sm">£</span>
            <input type="number" min={3} max={30} step={0.5} value={max}
              onChange={e => onMax(parseFloat(e.target.value) || 15)}
              className="w-full bg-bg border border-bd rounded-xl pl-7 pr-3 py-2.5
                         text-white font-bold text-sm focus:border-volt/50 focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic fetch helper
async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof e?.detail === "string" ? e.detail : `Error ${res.status}`);
  }
  return res.json();
}

// ── Step 1: Fixture Ticker ─────────────────────────────────────────────────────

function FixtureTicker() {
  const [team, setTeam] = useState("Arsenal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<TickerResponse | null>(null);

  const fetch_ = async () => {
    setLoading(true); setError(""); setData(null);
    try { setData(await apiFetch(`${API_BASE}/api/fpl/fixtures?team=${encodeURIComponent(team)}&gws=38`)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  const easy = data?.fixtures.filter(f => f.fdr_colour === "green").length ?? 0;
  const hard = data?.fixtures.filter(f => f.fdr_colour === "red").length ?? 0;
  const total = data?.fixtures.length ?? 0;

  return (
    <div className="space-y-5">
      <p className="text-mt text-sm">All fixtures rated by difficulty. Green = buy · Red = sell.</p>
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
          <div className="flex gap-4 text-xs text-mt">
            {[["green", "Easy (1–2)"], ["amber", "Medium (3)"], ["red", "Hard (4–5)"]].map(([c, l]) => (
              <div key={c} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${FDR_DOT[c]}`} />{l}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {data.fixtures.map((fix, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${FDR_BG[fix.fdr_colour]}`}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${FDR_DOT[fix.fdr_colour]}`} />
                <div className="w-16 flex-shrink-0">
                  {fix.gameweek != null && <p className="text-[10px] font-bold uppercase opacity-60">GW{fix.gameweek}</p>}
                  <p className="text-xs font-bold">{fix.date}</p>
                </div>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 border ${fix.venue === "H" ? "bg-volt/10 border-volt/30 text-volt" : "bg-white/5 border-white/15 text-mt"
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
          <div className="card border-volt/20">
            <p className="section-label mb-2">📊 Quick Read</p>
            <p className="text-sm text-white leading-relaxed">
              {easy >= total * 0.6
                ? `${data.team} have an excellent run — ${easy}/${total} fixtures easy. Strong to hold their attackers.`
                : hard >= total * 0.6
                  ? `Tough run for ${data.team} — ${hard}/${total} hard. Be selective.`
                  : `${data.team}: ${easy} easy, ${total - easy - hard} medium, ${hard} hard.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Captain Pick ───────────────────────────────────────────────────────

function CaptainPick() {
  const [mode, setMode] = useState<"club" | "squad">("club");
  const [team, setTeam] = useState("Arsenal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<CaptainResponse | null>(null);

  const fetch_ = async () => {
    setLoading(true); setError(""); setData(null);
    try { setData(await apiFetch(`${API_BASE}/api/fpl/captain?team=${encodeURIComponent(team)}&top=5`)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 p-1 bg-sur2 border border-bd rounded-xl">
        {([["club", "🏟️ By Club"], ["squad", "👤 My Squad"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === id ? "bg-volt/15 text-volt" : "text-mt hover:text-white"
              }`}>
            {label}
          </button>
        ))}
      </div>

      {mode === "squad" ? <MySquad /> : <>
        <p className="text-mt text-sm">
          Captain candidates ranked by pts/game × xG × fixture difficulty.
          Real FPL prices and ownership from the official API.
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
              <div>
                <p className="font-display font-bold text-lg text-white">{data.team}</p>
                <p className="text-mt text-xs">Ranked by FPL pts/game × fixture difficulty</p>
              </div>
              <div className="flex items-center gap-2">
                {data.cached && <span className="text-mt text-[10px] border border-bd px-2 py-0.5 rounded-full">📦 cached</span>}
                <ShareBtn text={data.share_text} />
              </div>
            </div>
            <div className="space-y-3">
              {data.picks.map((pick, i) => (
                <PlayerCard key={pick.id ?? i} pick={pick} rank={i + 1} />
              ))}
            </div>
            <details className="card cursor-pointer group">
              <summary className="flex items-center justify-between text-mt text-sm select-none">
                <span>⚙️ How scoring works</span>
                <span className="group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="mt-3 space-y-2 text-xs text-mt leading-relaxed border-t border-bd pt-3">
                <p><span className="text-white font-bold">FPL score</span> = ppg×2 + xG/90×3 + xA/90×2 + form×0.5 + ep_next×0.3</p>
                <p><span className="text-white font-bold">Weighted</span> = FPL score × fixture multiplier (FDR1=×1.30 → FDR5=×0.70)</p>
                <p>Real FPL API data — actual prices, ownership %, and expected points.</p>
              </div>
            </details>
          </div>
        )}
      </>}
    </div>
  );
}

// ── My Squad mode ──────────────────────────────────────────────────────────────

function PlayerSlot({ label, player, onPick, onClear, allPlayers, taken }: {
  label: string;
  player: PlayerListItem | null;
  onPick: (p: PlayerListItem) => void;
  onClear: () => void;
  allPlayers: PlayerListItem[];
  taken: Set<number>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = query.trim().length < 2 ? [] : allPlayers
    .filter(p => !taken.has(p.id) && normalizeStr(p.name + " " + (p.search_name || "")).includes(normalizeStr(query)))
    .slice(0, 12);

  if (player) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-volt/30 bg-volt/5">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{player.name}</p>
          <p className="text-mt text-[10px]">{player.team} · £{player.price.toFixed(1)}m
            {player.status !== "a" && <span className="text-amber"> · flagged</span>}</p>
        </div>
        <button onClick={onClear} className="text-mt hover:text-red text-xs font-bold px-2">✕</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={`Search ${label}…`}
        className="w-full bg-bg border border-bd rounded-xl px-3 py-2.5 text-sm text-white
                   placeholder:text-mt/50 focus:border-volt/50 focus:outline-none"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-sur border border-bd rounded-xl overflow-hidden shadow-xl">
          {matches.map(m => (
            <button key={m.id}
              onMouseDown={() => { onPick(m); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-volt/10 flex items-center justify-between gap-2">
              <span className="text-white truncate">{m.name}</span>
              <span className="text-mt text-[10px] flex-shrink-0">{m.team} · £{m.price.toFixed(1)}m</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MySquad() {
  const [allPlayers, setAllPlayers] = useState<PlayerListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [squad, setSquad] = useState<Record<string, (PlayerListItem | null)[]>>({
    GKP: [null, null], DEF: [null, null, null, null, null],
    MID: [null, null, null, null, null], FWD: [null, null, null],
  });
  const [bank, setBank] = useState(0.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SquadResponse | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/fpl/players`)
      .then(r => r.json())
      .then(d => setAllPlayers(d.players || []))
      .catch(() => setError("Couldn't load player list."))
      .finally(() => setLoadingList(false));
  }, []);

  const taken = new Set(
    Object.values(squad).flat().filter((p): p is PlayerListItem => !!p).map(p => p.id)
  );
  const filledCount = Object.values(squad).flat().filter(Boolean).length;

  const setSlot = (pos: string, idx: number, val: PlayerListItem | null) => {
    setSquad(prev => {
      const next = { ...prev, [pos]: [...prev[pos]] };
      next[pos][idx] = val;
      return next;
    });
  };

  const fetch_ = async () => {
    const ids = Object.values(squad).flat().filter((p): p is PlayerListItem => !!p).map(p => p.id);
    if (ids.length !== 15) { setError("Fill all 15 squad slots first."); return; }
    setLoading(true); setError(""); setData(null);
    try {
      setData(await apiFetch(
        `${API_BASE}/api/fpl/squad?player_ids=${ids.join(",")}&bank=${bank}`
      ));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  const posLabels: Record<string, string> = { GKP: "Goalkeepers", DEF: "Defenders", MID: "Midfielders", FWD: "Forwards" };

  return (
    <div className="space-y-5">
      <p className="text-mt text-sm">
        Enter your real 15-man squad. Tactica builds your best starting XI, picks a captain,
        and flags transfers worth making — based on form, fixtures, and your bank.
      </p>

      <div className="card space-y-4">
        {loadingList ? (
          <p className="text-mt text-sm">Loading player list…</p>
        ) : (
          Object.entries(squad).map(([pos, slots]) => (
            <div key={pos}>
              <p className="section-label mb-2">{posLabels[pos]} ({slots.filter(Boolean).length}/{slots.length})</p>
              <div className="grid grid-cols-1 gap-2">
                {slots.map((p, i) => (
                  <PlayerSlot key={i} label={pos} player={p} allPlayers={allPlayers} taken={taken}
                    onPick={(picked) => setSlot(pos, i, picked)}
                    onClear={() => setSlot(pos, i, null)} />
                ))}
              </div>
            </div>
          ))
        )}

        <div>
          <p className="section-label mb-1">Bank (£m remaining)</p>
          <input type="number" min={0} max={50} step={0.1} value={bank}
            onChange={e => setBank(parseFloat(e.target.value) || 0)}
            className="w-full bg-bg border border-bd rounded-xl px-4 py-2.5
                       text-white font-bold text-sm focus:border-volt/50 focus:outline-none" />
        </div>

        <button onClick={fetch_} disabled={loading || filledCount !== 15}
          className="btn-volt w-full py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? <><span className="animate-spin">🎯</span> Analysing squad…</>
            : <>🎯 Analyse My Squad ({filledCount}/15)</>}
        </button>
      </div>

      <ErrorBox msg={error} />

      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-display font-bold text-lg text-white">Formation {data.formation}</p>
              <p className="text-mt text-xs">
                Squad value £{data.squad_value}m + £{data.bank}m bank
              </p>
            </div>
            <ShareBtn text={data.share_text} />
          </div>

          <div className="card border-volt/30 bg-volt/5 space-y-2">
            <p className="section-label">👑 Captain</p>
            <PlayerCard pick={data.captain} rank={1} showTeam />
            {data.vice_captain && (
              <>
                <p className="section-label mt-3">🥈 Vice-Captain</p>
                <PlayerCard pick={data.vice_captain} rank={2} showTeam />
              </>
            )}
          </div>

          <div>
            <p className="section-label mb-2">Starting XI</p>
            <div className="space-y-2">
              {data.starting_xi
                .filter(p => p.id !== data.captain.id && p.id !== data.vice_captain?.id)
                .map((p, i) => <PlayerCard key={p.id ?? i} pick={p} rank={i + 3} showTeam />)}
            </div>
          </div>

          <div>
            <p className="section-label mb-2">Bench</p>
            <div className="space-y-2 opacity-70">
              {data.bench.map((p, i) => <PlayerCard key={p.id ?? i} pick={p} rank={i + 1} showTeam />)}
            </div>
          </div>

          {data.transfer_suggestions.length > 0 && (
            <div>
              <p className="section-label mb-2">🔄 Suggested Transfers</p>
              <div className="space-y-3">
                {data.transfer_suggestions.map((t, i) => (
                  <div key={i} className={`card space-y-2 ${t.flagged ? "border-red/30 bg-red/5" : "border-cyan/30 bg-cyan/5"}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span className="text-white">{t.out.name}</span>
                      <span className="text-mt">➡</span>
                      <span className="text-volt">{t.in.name}</span>
                      {t.flagged && <span className="text-[10px] text-red border border-red/30 rounded px-1.5 py-0.5">⚠️ Flagged</span>}
                    </div>
                    <p className="text-mt text-xs leading-relaxed">{t.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Transfer Recommender ──────────────────────────────────────────────

function TransferRecommender() {
  const [position, setPosition] = useState("FWD");   // FWD/MID/DEF/GKP
  const [minPrice, setMinPrice] = useState(0.0);
  const [maxPrice, setMaxPrice] = useState(9.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<TransferResponse | null>(null);

  const fetch_ = async () => {
    if (minPrice >= maxPrice) { setError("Min price must be less than max."); return; }
    setLoading(true); setError(""); setData(null);
    try {
      setData(await apiFetch(
        `${API_BASE}/api/fpl/transfers?position=${position}&min_price=${minPrice}&max_price=${maxPrice}&limit=10`
      ));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <p className="text-mt text-sm">
        Best transfer targets across all PL clubs. Real FPL prices in £.
        Ranked by points output relative to price.
      </p>
      <div className="card space-y-5">
        <div>
          <p className="section-label mb-2">Position</p>
          <div className="flex gap-2 flex-wrap">
            {POSITIONS.map(p => (
              <button key={p.id} onClick={() => setPosition(p.id)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${position === p.id
                    ? "bg-volt/10 border-volt/40 text-volt"
                    : "border-bd text-mt hover:border-volt/20 hover:text-white"
                  }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <PriceRange min={minPrice} max={maxPrice} onMin={setMinPrice} onMax={setMaxPrice} />
        <button onClick={fetch_} disabled={loading}
          className="btn-volt w-full py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? <><span className="animate-spin">🔄</span> Scanning all PL clubs…</>
            : <>🔄 Find Transfer Targets</>}
        </button>
      </div>
      <ErrorBox msg={error} />
      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-display font-bold text-lg text-white">
                Top {data.picks.length} {POS_LABEL[data.position] ?? data.position}
              </p>
              <p className="text-mt text-xs">
                {data.total_found} candidates · £{data.min_price}–£{data.max_price}m · by value score
              </p>
            </div>
            <div className="flex items-center gap-2">
              {data.cached && <span className="text-mt text-[10px] border border-bd px-2 py-0.5 rounded-full">📦 cached</span>}
              <ShareBtn text={data.share_text} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-mt bg-sur2 rounded-xl px-4 py-3 border border-bd">
            <span>💡</span>
            <span>
              <span className="text-white font-bold">Value score</span> = (pts/game × fixture) ÷ £price.
              High output, low price wins.
            </span>
          </div>
          <div className="space-y-3">
            {data.picks.map((pick, i) => (
              <PlayerCard key={pick.id ?? i} pick={pick} rank={i + 1} showTeam />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Differential Finder ───────────────────────────────────────────────

function DifferentialFinder() {
  const [position, setPosition] = useState("FWD");  // FWD/MID/DEF/GKP
  const [maxOwnership, setMaxOwnership] = useState(15.0);
  const [maxPrice, setMaxPrice] = useState(8.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DiffResponse | null>(null);

  const fetch_ = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      setData(await apiFetch(
        `${API_BASE}/api/fpl/differentials?position=${position}&max_ownership=${maxOwnership}&max_price=${maxPrice}&limit=8`
      ));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-volt/5 border border-volt/20 rounded-xl px-4 py-3 text-sm text-mt">
        <span className="text-volt font-bold">What is a differential?</span>{" "}
        A player with low real FPL ownership % who is in form with an easy fixture.
        When they haul, you gain on every rival who doesn&apos;t have them.
      </div>
      <div className="card space-y-5">
        <div>
          <p className="section-label mb-2">Position</p>
          <div className="flex gap-2 flex-wrap">
            {POSITIONS.map(p => (
              <button key={p.id} onClick={() => setPosition(p.id)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${position === p.id
                    ? "bg-volt/10 border-volt/40 text-volt"
                    : "border-bd text-mt hover:border-volt/20 hover:text-white"
                  }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="section-label mb-1">Max Ownership %</p>
          <p className="text-mt text-xs mb-2">Real FPL selected_by_percent</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {[5, 10, 15, 20, 25].map(v => (
              <button key={v} onClick={() => setMaxOwnership(v)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${maxOwnership === v
                    ? "bg-volt/10 border-volt/40 text-volt"
                    : "border-bd text-mt hover:border-volt/20 hover:text-white"
                  }`}>
                &lt;{v}%
              </button>
            ))}
          </div>
          <div className="relative">
            <input type="number" min={1} max={50} step={1} value={maxOwnership}
              onChange={e => setMaxOwnership(parseFloat(e.target.value) || 15)}
              className="w-full bg-bg border border-bd rounded-xl px-4 py-2.5
                         text-white font-bold text-sm focus:border-volt/50 focus:outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-mt text-xs">%</span>
          </div>
        </div>

        <div>
          <p className="section-label mb-1">Max Price (£m)</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {[5.5, 6.5, 7.5, 8.5, 10.0].map(v => (
              <button key={v} onClick={() => setMaxPrice(v)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${maxPrice === v
                    ? "bg-volt/10 border-volt/40 text-volt"
                    : "border-bd text-mt hover:border-volt/20 hover:text-white"
                  }`}>
                £{v}m
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-volt font-bold text-sm">£</span>
            <input type="number" min={3} max={20} step={0.5} value={maxPrice}
              onChange={e => setMaxPrice(parseFloat(e.target.value) || 8)}
              className="w-full bg-bg border border-bd rounded-xl pl-7 pr-3 py-2.5
                         text-white font-bold text-sm focus:border-volt/50 focus:outline-none" />
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
                Top Differential {POS_LABEL[data.position] ?? data.position}
              </p>
              <p className="text-mt text-xs">
                {data.total_found} candidates · under {data.max_ownership}% owned ·
                under £{data.max_price}m · easy fixtures only
              </p>
            </div>
            <div className="flex items-center gap-2">
              {data.cached && <span className="text-mt text-[10px] border border-bd px-2 py-0.5 rounded-full">📦 cached</span>}
              <ShareBtn text={data.share_text} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: "📉", label: "Low ownership", sub: "Real FPL % data" },
              { icon: "🔥", label: "In form", sub: "High pts/game + xG" },
              { icon: "🟢", label: "Easy fixture", sub: "FDR ≤ 3 only" },
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
              <div key={pick.id ?? i} className="relative">
                {i === 0 && (
                  <div className="absolute -top-2 left-4 z-10">
                    <span className="bg-volt text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                      🔥 TOP DIFFERENTIAL
                    </span>
                  </div>
                )}
                <PlayerCard pick={pick} rank={i + 1} showTeam />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root page ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: "ticker", label: "📅 Fixtures" },
  { id: "captain", label: "🎯 Captain" },
  { id: "transfer", label: "🔄 Transfers" },
  { id: "diff", label: "💡 Differentials" },
] as const;

type Tab = typeof TABS[number]["id"];

export default function FplPage() {
  const [tab, setTab] = useState<Tab>("ticker");
  return (
    <div className="max-w-screen-md mx-auto px-5 py-10 space-y-6">
      <div>
        <p className="section-label mb-2">FPL Scout</p>
        <h1 className="font-display font-black text-3xl text-white mb-1">Fantasy Premier League</h1>
        <p className="text-mt text-sm leading-relaxed">
          Real FPL prices · Real ownership % · Fixture difficulty · AI picks
        </p>
      </div>
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 px-2 rounded-xl border text-xs font-bold transition-all ${tab === t.id
                ? "bg-volt/10 border-volt/40 text-volt"
                : "border-bd text-mt hover:border-volt/20 hover:text-white"
              }`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "ticker" && <FixtureTicker />}
      {tab === "captain" && <CaptainPick />}
      {tab === "transfer" && <TransferRecommender />}
      {tab === "diff" && <DifferentialFinder />}
    </div>
  );
}
