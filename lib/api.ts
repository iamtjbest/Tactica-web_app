// lib/api.ts — Tactica Engine API client
// Connects to the FastAPI backend deployed on Render.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://tactica-backend-hdbd.onrender.com";

// ── BSD name normalisation ────────────────────────────────────────────────────
// The backend bsd_find_team now retries with shorter queries, but sending the
// exact BSD name still produces the fastest, most reliable lookup.
// Display names that differ from what BSD stores are aliased here.

const BSD_NAME_MAP: Record<string, string> = {
  // ── Premier League ──────────────────────────────────────────────────────────
  "Manchester United":   "Manchester United",
  "Newcastle United":    "Newcastle United",
  "Nottingham Forest":   "Nottingham Forest",
  "Tottenham Hotspur":   "Tottenham",
  "Liverpool":           "Liverpool F.C.",
  "Brighton":            "Brighton & Hove Albion",
  "Brighton & Hove Albion": "Brighton & Hove Albion",
  "Bournemouth":         "AFC Bournemouth",
  "Coventry City":       "Coventry City",
  "Hull City":           "Hull City",
  "Ipswich Town":        "Ipswich Town",
  "Leeds United":        "Leeds United",
  "Sunderland":          "Sunderland AFC",

  // ── La Liga ─────────────────────────────────────────────────────────────────
  "Athletic Bilbao":     "Athletic Club",
  "Atletico Madrid":     "Atlético Madrid",
  "Real Madrid":         "Real Madrid",       // explicit — was missing from old map
  "Barcelona":           "Barcelona",
  "Real Betis":          "Real Betis Balompié",
  "Real Sociedad":       "Real Sociedad",
  "Villarreal":          "Villarreal CF",
  "Celta Vigo":          "Celta de Vigo",
  "Alaves":              "Deportivo Alavés",
  "Espanyol":            "RCD Espanyol",
  "Getafe":              "Getafe CF",
  "Rayo Vallecano":      "Rayo Vallecano",
  "Osasuna":             "CA Osasuna",
  "Sevilla":             "Sevilla FC",
  "Valencia":            "Valencia CF",
  "Málaga":              "Málaga CF",

  // ── Bundesliga ───────────────────────────────────────────────────────────────
  "Bayern Munich":       "FC Bayern München",  // BSD stores German name
  "Borussia Dortmund":   "Borussia Dortmund",
  "RB Leipzig":          "RB Leipzig",
  "Bayer Leverkusen":    "Bayer 04 Leverkusen",
  "Eintracht Frankfurt": "Eintracht Frankfurt",
  "Stuttgart":           "VfB Stuttgart",
  "Freiburg":            "SC Freiburg",
  "Hoffenheim":          "TSG Hoffenheim",
  "Mainz":               "1. FSV Mainz 05",
  "Borussia Monchengladbach": "Borussia Mönchengladbach",
  "Union Berlin":        "1. FC Union Berlin",
  "Augsburg":            "FC Augsburg",
  "Werder Bremen":       "SV Werder Bremen",
  "1. FC Köln":          "1. FC Köln",
  "Hamburger SV":        "Hamburger SV",
  "Schalke 04":          "FC Schalke 04",
  "SV Elversberg":       "SV Elversberg",
  "SC Paderborn":        "SC Paderborn 07",

  // ── Serie A ─────────────────────────────────────────────────────────────────
  "Inter Milan":         "Inter",             // BSD stores as "Inter" not "Inter Milan"
  "AC Milan":            "AC Milan",
  "Juventus":            "Juventus",
  "Napoli":              "SSC Napoli",
  "Roma":                "AS Roma",
  "Lazio":               "Lazio",
  "Atalanta":            "Atalanta",
  "Fiorentina":          "Fiorentina",
  "Bologna":             "Bologna",
  "Torino":              "Torino",
  "Udinese":             "Udinese",
  "Genoa":               "Genoa",
  "Cagliari":            "Cagliari",
  "Monza":               "Monza",
  "Como":                "Como",
  "Venezia":             "Venezia",
  "Lecce":               "US Lecce",
  "Empoli":              "Empoli",
  "Verona":              "Hellas Verona",
  "Parma":               "Parma",

  // ── Ligue 1 ─────────────────────────────────────────────────────────────────
  "Paris Saint-Germain": "Paris Saint-Germain",
  "Monaco":              "AS Monaco",
  "Marseille":           "Olympique de Marseille",
  "Lyon":                "Olympique Lyonnais",
  "Lille":               "LOSC Lille",
  "Lens":                "RC Lens",
  "Nice":                "OGC Nice",
  "Rennes":              "Stade Rennais FC",
  "Brest":               "Stade Brestois 29",
  "Reims":               "Stade de Reims",
  "Montpellier":         "Montpellier HSC",
  "Toulouse":            "Toulouse FC",
  "Strasbourg":          "RC Strasbourg Alsace",
  "Le Havre":            "Le Havre AC",
  "Saint-Etienne":       "AS Saint-Étienne",
  "Angers":              "Angers SCO",
  "Troyes":              "ESTAC Troyes",
  "Le Mans":             "Le Mans FC",
  "Paris FC":            "Paris FC",

  // ── Eredivisie ───────────────────────────────────────────────────────────────
  "Ajax":                "AFC Ajax",
  "PSV Eindhoven":       "PSV",              // BSD stores as "PSV" only
  "Feyenoord":           "Feyenoord",
  "AZ Alkmaar":          "AZ",
  "Utrecht":             "FC Utrecht",
  "Twente":              "FC Twente",

  // ── Primeira Liga ────────────────────────────────────────────────────────────
  "Benfica":             "SL Benfica",
  "Porto":               "FC Porto",
  "Sporting CP":         "Sporting CP",
  "Braga":               "SC Braga",
  "Guimaraes":           "Vitória SC",

  // ── Scottish ─────────────────────────────────────────────────────────────────
  "Celtic":              "Celtic",
  "Rangers":             "Rangers",

  // ── Belgian Pro League ───────────────────────────────────────────────────────
  "Club Brugge":         "Club Brugge KV",
  "Anderlecht":          "RSC Anderlecht",
  "Genk":                "KRC Genk",

  // ── Süper Lig ────────────────────────────────────────────────────────────────
  "Galatasaray":         "Galatasaray SK",
  "Fenerbahce":          "Fenerbahçe SK",    // accent critical for BSD lookup
  "Besiktas":            "Beşiktaş JK",
  "Trabzonspor":         "Trabzonspor",

  // ── Austrian Bundesliga ──────────────────────────────────────────────────────
  "Red Bull Salzburg":   "FC Red Bull Salzburg",
  "Sturm Graz":          "SK Sturm Graz",

  // ── Czech Liga ───────────────────────────────────────────────────────────────
  "Slavia Prague":       "SK Slavia Prague",   // was wrongly "Sparta Praha" — different club
  "Sparta Prague":       "AC Sparta Praha",

  // ── Greek Super League ───────────────────────────────────────────────────────
  "Olympiakos":          "Olympiacos",
  "Panathinaikos":       "Panathinaikos",
  "PAOK":                "PAOK",

  // ── UCL-specific clubs (Pot 3/4) not in main leagues above ──────────────────
  "Shakhtar Donetsk":    "Shakhtar Donetsk",
  "Aston Villa":         "Aston Villa",
  "Manchester City":     "Manchester City",
  "Arsenal":             "Arsenal",
};


export function bsdName(displayName: string): string {
  return BSD_NAME_MAP[displayName] ?? displayName;
}

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
  event_date?: string;
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

  form: (team: string) =>
    apiFetch<FormResponse>(`/api/form?team=${encodeURIComponent(bsdName(team))}`),

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
      body: JSON.stringify({
        ...body,
        my_team: bsdName(body.my_team),
        opp_team: bsdName(body.opp_team),
      }),
    }),

  lineup: (team_name: string, formation: string) =>
    apiFetch<LineupResponse>("/api/lineup", {
      method: "POST",
      body: JSON.stringify({ team_name: bsdName(team_name), formation }),
    }),

  live: (home: string, away: string) =>
    apiFetch<LiveResponse>(
      `/api/live?home=${encodeURIComponent(bsdName(home))}&away=${encodeURIComponent(bsdName(away))}`
    ),

  squad: (team: string) =>
    apiFetch<SquadResponse>(`/api/squad?team=${encodeURIComponent(bsdName(team))}`),

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
      body: JSON.stringify({
        ...body,
        my_team: bsdName(body.my_team),
        opp_team: bsdName(body.opp_team),
      }),
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

  nationsLineup: (body: { nation_id: number; nation_name: string; formation: string }) =>
    apiFetch<NationsLineupResponse>("/api/nations/lineup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ── Team lists ────────────────────────────────────────────────────────────────
// Display names used in the UI. bsdName() normalises before API calls.

export const EUROPEAN_TEAMS = [
  "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
  "Chelsea", "Coventry City", "Crystal Palace", "Everton", "Fulham",
  "Hull City", "Ipswich Town", "Leeds United", "Liverpool", "Manchester City",
  "Manchester United", "Newcastle United", "Nottingham Forest", "Sunderland",
  "Tottenham Hotspur", "Alaves", "Athletic Bilbao", "Atletico Madrid", "Barcelona",
  "Celta Vigo", "Deportivo A Coruña", "Elche", "Espanyol", "Getafe", "Levante",
  "Málaga", "Osasuna", "Racing Santander", "Rayo Vallecano", "Real Betis",
  "Real Madrid", "Real Sociedad", "Sevilla", "Valencia", "Villarreal", "Augsburg",
  "Union Berlin", "Werder Bremen", "Borussia Dortmund", "SV Elversberg",
  "Eintracht Frankfurt", "Freiburg", "Hamburger SV", "Hoffenheim", "1. FC Köln",
  "RB Leipzig", "Bayer Leverkusen", "Mainz", "Borussia Monchengladbach", "Bayern Munich"
  , "SC Paderborn", "Schalke 04", "Stuttgart", "Inter Milan", "AC Milan", "Juventus", "Napoli",
  "Atalanta", "Roma", "Lazio", "Fiorentina", "Bologna", "Torino", "Udinese", "Genoa", "Cagliari",
  "Verona", "Empoli", "Parma", "Como", "Venezia", "Lecce", "Monza", "Paris Saint-Germain", "Monaco",
  "Marseille", "Lyon", "Lille", "Lens", "Nice", "Rennes", "Brest", "Reims", "Montpellier", "Toulouse",
  "Strasbourg", "Le Havre", "Saint-Etienne", "Angers", "Troyes", "Le Mans", "Paris FC", "Ajax",
  "PSV Eindhoven", "Feyenoord", "AZ Alkmaar", "Utrecht", "Twente", "Benfica", "Porto", "Sporting CP",
  "Braga", "Guimaraes", "Celtic", "Rangers", "Club Brugge", "Anderlecht", "Genk", "Galatasaray",
  "Fenerbahce", "Besiktas", "Trabzonspor", "Red Bull Salzburg", "Sturm Graz", "Slavia Prague",
  "Sparta Prague", "Olympiakos", "Panathinaikos", "PAOK",
].sort();

// World Cup 2026 nations — unchanged from original
export const WC_2026_NATIONS = [
  { id: 1, name: "Canada", flag: "🇨🇦", conf: "CONCACAF", bsdNames: ["Canada"] },
  { id: 2, name: "Mexico", flag: "🇲🇽", conf: "CONCACAF", bsdNames: ["Mexico", "México"] },
  { id: 3, name: "USA", flag: "🇺🇸", conf: "CONCACAF", bsdNames: ["USA", "United States"] },
  { id: 4, name: "Curaçao", flag: "🇨🇼", conf: "CONCACAF", bsdNames: ["Curacao", "Curaçao"] },
  { id: 5, name: "Haiti", flag: "🇭🇹", conf: "CONCACAF", bsdNames: ["Haiti"] },
  { id: 6, name: "Panama", flag: "🇵🇦", conf: "CONCACAF", bsdNames: ["Panama", "Panamá"] },
  { id: 7, name: "Argentina", flag: "🇦🇷", conf: "CONMEBOL", bsdNames: ["Argentina"] },
  { id: 8, name: "Brazil", flag: "🇧🇷", conf: "CONMEBOL", bsdNames: ["Brazil", "Brasil"] },
  { id: 9, name: "Colombia", flag: "🇨🇴", conf: "CONMEBOL", bsdNames: ["Colombia"] },
  { id: 10, name: "Ecuador", flag: "🇪🇨", conf: "CONMEBOL", bsdNames: ["Ecuador"] },
  { id: 11, name: "Paraguay", flag: "🇵🇾", conf: "CONMEBOL", bsdNames: ["Paraguay"] },
  { id: 12, name: "Uruguay", flag: "🇺🇾", conf: "CONMEBOL", bsdNames: ["Uruguay"] },
  { id: 13, name: "Austria", flag: "🇦🇹", conf: "UEFA", bsdNames: ["Austria"] },
  { id: 14, name: "Belgium", flag: "🇧🇪", conf: "UEFA", bsdNames: ["Belgium", "Belgique"] },
  { id: 15, name: "Bosnia and Herzegovina", flag: "🇧🇦", conf: "UEFA", bsdNames: ["Bosnia and Herzegovina", "Bosnia"] },
  { id: 16, name: "Croatia", flag: "🇭🇷", conf: "UEFA", bsdNames: ["Croatia", "Hrvatska"] },
  { id: 17, name: "Czechia", flag: "🇨🇿", conf: "UEFA", bsdNames: ["Czechia", "Czech Republic"] },
  { id: 18, name: "England", flag: "🇬🇧", conf: "UEFA", bsdNames: ["England"] },
  { id: 19, name: "France", flag: "🇫🇷", conf: "UEFA", bsdNames: ["France"] },
  { id: 20, name: "Germany", flag: "🇩🇪", conf: "UEFA", bsdNames: ["Germany", "Deutschland"] },
  { id: 21, name: "Netherlands", flag: "🇳🇱", conf: "UEFA", bsdNames: ["Netherlands", "Holland"] },
  { id: 22, name: "Norway", flag: "🇳🇴", conf: "UEFA", bsdNames: ["Norway", "Norge"] },
  { id: 23, name: "Portugal", flag: "🇵🇹", conf: "UEFA", bsdNames: ["Portugal"] },
  { id: 24, name: "Scotland", flag: "🏴", conf: "UEFA", bsdNames: ["Scotland"] },
  { id: 25, name: "Spain", flag: "🇪🇸", conf: "UEFA", bsdNames: ["Spain", "España"] },
  { id: 26, name: "Sweden", flag: "🇸🇪", conf: "UEFA", bsdNames: ["Sweden", "Sverige"] },
  { id: 27, name: "Switzerland", flag: "🇨🇭", conf: "UEFA", bsdNames: ["Switzerland", "Schweiz"] },
  { id: 28, name: "Türkiye", flag: "🇹🇷", conf: "UEFA", bsdNames: ["Turkey", "Türkiye"] },
  { id: 29, name: "Algeria", flag: "🇩🇿", conf: "CAF", bsdNames: ["Algeria"] },
  { id: 30, name: "Cabo Verde", flag: "🇨🇻", conf: "CAF", bsdNames: ["Cabo Verde", "Cape Verde"] },
  { id: 31, name: "DR Congo", flag: "🇨🇩", conf: "CAF", bsdNames: ["DR Congo", "Congo DR", "DRC"] },
  { id: 32, name: "Côte d'Ivoire", flag: "🇨🇮", conf: "CAF", bsdNames: ["Cote d'Ivoire", "Côte d'Ivoire", "Ivory Coast"] },
  { id: 33, name: "Egypt", flag: "🇪🇬", conf: "CAF", bsdNames: ["Egypt"] },
  { id: 34, name: "Ghana", flag: "🇬🇭", conf: "CAF", bsdNames: ["Ghana"] },
  { id: 35, name: "Morocco", flag: "🇲🇦", conf: "CAF", bsdNames: ["Morocco", "Maroc"] },
  { id: 36, name: "Senegal", flag: "🇸🇳", conf: "CAF", bsdNames: ["Senegal"] },
  { id: 37, name: "South Africa", flag: "🇿🇦", conf: "CAF", bsdNames: ["South Africa"] },
  { id: 38, name: "Tunisia", flag: "🇹🇳", conf: "CAF", bsdNames: ["Tunisia", "Tunisie"] },
  { id: 39, name: "Australia", flag: "🇦🇺", conf: "AFC", bsdNames: ["Australia"] },
  { id: 40, name: "Iraq", flag: "🇮🇶", conf: "AFC", bsdNames: ["Iraq"] },
  { id: 41, name: "Iran", flag: "🇮🇷", conf: "AFC", bsdNames: ["Iran", "IR Iran"] },
  { id: 42, name: "Japan", flag: "🇯🇵", conf: "AFC", bsdNames: ["Japan"] },
  { id: 43, name: "Jordan", flag: "🇯🇴", conf: "AFC", bsdNames: ["Jordan"] },
  { id: 44, name: "South Korea", flag: "🇰🇷", conf: "AFC", bsdNames: ["South Korea", "Korea Republic"] },
  { id: 45, name: "Qatar", flag: "🇶🇦", conf: "AFC", bsdNames: ["Qatar"] },
  { id: 46, name: "Saudi Arabia", flag: "🇸🇦", conf: "AFC", bsdNames: ["Saudi Arabia"] },
  { id: 47, name: "Uzbekistan", flag: "🇺🇿", conf: "AFC", bsdNames: ["Uzbekistan"] },
  { id: 48, name: "New Zealand", flag: "🇳🇿", conf: "OFC", bsdNames: ["New Zealand"] },
];

export type WcNation = typeof WC_2026_NATIONS[number];

export const ALL_TEAMS = [
  ...EUROPEAN_TEAMS,
  ...WC_2026_NATIONS.map((n) => n.name),
].sort();
