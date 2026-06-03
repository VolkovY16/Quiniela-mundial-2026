// FIFA World Cup 2026 - Complete Official Data

export const GROUPS = {
  A: {
    name: 'Grupo A',
    teams: ['México', 'Corea del Sur', 'Sudáfrica', 'República Checa'],
    hostTeams: ['México'],
  },
  B: {
    name: 'Grupo B',
    teams: ['Canadá', 'Bosnia y Herzegovina', 'Qatar', 'Suiza'],
    hostTeams: ['Canadá'],
  },
  C: {
    name: 'Grupo C',
    teams: ['Brasil', 'Marruecos', 'Escocia', 'Haití'],
    hostTeams: [],
  },
  D: {
    name: 'Grupo D',
    teams: ['Estados Unidos', 'Australia', 'Paraguay', 'Turquía'],
    hostTeams: ['Estados Unidos'],
  },
  E: {
    name: 'Grupo E',
    teams: ['Alemania', 'Ecuador', 'Costa de Marfil', 'Curazao'],
    hostTeams: [],
  },
  F: {
    name: 'Grupo F',
    teams: ['Países Bajos', 'Japón', 'Túnez', 'Suecia'],
    hostTeams: [],
  },
  G: {
    name: 'Grupo G',
    teams: ['Bélgica', 'Irán', 'Egipto', 'Nueva Zelanda'],
    hostTeams: [],
  },
  H: {
    name: 'Grupo H',
    teams: ['España', 'Uruguay', 'Arabia Saudita', 'Cabo Verde'],
    hostTeams: [],
  },
  I: {
    name: 'Grupo I',
    teams: ['Francia', 'Senegal', 'Noruega', 'Irak'],
    hostTeams: [],
  },
  J: {
    name: 'Grupo J',
    teams: ['Argentina', 'Austria', 'Argelia', 'Jordania'],
    hostTeams: [],
  },
  K: {
    name: 'Grupo K',
    teams: ['Portugal', 'Colombia', 'Uzbekistán', 'R.D. Congo'],
    hostTeams: [],
  },
  L: {
    name: 'Grupo L',
    teams: ['Inglaterra', 'Croacia', 'Panamá', 'Ghana'],
    hostTeams: [],
  },
};

// Host teams that get double points
export const HOST_TEAMS = ['México', 'Canadá', 'Estados Unidos'];

// Generate group stage matches for each group
export function generateGroupMatches(group, groupId) {
  const teams = group.teams;
  const matches = [];
  let matchNum = 1;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const isDouble = HOST_TEAMS.includes(teams[i]) || HOST_TEAMS.includes(teams[j]);
      matches.push({
        id: `${groupId}_${matchNum}`,
        group: groupId,
        home: teams[i],
        away: teams[j],
        isDouble,
        phase: 'group',
      });
      matchNum++;
    }
  }
  return matches;
}

export function getAllGroupMatches() {
  const all = [];
  for (const [gId, group] of Object.entries(GROUPS)) {
    all.push(...generateGroupMatches(group, gId));
  }
  return all;
}

// Round of 32 bracket structure (FIFA official order)
// 16 winners + 16 runners-up + 8 best 3rd place = 32 teams
// Official R32 pairings (FIFA 2026 bracket):
export const R32_BRACKET = [
  // Match 73-88 (Round of 32)
  { id: 'r32_1', matchLabel: 'Partido R32-1', home: null, away: null, homeSource: 'A1', awaySource: 'B2', isDouble: false },
  { id: 'r32_2', matchLabel: 'Partido R32-2', home: null, away: null, homeSource: 'C1', awaySource: 'D2', isDouble: false },
  { id: 'r32_3', matchLabel: 'Partido R32-3', home: null, away: null, homeSource: 'B1', awaySource: '3rd_EFGIJL', isDouble: false },
  { id: 'r32_4', matchLabel: 'Partido R32-4', home: null, away: null, homeSource: 'A2', awaySource: 'C2', isDouble: false },
  { id: 'r32_5', matchLabel: 'Partido R32-5', home: null, away: null, homeSource: 'D1', awaySource: '3rd_ACDEIL', isDouble: false },
  { id: 'r32_6', matchLabel: 'Partido R32-6', home: null, away: null, homeSource: 'F1', awaySource: 'E2', isDouble: false },
  { id: 'r32_7', matchLabel: 'Partido R32-7', home: null, away: null, homeSource: 'E1', awaySource: '3rd_ABCFGL', isDouble: false },
  { id: 'r32_8', matchLabel: 'Partido R32-8', home: null, away: null, homeSource: 'G1', awaySource: 'H2', isDouble: false },
  { id: 'r32_9', matchLabel: 'Partido R32-9', home: null, away: null, homeSource: 'H1', awaySource: 'G2', isDouble: false },
  { id: 'r32_10', matchLabel: 'Partido R32-10', home: null, away: null, homeSource: 'I1', awaySource: 'J2', isDouble: false },
  { id: 'r32_11', matchLabel: 'Partido R32-11', home: null, away: null, homeSource: 'J1', awaySource: 'I2', isDouble: false },
  { id: 'r32_12', matchLabel: 'Partido R32-12', home: null, away: null, homeSource: 'K1', awaySource: '3rd_DEIJL', isDouble: false },
  { id: 'r32_13', matchLabel: 'Partido R32-13', home: null, away: null, homeSource: 'L1', awaySource: 'K2', isDouble: false },
  { id: 'r32_14', matchLabel: 'Partido R32-14', home: null, away: null, homeSource: 'F2', awaySource: '3rd_ABGHK', isDouble: false },
  { id: 'r32_15', matchLabel: 'Partido R32-15', home: null, away: null, homeSource: 'L2', awaySource: '3rd_BCDFHK', isDouble: false },
  { id: 'r32_16', matchLabel: 'Partido R32-16', home: null, away: null, homeSource: 'M1', awaySource: 'N2', isDouble: false },
];

// Round of 16 — winners of R32 pairs
export const R16_BRACKET = [
  { id: 'r16_1', home: null, away: null, homeSource: 'r32_1', awaySource: 'r32_2', isDouble: false },
  { id: 'r16_2', home: null, away: null, homeSource: 'r32_3', awaySource: 'r32_4', isDouble: false },
  { id: 'r16_3', home: null, away: null, homeSource: 'r32_5', awaySource: 'r32_6', isDouble: false },
  { id: 'r16_4', home: null, away: null, homeSource: 'r32_7', awaySource: 'r32_8', isDouble: false },
  { id: 'r16_5', home: null, away: null, homeSource: 'r32_9', awaySource: 'r32_10', isDouble: false },
  { id: 'r16_6', home: null, away: null, homeSource: 'r32_11', awaySource: 'r32_12', isDouble: false },
  { id: 'r16_7', home: null, away: null, homeSource: 'r32_13', awaySource: 'r32_14', isDouble: false },
  { id: 'r16_8', home: null, away: null, homeSource: 'r32_15', awaySource: 'r32_16', isDouble: false },
];

export const QF_BRACKET = [
  { id: 'qf_1', home: null, away: null, homeSource: 'r16_1', awaySource: 'r16_2', isDouble: false },
  { id: 'qf_2', home: null, away: null, homeSource: 'r16_3', awaySource: 'r16_4', isDouble: false },
  { id: 'qf_3', home: null, away: null, homeSource: 'r16_5', awaySource: 'r16_6', isDouble: false },
  { id: 'qf_4', home: null, away: null, homeSource: 'r16_7', awaySource: 'r16_8', isDouble: false },
];

export const SF_BRACKET = [
  { id: 'sf_1', home: null, away: null, homeSource: 'qf_1', awaySource: 'qf_2', isDouble: false },
  { id: 'sf_2', home: null, away: null, homeSource: 'qf_3', awaySource: 'qf_4', isDouble: false },
];

export const THIRD_PLACE = { id: 'third', home: null, away: null, homeSource: 'sf_1_loser', awaySource: 'sf_2_loser', isDouble: false };
export const FINAL = { id: 'final', home: null, away: null, homeSource: 'sf_1', awaySource: 'sf_2', isDouble: false };

export const PHASES = ['group', 'r32', 'r16', 'qf', 'sf', 'final'];
export const PHASE_LABELS = {
  group: 'Fase de Grupos',
  r32: 'Dieciseisavos',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  final: 'Final',
};

// Scoring rules
export const SCORING = {
  exactResult: 3,
  correctWinner: 1,
  doubleMultiplier: 2,
  bonusTopScorer: 10,
  bonusTopScoringTeam: 10,
};

export const FLAGS = {
  'México': '🇲🇽',
  'Corea del Sur': '🇰🇷',
  'Sudáfrica': '🇿🇦',
  'República Checa': '🇨🇿',
  'Canadá': '🇨🇦',
  'Bosnia y Herzegovina': '🇧🇦',
  'Qatar': '🇶🇦',
  'Suiza': '🇨🇭',
  'Brasil': '🇧🇷',
  'Marruecos': '🇲🇦',
  'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Haití': '🇭🇹',
  'Estados Unidos': '🇺🇸',
  'Australia': '🇦🇺',
  'Paraguay': '🇵🇾',
  'Turquía': '🇹🇷',
  'Alemania': '🇩🇪',
  'Ecuador': '🇪🇨',
  'Costa de Marfil': '🇨🇮',
  'Curazao': '🇨🇼',
  'Países Bajos': '🇳🇱',
  'Japón': '🇯🇵',
  'Túnez': '🇹🇳',
  'Suecia': '🇸🇪',
  'Bélgica': '🇧🇪',
  'Irán': '🇮🇷',
  'Egipto': '🇪🇬',
  'Nueva Zelanda': '🇳🇿',
  'España': '🇪🇸',
  'Uruguay': '🇺🇾',
  'Arabia Saudita': '🇸🇦',
  'Cabo Verde': '🇨🇻',
  'Francia': '🇫🇷',
  'Senegal': '🇸🇳',
  'Noruega': '🇳🇴',
  'Irak': '🇮🇶',
  'Argentina': '🇦🇷',
  'Austria': '🇦🇹',
  'Argelia': '🇩🇿',
  'Jordania': '🇯🇴',
  'Portugal': '🇵🇹',
  'Colombia': '🇨🇴',
  'Uzbekistán': '🇺🇿',
  'R.D. Congo': '🇨🇩',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croacia': '🇭🇷',
  'Panamá': '🇵🇦',
  'Ghana': '🇬🇭',
};
