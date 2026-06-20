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
  bsd_resolved?: { team: string | null; opp: string | null };
  warnings?: string[];
}
 
export interface NationsLineupPlayer {
  name: string;
  pos: string;
  club: string;
  caps: number;
  goals: number;
  age: number;
  score: number;
  fallback?: boolean;
}
 
export interface NationsLineupResponse {
  nation: string;
  formation: string;
  xi: NationsLineupPlayer[];
  count: number;
  squad_size: number;
  bsd_resolved: string | null;
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
 
  // NEW: probable Starting XI for a national team
  nationsLineup: (body: { nation_id: number; nation_name: string; formation: string }) =>
    apiFetch<NationsLineupResponse>("/api/nations/lineup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
 
// ── European clubs — BSD-verified spellings ───────────────────────────────────
export const EUROPEAN_TEAMS = [
  "Arsenal","Aston Villa","Bournemouth","Brentford","Brighton",
  "Chelsea","Crystal Palace","Everton","Fulham","Ipswich",
  "Leicester City","Liverpool","Manchester City","Manchester United",
  "Newcastle United","Nottingham Forest","Southampton",
  "Tottenham Hotspur","West Ham United","Wolverhampton",
  "Real Madrid","Barcelona","Atletico Madrid","Athletic Bilbao",
  "Real Sociedad","Real Betis","Villarreal","Valencia","Sevilla",
  "Osasuna","Girona","Getafe","Rayo Vallecano","Mallorca",
  "Las Palmas","Celta Vigo","Alaves","Leganes",
  "Bayern Munich","Borussia Dortmund","Bayer Leverkusen","RB Leipzig",
  "Eintracht Frankfurt","Stuttgart","Freiburg","Union Berlin",
  "Werder Bremen","Borussia Monchengladbach","Augsburg","Wolfsburg",
  "Hoffenheim","Mainz","Heidenheim","Bochum","Holstein Kiel","St Pauli",
  "Inter Milan","AC Milan","Juventus","Napoli","Atalanta","Roma",
  "Lazio","Fiorentina","Bologna","Torino","Udinese","Genoa",
  "Cagliari","Verona","Empoli","Parma","Como","Venezia","Lecce","Monza",
  "Paris Saint-Germain","Monaco","Marseille","Lyon","Lille",
  "Lens","Nice","Rennes","Brest","Reims","Montpellier",
  "Toulouse","Strasbourg","Le Havre","Saint-Etienne","Angers",
  "Ajax","PSV Eindhoven","Feyenoord","AZ Alkmaar","Utrecht","Twente",
  "Benfica","Porto","Sporting CP","Braga","Guimaraes",
  "Celtic","Rangers",
  "Club Brugge","Anderlecht","Genk",
  "Galatasaray","Fenerbahce","Besiktas","Trabzonspor",
  "Red Bull Salzburg","Sturm Graz",
  "Slavia Prague","Sparta Prague",
  "Olympiakos","Panathinaikos","PAOK",
].sort();
 
// ── World Cup 2026 — FIFA-confirmed final 48 (locked March 2026) ─────────────
// Source verified against FIFA.com qualified-teams page, March 31 2026 update.
export const WC_2026_NATIONS = [
  // CONCACAF (6) — 3 hosts + 3 qualifiers
  { id: 1,  name: "Canada",        flag: "🇨🇦", conf: "CONCACAF", bsdNames: ["Canada"] },
  { id: 2,  name: "Mexico",        flag: "🇲🇽", conf: "CONCACAF", bsdNames: ["Mexico", "México"] },
  { id: 3,  name: "USA",           flag: "🇺🇸", conf: "CONCACAF", bsdNames: ["USA", "United States"] },
  { id: 4,  name: "Curaçao",       flag: "🇨🇼", conf: "CONCACAF", bsdNames: ["Curacao", "Curaçao"] },
  { id: 5,  name: "Haiti",         flag: "🇭🇹", conf: "CONCACAF", bsdNames: ["Haiti"] },
  { id: 6,  name: "Panama",        flag: "🇵🇦", conf: "CONCACAF", bsdNames: ["Panama", "Panamá"] },
  // CONMEBOL (6)
  { id: 7,  name: "Argentina",     flag: "🇦🇷", conf: "CONMEBOL", bsdNames: ["Argentina"] },
  { id: 8,  name: "Brazil",        flag: "🇧🇷", conf: "CONMEBOL", bsdNames: ["Brazil", "Brasil"] },
  { id: 9,  name: "Colombia",      flag: "🇨🇴", conf: "CONMEBOL", bsdNames: ["Colombia"] },
  { id: 10, name: "Ecuador",       flag: "🇪🇨", conf: "CONMEBOL", bsdNames: ["Ecuador"] },
  { id: 11, name: "Paraguay",      flag: "🇵🇾", conf: "CONMEBOL", bsdNames: ["Paraguay"] },
  { id: 12, name: "Uruguay",       flag: "🇺🇾", conf: "CONMEBOL", bsdNames: ["Uruguay"] },
  // UEFA (16)
  { id: 13, name: "Austria",       flag: "🇦🇹", conf: "UEFA", bsdNames: ["Austria"] },
  { id: 14, name: "Belgium",       flag: "🇧🇪", conf: "UEFA", bsdNames: ["Belgium", "Belgique"] },
  { id: 15, name: "Bosnia and Herzegovina", flag: "🇧🇦", conf: "UEFA", bsdNames: ["Bosnia and Herzegovina", "Bosnia"] },
  { id: 16, name: "Croatia",       flag: "🇭🇷", conf: "UEFA", bsdNames: ["Croatia", "Hrvatska"] },
  { id: 17, name: "Czechia",       flag: "🇨🇿", conf: "UEFA", bsdNames: ["Czechia", "Czech Republic"] },
  { id: 18, name: "England",       flag: "🇬🇧", conf: "UEFA", bsdNames: ["England"] },
  { id: 19, name: "France",        flag: "🇫🇷", conf: "UEFA", bsdNames: ["France"] },
  { id: 20, name: "Germany",       flag: "🇩🇪", conf: "UEFA", bsdNames: ["Germany", "Deutschland"] },
  { id: 21, name: "Netherlands",   flag: "🇳🇱", conf: "UEFA", bsdNames: ["Netherlands", "Holland"] },
  { id: 22, name: "Norway",        flag: "🇳🇴", conf: "UEFA", bsdNames: ["Norway", "Norge"] },
  { id: 23, name: "Portugal",      flag: "🇵🇹", conf: "UEFA", bsdNames: ["Portugal"] },
  { id: 24, name: "Scotland",      flag: "🏴", conf: "UEFA", bsdNames: ["Scotland"] },
  { id: 25, name: "Spain",         flag: "🇪🇸", conf: "UEFA", bsdNames: ["Spain", "España"] },
  { id: 26, name: "Sweden",        flag: "🇸🇪", conf: "UEFA", bsdNames: ["Sweden", "Sverige"] },
  { id: 27, name: "Switzerland",   flag: "🇨🇭", conf: "UEFA", bsdNames: ["Switzerland", "Schweiz"] },
  { id: 28, name: "Türkiye",       flag: "🇹🇷", conf: "UEFA", bsdNames: ["Turkey", "Türkiye"] },
  // CAF (10)
  { id: 29, name: "Algeria",       flag: "🇩🇿", conf: "CAF", bsdNames: ["Algeria"] },
  { id: 30, name: "Cabo Verde",    flag: "🇨🇻", conf: "CAF", bsdNames: ["Cabo Verde", "Cape Verde"] },
  { id: 31, name: "DR Congo",      flag: "🇨🇩", conf: "CAF", bsdNames: ["DR Congo", "Congo DR", "DRC", "Democratic Republic of Congo"] },
  { id: 32, name: "Côte d'Ivoire", flag: "🇨🇮", conf: "CAF", bsdNames: ["Cote d'Ivoire", "Côte d'Ivoire", "Ivory Coast"] },
  { id: 33, name: "Egypt",         flag: "🇪🇬", conf: "CAF", bsdNames: ["Egypt"] },
  { id: 34, name: "Ghana",         flag: "🇬🇭", conf: "CAF", bsdNames: ["Ghana"] },
  { id: 35, name: "Morocco",       flag: "🇲🇦", conf: "CAF", bsdNames: ["Morocco", "Maroc"] },
  { id: 36, name: "Senegal",       flag: "🇸🇳", conf: "CAF", bsdNames: ["Senegal"] },
  { id: 37, name: "South Africa",  flag: "🇿🇦", conf: "CAF", bsdNames: ["South Africa", "Bafana Bafana"] },
  { id: 38, name: "Tunisia",       flag: "🇹🇳", conf: "CAF", bsdNames: ["Tunisia", "Tunisie"] },
  // AFC (9)
  { id: 39, name: "Australia",     flag: "🇦🇺", conf: "AFC", bsdNames: ["Australia", "Socceroos"] },
  { id: 40, name: "Iraq",          flag: "🇮🇶", conf: "AFC", bsdNames: ["Iraq"] },
  { id: 41, name: "Iran",          flag: "🇮🇷", conf: "AFC", bsdNames: ["Iran", "IR Iran"] },
  { id: 42, name: "Japan",         flag: "🇯🇵", conf: "AFC", bsdNames: ["Japan", "Japon"] },
  { id: 43, name: "Jordan",        flag: "🇯🇴", conf: "AFC", bsdNames: ["Jordan"] },
  { id: 44, name: "South Korea",   flag: "🇰🇷", conf: "AFC", bsdNames: ["South Korea", "Korea Republic", "Korea South"] },
  { id: 45, name: "Qatar",         flag: "🇶🇦", conf: "AFC", bsdNames: ["Qatar"] },
  { id: 46, name: "Saudi Arabia",  flag: "🇸🇦", conf: "AFC", bsdNames: ["Saudi Arabia"] },
  { id: 47, name: "Uzbekistan",    flag: "🇺🇿", conf: "AFC", bsdNames: ["Uzbekistan"] },
  // OFC (1)
  { id: 48, name: "New Zealand",   flag: "🇳🇿", conf: "OFC", bsdNames: ["New Zealand", "All Whites"] },
];
 
export type WcNation = typeof WC_2026_NATIONS[number];
 
export const ALL_TEAMS = [
  ...EUROPEAN_TEAMS,
  ...WC_2026_NATIONS.map((n) => n.name),
].sort();
 
