// lib/api.ts — Tactica Engine API client
// Connects to the FastAPI backend deployed on Render.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://tactica-backend-hdbd.onrender.com";

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
  { id: 1,  name: "Argentina",              flag: "🇦🇷", conf: "CONMEBOL", code: "AR" },
  { id: 2,  name: "Brazil",                 flag: "🇧🇷", conf: "CONMEBOL", code: "BR" },
  { id: 3,  name: "Colombia",               flag: "🇨🇴", conf: "CONMEBOL", code: "CO" },
  { id: 4,  name: "Ecuador",                flag: "🇪🇨", conf: "CONMEBOL", code: "EC" },
  { id: 5,  name: "Paraguay",               flag: "🇵🇾", conf: "CONMEBOL", code: "PY" },
  { id: 6,  name: "Uruguay",                flag: "🇺🇾", conf: "CONMEBOL", code: "UY" },

  // UEFA (16)
  { id: 7,  name: "Austria",                flag: "🇦🇹", conf: "UEFA",     code: "AT" },
  { id: 8,  name: "Belgium",                flag: "🇧🇪", conf: "UEFA",     code: "BE" },
  { id: 9,  name: "Bosnia and Herzegovina", flag: "🇧🇦", conf: "UEFA",     code: "BA" },
  { id: 10, name: "Croatia",                flag: "🇭🇷", conf: "UEFA",     code: "HR" },
  { id: 11, name: "Czechia",                flag: "🇨🇿", conf: "UEFA",     code: "CZ" },
  { id: 12, name: "England",                flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", conf: "UEFA",     code: "ENG"},
  { id: 13, name: "France",                 flag: "🇫🇷", conf: "UEFA",     code: "FR" },
  { id: 14, name: "Germany",                flag: "🇩🇪", conf: "UEFA",     code: "DE" },
  { id: 15, name: "Netherlands",            flag: "🇳🇱", conf: "UEFA",     code: "NL" },
  { id: 16, name: "Norway",                 flag: "🇳🇴", conf: "UEFA",     code: "NO" },
  { id: 17, name: "Portugal",               flag: "🇵🇹", conf: "UEFA",     code: "PT" },
  { id: 18, name: "Scotland",               flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", conf: "UEFA",     code: "SCO"},
  { id: 19, name: "Spain",                  flag: "🇪🇸", conf: "UEFA",     code: "ES" },
  { id: 20, name: "Sweden",                 flag: "🇸🇪", conf: "UEFA",     code: "SE" },
  { id: 21, name: "Switzerland",            flag: "🇨🇭", conf: "UEFA",     code: "CH" },
  { id: 22, name: "Türkiye",                flag: "🇹🇷", conf: "UEFA",     code: "TR" },

  // CAF (10)
  { id: 23, name: "Algeria",                flag: "🇩🇿", conf: "CAF",      code: "DZ" },
  { id: 24, name: "Cabo Verde",             flag: "🇨🇻", conf: "CAF",      code: "CV" },
  { id: 25, name: "Côte d'Ivoire",          flag: "🇨🇮", conf: "CAF",      code: "CI" },
  { id: 26, name: "DR Congo",               flag: "🇨🇩", conf: "CAF",      code: "CD" },
  { id: 27, name: "Egypt",                  flag: "🇪🇬", conf: "CAF",      code: "EG" },
  { id: 28, name: "Ghana",                  flag: "🇬🇭", conf: "CAF",      code: "GH" },
  { id: 29, name: "Morocco",                flag: "🇲🇦", conf: "CAF",      code: "MA" },
  { id: 30, name: "Senegal",                flag: "🇸🇳", conf: "CAF",      code: "SN" },
  { id: 31, name: "South Africa",           flag: "🇿🇦", conf: "CAF",      code: "ZA" },
  { id: 32, name: "Tunisia",                flag: "🇹🇳", conf: "CAF",      code: "TN" },

  // AFC (9)
  { id: 33, name: "Australia",              flag: "🇦🇺", conf: "AFC",      code: "AU" },
  { id: 34, name: "Iran",                   flag: "🇮🇷", conf: "AFC",      code: "IR" },
  { id: 35, name: "Iraq",                   flag: "🇮🇶", conf: "AFC",      code: "IQ" },
  { id: 36, name: "Japan",                  flag: "🇯🇵", conf: "AFC",      code: "JP" },
  { id: 37, name: "Jordan",                 flag: "🇯🇴", conf: "AFC",      code: "JO" },
  { id: 38, name: "Qatar",                  flag: "🇶🇦", conf: "AFC",      code: "QA" },
  { id: 39, name: "Saudi Arabia",           flag: "🇸🇦", conf: "AFC",      code: "SA" },
  { id: 40, name: "South Korea",            flag: "🇰🇷", conf: "AFC",      code: "KR" },
  { id: 41, name: "Uzbekistan",             flag: "🇺🇿", conf: "AFC",      code: "UZ" },

  // CONCACAF (6)
  { id: 42, name: "Canada",                 flag: "🇨🇦", conf: "CONCACAF", code: "CA" },
  { id: 43, name: "Curaçao",                flag: "🇨🇼", conf: "CONCACAF", code: "CW" },
  { id: 44, name: "Haiti",                  flag: "🇭🇹", conf: "CONCACAF", code: "HT" },
  { id: 45, name: "Mexico",                 flag: "🇲🇽", conf: "CONCACAF", code: "MX" },
  { id: 46, name: "Panama",                 flag: "🇵🇦", conf: "CONCACAF", code: "PA" },
  { id: 47, name: "United States",          flag: "🇺🇸", conf: "CONCACAF", code: "US" },

  // OFC (1)
  { id: 48, name: "New Zealand",            flag: "🇳🇿", conf: "OFC",      code: "NZ" }
].sort((a, b) => a.name.localeCompare(b.name));

export type WcNation = typeof WC_2026_NATIONS[number];

export const ALL_TEAMS = [
  ...EUROPEAN_TEAMS,
  ...WC_2026_NATIONS.map((n) => n.name),
].sort();
