// lib/api.ts — Tactica Engine API client
// Connects to the FastAPI backend deployed on Render.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://your-app.onrender.com";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FormationResult {
  formation: string;
  probability: number;
}

export interface PredictResponse {
  best_formation: string;
  probability: number;
  my_attack: number;
  my_defence: number;
  opp_attack: number;
  opp_defence: number;
  all_formations: FormationResult[];
}

export interface Player {
  name: string;
  pos: string;
  spec_pos: string;
  minutes: number;
  g_a: number;
  fallback?: boolean;
}

export interface LineupResponse {
  team_name: string;
  formation: string;
  xi: Player[];
  count: number;
}

export interface Match {
  fixture_id: number;
  opponent: string;
  competition: string;
  scored: number;
  conceded: number;
  result: "W" | "D" | "L";
  formation: string;
}

export interface FormResponse {
  team: string;
  bsd_name: string;
  matches: Match[];
  attack: number;
  defence: number;
  best_formation: string | null;
  cached: boolean;
}

export interface LiveResponse {
  match_found: boolean;
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
  minute?: number;
  competition?: string;
  status?: string;
  cached?: boolean;
  stale?: boolean;
  live_count?: number;
}

export interface SquadPlayer {
  Name: string;
  Pos: string;
  SpecPos: string;
  Min: number;
  G_A: number;
}

export interface SquadResponse {
  team_name: string;
  bsd_name: string;
  count: number;
  players: SquadPlayer[];
  cached: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export interface NationsPredictResponse {
  team: string;
  opponent: string;
  my_attack: number;
  my_defence: number;
  opp_attack: number;
  opp_defence: number;
  best_formation: string;
  probability: number;
  all_formations: FormationResult[];
  my_squad_count: number;
  opp_squad_count: number;
  players_scored: number;
}

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── API methods ───────────────────────────────────────────────────────────────

export const api = {
  health: () =>
    apiFetch<{ status: string; service: string }>("/api/health"),

  predict: (body: {
    my_team: string;
    opp_team: string;
    my_att?: number;
    my_def?: number;
    opp_att?: number;
    opp_def?: number;
    familiarity_formation?: string;
    opp_habit_formation?: string;
  }) =>
    apiFetch<PredictResponse>("/api/predict", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  lineup: (team_name: string, formation: string) =>
    apiFetch<LineupResponse>("/api/lineup", {
      method: "POST",
      body: JSON.stringify({ team_name, formation }),
    }),

  form: (team: string) =>
    apiFetch<FormResponse>(`/api/form?team=${encodeURIComponent(team)}`),

  live: (home: string, away: string) =>
    apiFetch<LiveResponse>(
      `/api/live?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}`
    ),

  squad: (team: string) =>
    apiFetch<SquadResponse>(`/api/squad?team=${encodeURIComponent(team)}`),

  chat: (body: {
    my_team: string;
    opp_team: string;
    message: string;
    history: ChatMessage[];
    live_context?: string;
    squad?: SquadPlayer[];
  }) =>
    apiFetch<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Nations predict — now sends team_name + opp_name so the backend
  // can do name-based lookup when BSD IDs are unknown
  nationsPredict: (body: {
    team_id: number;
    opp_id: number;
    team_name: string;
    opp_name: string;
  }) =>
    apiFetch<NationsPredictResponse>("/api/nations/predict", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ── European clubs — BSD-verified spellings ───────────────────────────────────
// These names are passed directly to the BSD fuzzy matcher.
// Use full official names so the fuzzy match always resolves.
export const EUROPEAN_TEAMS = [
  // Premier League
  "Arsenal","Aston Villa","Bournemouth","Brentford","Brighton",
  "Chelsea","Crystal Palace","Everton","Fulham","Ipswich",
  "Leicester City","Liverpool","Manchester City","Manchester United",
  "Newcastle United","Nottingham Forest","Southampton",
  "Tottenham Hotspur","West Ham United","Wolverhampton",
  // La Liga
  "Real Madrid","Barcelona","Atletico Madrid","Athletic Bilbao",
  "Real Sociedad","Real Betis","Villarreal","Valencia","Sevilla",
  "Osasuna","Girona","Getafe","Rayo Vallecano","Mallorca",
  "Las Palmas","Celta Vigo","Alaves","Leganes",
  // Bundesliga
  "Bayern Munich","Borussia Dortmund","Bayer Leverkusen","RB Leipzig",
  "Eintracht Frankfurt","Stuttgart","Freiburg","Union Berlin",
  "Werder Bremen","Borussia Monchengladbach","Augsburg","Wolfsburg",
  "Hoffenheim","Mainz","Heidenheim","Bochum","Holstein Kiel","St Pauli",
  // Serie A
  "Inter Milan","AC Milan","Juventus","Napoli","Atalanta","Roma",
  "Lazio","Fiorentina","Bologna","Torino","Udinese","Genoa",
  "Cagliari","Verona","Empoli","Parma","Como","Venezia","Lecce","Monza",
  // Ligue 1
  "Paris Saint-Germain","Monaco","Marseille","Lyon","Lille",
  "Lens","Nice","Rennes","Brest","Reims","Montpellier",
  "Toulouse","Strasbourg","Le Havre","Saint-Etienne","Angers",
  // Eredivisie
  "Ajax","PSV Eindhoven","Feyenoord","AZ Alkmaar","Utrecht","Twente",
  // Primeira Liga
  "Benfica","Porto","Sporting CP","Braga","Guimaraes",
  // Scottish
  "Celtic","Rangers",
  // Belgium
  "Club Brugge","Anderlecht","Genk",
  // Turkey
  "Galatasaray","Fenerbahce","Besiktas","Trabzonspor",
  // Austria
  "Red Bull Salzburg","Sturm Graz",
  // Czech
  "Slavia Prague","Sparta Prague",
  // Greece
  "Olympiakos","Panathinaikos","PAOK",
].sort();

// ── World Cup 2026 — all 48 qualified nations ─────────────────────────────────
// id: used as a reference key (not BSD's internal ID).
// The backend now resolves by name, so the id is just for local state.
// flag: using standard emoji where reliable; UK nations use text fallback.
export const WC_2026_NATIONS = [
  // CONMEBOL (6)
  { id: 1,  name: "Argentina",     flag: "🇦🇷", conf: "CONMEBOL", code: "AR" },
  { id: 2,  name: "Brazil",        flag: "🇧🇷", conf: "CONMEBOL", code: "BR" },
  { id: 3,  name: "Colombia",      flag: "🇨🇴", conf: "CONMEBOL", code: "CO" },
  { id: 4,  name: "Ecuador",       flag: "🇪🇨", conf: "CONMEBOL", code: "EC" },
  { id: 5,  name: "Uruguay",       flag: "🇺🇾", conf: "CONMEBOL", code: "UY" },
  { id: 6,  name: "Venezuela",     flag: "🇻🇪", conf: "CONMEBOL", code: "VE" },
  // UEFA (16)
  { id: 7,  name: "France",        flag: "🇫🇷", conf: "UEFA",     code: "FR" },
  { id: 8,  name: "Spain",         flag: "🇪🇸", conf: "UEFA",     code: "ES" },
  { id: 9,  name: "Germany",       flag: "🇩🇪", conf: "UEFA",     code: "DE" },
  { id: 10, name: "England",       flag: "🇬🇧", conf: "UEFA",     code: "ENG"},
  { id: 11, name: "Portugal",      flag: "🇵🇹", conf: "UEFA",     code: "PT" },
  { id: 12, name: "Netherlands",   flag: "🇳🇱", conf: "UEFA",     code: "NL" },
  { id: 13, name: "Belgium",       flag: "🇧🇪", conf: "UEFA",     code: "BE" },
  { id: 14, name: "Italy",         flag: "🇮🇹", conf: "UEFA",     code: "IT" },
  { id: 15, name: "Switzerland",   flag: "🇨🇭", conf: "UEFA",     code: "CH" },
  { id: 16, name: "Denmark",       flag: "🇩🇰", conf: "UEFA",     code: "DK" },
  { id: 17, name: "Croatia",       flag: "🇭🇷", conf: "UEFA",     code: "HR" },
  { id: 18, name: "Austria",       flag: "🇦🇹", conf: "UEFA",     code: "AT" },
  { id: 19, name: "Serbia",        flag: "🇷🇸", conf: "UEFA",     code: "RS" },
  { id: 20, name: "Scotland",      flag: "🏴",   conf: "UEFA",     code: "SCO"},
  { id: 21, name: "Poland",        flag: "🇵🇱", conf: "UEFA",     code: "PL" },
  { id: 22, name: "Turkey",        flag: "🇹🇷", conf: "UEFA",     code: "TR" },
  // CAF (9)
  { id: 23, name: "Morocco",       flag: "🇲🇦", conf: "CAF",      code: "MA" },
  { id: 24, name: "Senegal",       flag: "🇸🇳", conf: "CAF",      code: "SN" },
  { id: 25, name: "Nigeria",       flag: "🇳🇬", conf: "CAF",      code: "NG" },
  { id: 26, name: "Cameroon",      flag: "🇨🇲", conf: "CAF",      code: "CM" },
  { id: 27, name: "Egypt",         flag: "🇪🇬", conf: "CAF",      code: "EG" },
  { id: 28, name: "South Africa",  flag: "🇿🇦", conf: "CAF",      code: "ZA" },
  { id: 29, name: "Mali",          flag: "🇲🇱", conf: "CAF",      code: "ML" },
  { id: 30, name: "DR Congo",      flag: "🇨🇩", conf: "CAF",      code: "CD" },
  { id: 31, name: "Tunisia",       flag: "🇹🇳", conf: "CAF",      code: "TN" },
  // AFC (8)
  { id: 32, name: "Japan",         flag: "🇯🇵", conf: "AFC",      code: "JP" },
  { id: 33, name: "South Korea",   flag: "🇰🇷", conf: "AFC",      code: "KR" },
  { id: 34, name: "Iran",          flag: "🇮🇷", conf: "AFC",      code: "IR" },
  { id: 35, name: "Australia",     flag: "🇦🇺", conf: "AFC",      code: "AU" },
  { id: 36, name: "Saudi Arabia",  flag: "🇸🇦", conf: "AFC",      code: "SA" },
  { id: 37, name: "Uzbekistan",    flag: "🇺🇿", conf: "AFC",      code: "UZ" },
  { id: 38, name: "Jordan",        flag: "🇯🇴", conf: "AFC",      code: "JO" },
  { id: 39, name: "Iraq",          flag: "🇮🇶", conf: "AFC",      code: "IQ" },
  // CONCACAF (6)
  { id: 40, name: "USA",           flag: "🇺🇸", conf: "CONCACAF", code: "US" },
  { id: 41, name: "Mexico",        flag: "🇲🇽", conf: "CONCACAF", code: "MX" },
  { id: 42, name: "Canada",        flag: "🇨🇦", conf: "CONCACAF", code: "CA" },
  { id: 43, name: "Costa Rica",    flag: "🇨🇷", conf: "CONCACAF", code: "CR" },
  { id: 44, name: "Honduras",      flag: "🇭🇳", conf: "CONCACAF", code: "HN" },
  { id: 45, name: "Panama",        flag: "🇵🇦", conf: "CONCACAF", code: "PA" },
  // OFC (1)
  { id: 46, name: "New Zealand",   flag: "🇳🇿", conf: "OFC",      code: "NZ" },
  // Intercontinental playoff spots (3) — update names once confirmed
  { id: 47, name: "Bolivia",       flag: "🇧🇴", conf: "CONMEBOL", code: "BO" },
  { id: 48, name: "Paraguay",      flag: "🇵🇾", conf: "CONMEBOL", code: "PY" },
].sort((a, b) => a.name.localeCompare(b.name));

export type WcNation = typeof WC_2026_NATIONS[number];

export const ALL_TEAMS = [
  ...EUROPEAN_TEAMS,
  ...WC_2026_NATIONS.map((n) => n.name),
].sort();
