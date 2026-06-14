// FIFA World Cup 2026 - Complete Official Data

export const GROUPS = {
  A: { name: 'Grupo A', teams: ['México', 'Sudáfrica', 'Corea del Sur', 'República Checa'], hostTeams: ['México'] },
  B: { name: 'Grupo B', teams: ['Canadá', 'Bosnia y Herzegovina', 'Qatar', 'Suiza'], hostTeams: ['Canadá'] },
  C: { name: 'Grupo C', teams: ['Brasil', 'Marruecos', 'Haití', 'Escocia'], hostTeams: [] },
  D: { name: 'Grupo D', teams: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'], hostTeams: ['Estados Unidos'] },
  E: { name: 'Grupo E', teams: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'], hostTeams: [] },
  F: { name: 'Grupo F', teams: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'], hostTeams: [] },
  G: { name: 'Grupo G', teams: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'], hostTeams: [] },
  H: { name: 'Grupo H', teams: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'], hostTeams: [] },
  I: { name: 'Grupo I', teams: ['Francia', 'Senegal', 'Irak', 'Noruega'], hostTeams: [] },
  J: { name: 'Grupo J', teams: ['Argentina', 'Argelia', 'Austria', 'Jordania'], hostTeams: [] },
  K: { name: 'Grupo K', teams: ['Portugal', 'R.D. Congo', 'Uzbekistán', 'Colombia'], hostTeams: [] },
  L: { name: 'Grupo L', teams: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'], hostTeams: [] },
};

export const HOST_TEAMS = ['México', 'Canadá', 'Estados Unidos'];

export const GROUP_MATCHES = [
  // GRUPO A
  { id: 'A_1', group: 'A', home: 'México', away: 'Sudáfrica', date: '2026-06-11', time: '15:00', venue: 'Estadio Ciudad de México', isDouble: true, phase: 'group' },
  { id: 'A_2', group: 'A', home: 'Corea del Sur', away: 'República Checa', date: '2026-06-11', time: '22:00', venue: 'Estadio Guadalajara', isDouble: false, phase: 'group' },
  { id: 'A_3', group: 'A', home: 'República Checa', away: 'Sudáfrica', date: '2026-06-18', time: '12:00', venue: 'Mercedes-Benz Stadium, Atlanta', isDouble: false, phase: 'group' },
  { id: 'A_4', group: 'A', home: 'México', away: 'Corea del Sur', date: '2026-06-18', time: '21:00', venue: 'Estadio Guadalajara', isDouble: true, phase: 'group' },
  { id: 'A_5', group: 'A', home: 'República Checa', away: 'México', date: '2026-06-24', time: '21:00', venue: 'Estadio Ciudad de México', isDouble: true, phase: 'group' },
  { id: 'A_6', group: 'A', home: 'Sudáfrica', away: 'Corea del Sur', date: '2026-06-24', time: '21:00', venue: 'Estadio Monterrey', isDouble: false, phase: 'group' },

  // GRUPO B
  { id: 'B_1', group: 'B', home: 'Canadá', away: 'Bosnia y Herzegovina', date: '2026-06-12', time: '15:00', venue: 'BMO Field, Toronto', isDouble: true, phase: 'group' },
  { id: 'B_2', group: 'B', home: 'Qatar', away: 'Suiza', date: '2026-06-13', time: '15:00', venue: 'Levi\'s Stadium, San Francisco', isDouble: false, phase: 'group' },
  { id: 'B_3', group: 'B', home: 'Suiza', away: 'Bosnia y Herzegovina', date: '2026-06-18', time: '15:00', venue: 'SoFi Stadium, Los Ángeles', isDouble: false, phase: 'group' },
  { id: 'B_4', group: 'B', home: 'Canadá', away: 'Qatar', date: '2026-06-18', time: '18:00', venue: 'BC Place, Vancouver', isDouble: true, phase: 'group' },
  { id: 'B_5', group: 'B', home: 'Suiza', away: 'Canadá', date: '2026-06-24', time: '15:00', venue: 'BC Place, Vancouver', isDouble: true, phase: 'group' },
  { id: 'B_6', group: 'B', home: 'Bosnia y Herzegovina', away: 'Qatar', date: '2026-06-24', time: '15:00', venue: 'CenturyLink Field, Seattle', isDouble: false, phase: 'group' },

  // GRUPO C
  { id: 'C_1', group: 'C', home: 'Brasil', away: 'Marruecos', date: '2026-06-13', time: '18:00', venue: 'MetLife Stadium, Nueva York', isDouble: false, phase: 'group' },
  { id: 'C_2', group: 'C', home: 'Haití', away: 'Escocia', date: '2026-06-13', time: '21:00', venue: 'Gillette Stadium, Boston', isDouble: false, phase: 'group' },
  { id: 'C_3', group: 'C', home: 'Escocia', away: 'Marruecos', date: '2026-06-19', time: '18:00', venue: 'Gillette Stadium, Boston', isDouble: false, phase: 'group' },
  { id: 'C_4', group: 'C', home: 'Brasil', away: 'Haití', date: '2026-06-19', time: '21:00', venue: 'Lincoln Financial Field, Filadelfia', isDouble: false, phase: 'group' },
  { id: 'C_5', group: 'C', home: 'Brasil', away: 'Escocia', date: '2026-06-24', time: '18:00', venue: 'Hard Rock Stadium, Miami', isDouble: false, phase: 'group' },
  { id: 'C_6', group: 'C', home: 'Marruecos', away: 'Haití', date: '2026-06-24', time: '18:00', venue: 'Mercedes-Benz Stadium, Atlanta', isDouble: false, phase: 'group' },

  // GRUPO D
  { id: 'D_1', group: 'D', home: 'Estados Unidos', away: 'Paraguay', date: '2026-06-12', time: '21:00', venue: 'SoFi Stadium, Los Ángeles', isDouble: true, phase: 'group' },
  { id: 'D_2', group: 'D', home: 'Australia', away: 'Turquía', date: '2026-06-13', time: '00:00', venue: 'BC Place, Vancouver', isDouble: false, phase: 'group' },
  { id: 'D_3', group: 'D', home: 'Estados Unidos', away: 'Australia', date: '2026-06-19', time: '15:00', venue: 'CenturyLink Field, Seattle', isDouble: true, phase: 'group' },
  { id: 'D_4', group: 'D', home: 'Turquía', away: 'Paraguay', date: '2026-06-19', time: '00:00', venue: 'Levi\'s Stadium, San Francisco', isDouble: false, phase: 'group' },
  { id: 'D_5', group: 'D', home: 'Turquía', away: 'Estados Unidos', date: '2026-06-25', time: '22:00', venue: 'SoFi Stadium, Los Ángeles', isDouble: true, phase: 'group' },
  { id: 'D_6', group: 'D', home: 'Paraguay', away: 'Australia', date: '2026-06-25', time: '22:00', venue: 'Levi\'s Stadium, San Francisco', isDouble: false, phase: 'group' },

  // GRUPO E
  { id: 'E_1', group: 'E', home: 'Alemania', away: 'Curazao', date: '2026-06-14', time: '13:00', venue: 'NRG Stadium, Houston', isDouble: false, phase: 'group' },
  { id: 'E_2', group: 'E', home: 'Costa de Marfil', away: 'Ecuador', date: '2026-06-14', time: '19:00', venue: 'Lincoln Financial Field, Filadelfia', isDouble: false, phase: 'group' },
  { id: 'E_3', group: 'E', home: 'Alemania', away: 'Costa de Marfil', date: '2026-06-20', time: '16:00', venue: 'BMO Field, Toronto', isDouble: false, phase: 'group' },
  { id: 'E_4', group: 'E', home: 'Ecuador', away: 'Curazao', date: '2026-06-20', time: '22:00', venue: 'Arrowhead Stadium, Kansas City', isDouble: false, phase: 'group' },
  { id: 'E_5', group: 'E', home: 'Curazao', away: 'Costa de Marfil', date: '2026-06-25', time: '16:00', venue: 'Lincoln Financial Field, Filadelfia', isDouble: false, phase: 'group' },
  { id: 'E_6', group: 'E', home: 'Ecuador', away: 'Alemania', date: '2026-06-25', time: '16:00', venue: 'MetLife Stadium, Nueva York', isDouble: false, phase: 'group' },

  // GRUPO F
  { id: 'F_1', group: 'F', home: 'Países Bajos', away: 'Japón', date: '2026-06-14', time: '16:00', venue: 'AT&T Stadium, Dallas', isDouble: false, phase: 'group' },
  { id: 'F_2', group: 'F', home: 'Suecia', away: 'Túnez', date: '2026-06-14', time: '22:00', venue: 'Estadio Monterrey', isDouble: false, phase: 'group' },
  { id: 'F_3', group: 'F', home: 'Países Bajos', away: 'Suecia', date: '2026-06-20', time: '13:00', venue: 'NRG Stadium, Houston', isDouble: false, phase: 'group' },
  { id: 'F_4', group: 'F', home: 'Túnez', away: 'Japón', date: '2026-06-20', time: '00:00', venue: 'Estadio Monterrey', isDouble: false, phase: 'group' },
  { id: 'F_5', group: 'F', home: 'Japón', away: 'Suecia', date: '2026-06-25', time: '19:00', venue: 'AT&T Stadium, Dallas', isDouble: false, phase: 'group' },
  { id: 'F_6', group: 'F', home: 'Túnez', away: 'Países Bajos', date: '2026-06-25', time: '19:00', venue: 'Arrowhead Stadium, Kansas City', isDouble: false, phase: 'group' },

  // GRUPO G
  { id: 'G_1', group: 'G', home: 'Bélgica', away: 'Egipto', date: '2026-06-15', time: '15:00', venue: 'CenturyLink Field, Seattle', isDouble: false, phase: 'group' },
  { id: 'G_2', group: 'G', home: 'Irán', away: 'Nueva Zelanda', date: '2026-06-15', time: '21:00', venue: 'SoFi Stadium, Los Ángeles', isDouble: false, phase: 'group' },
  { id: 'G_3', group: 'G', home: 'Bélgica', away: 'Irán', date: '2026-06-21', time: '15:00', venue: 'SoFi Stadium, Los Ángeles', isDouble: false, phase: 'group' },
  { id: 'G_4', group: 'G', home: 'Nueva Zelanda', away: 'Egipto', date: '2026-06-21', time: '21:00', venue: 'BC Place, Vancouver', isDouble: false, phase: 'group' },
  { id: 'G_5', group: 'G', home: 'Egipto', away: 'Irán', date: '2026-06-26', time: '23:00', venue: 'CenturyLink Field, Seattle', isDouble: false, phase: 'group' },
  { id: 'G_6', group: 'G', home: 'Nueva Zelanda', away: 'Bélgica', date: '2026-06-26', time: '23:00', venue: 'BC Place, Vancouver', isDouble: false, phase: 'group' },

  // GRUPO H
  { id: 'H_1', group: 'H', home: 'España', away: 'Cabo Verde', date: '2026-06-15', time: '12:00', venue: 'Mercedes-Benz Stadium, Atlanta', isDouble: false, phase: 'group' },
  { id: 'H_2', group: 'H', home: 'Arabia Saudita', away: 'Uruguay', date: '2026-06-15', time: '18:00', venue: 'Hard Rock Stadium, Miami', isDouble: false, phase: 'group' },
  { id: 'H_3', group: 'H', home: 'España', away: 'Arabia Saudita', date: '2026-06-21', time: '12:00', venue: 'Mercedes-Benz Stadium, Atlanta', isDouble: false, phase: 'group' },
  { id: 'H_4', group: 'H', home: 'Uruguay', away: 'Cabo Verde', date: '2026-06-21', time: '18:00', venue: 'Hard Rock Stadium, Miami', isDouble: false, phase: 'group' },
  { id: 'H_5', group: 'H', home: 'Cabo Verde', away: 'Arabia Saudita', date: '2026-06-26', time: '20:00', venue: 'NRG Stadium, Houston', isDouble: false, phase: 'group' },
  { id: 'H_6', group: 'H', home: 'Uruguay', away: 'España', date: '2026-06-26', time: '20:00', venue: 'Estadio Guadalajara', isDouble: false, phase: 'group' },

  // GRUPO I
  { id: 'I_1', group: 'I', home: 'Francia', away: 'Senegal', date: '2026-06-16', time: '15:00', venue: 'MetLife Stadium, Nueva York', isDouble: false, phase: 'group' },
  { id: 'I_2', group: 'I', home: 'Irak', away: 'Noruega', date: '2026-06-16', time: '18:00', venue: 'Gillette Stadium, Boston', isDouble: false, phase: 'group' },
  { id: 'I_3', group: 'I', home: 'Francia', away: 'Irak', date: '2026-06-22', time: '17:00', venue: 'Lincoln Financial Field, Filadelfia', isDouble: false, phase: 'group' },
  { id: 'I_4', group: 'I', home: 'Noruega', away: 'Senegal', date: '2026-06-22', time: '20:00', venue: 'MetLife Stadium, Nueva York', isDouble: false, phase: 'group' },
  { id: 'I_5', group: 'I', home: 'Noruega', away: 'Francia', date: '2026-06-26', time: '15:00', venue: 'Gillette Stadium, Boston', isDouble: false, phase: 'group' },
  { id: 'I_6', group: 'I', home: 'Senegal', away: 'Irak', date: '2026-06-26', time: '15:00', venue: 'BMO Field, Toronto', isDouble: false, phase: 'group' },

  // GRUPO J
  { id: 'J_1', group: 'J', home: 'Argentina', away: 'Argelia', date: '2026-06-16', time: '21:00', venue: 'Arrowhead Stadium, Kansas City', isDouble: false, phase: 'group' },
  { id: 'J_2', group: 'J', home: 'Austria', away: 'Jordania', date: '2026-06-17', time: '00:00', venue: 'Levi\'s Stadium, San Francisco', isDouble: false, phase: 'group' },
  { id: 'J_3', group: 'J', home: 'Argentina', away: 'Austria', date: '2026-06-22', time: '13:00', venue: 'AT&T Stadium, Dallas', isDouble: false, phase: 'group' },
  { id: 'J_4', group: 'J', home: 'Jordania', away: 'Argelia', date: '2026-06-22', time: '23:00', venue: 'Levi\'s Stadium, San Francisco', isDouble: false, phase: 'group' },
  { id: 'J_5', group: 'J', home: 'Argelia', away: 'Austria', date: '2026-06-27', time: '22:00', venue: 'Arrowhead Stadium, Kansas City', isDouble: false, phase: 'group' },
  { id: 'J_6', group: 'J', home: 'Jordania', away: 'Argentina', date: '2026-06-27', time: '22:00', venue: 'AT&T Stadium, Dallas', isDouble: false, phase: 'group' },

  // GRUPO K
  { id: 'K_1', group: 'K', home: 'Portugal', away: 'R.D. Congo', date: '2026-06-17', time: '13:00', venue: 'NRG Stadium, Houston', isDouble: false, phase: 'group' },
  { id: 'K_2', group: 'K', home: 'Uzbekistán', away: 'Colombia', date: '2026-06-17', time: '22:00', venue: 'Estadio Ciudad de México', isDouble: false, phase: 'group' },
  { id: 'K_3', group: 'K', home: 'Portugal', away: 'Uzbekistán', date: '2026-06-23', time: '13:00', venue: 'NRG Stadium, Houston', isDouble: false, phase: 'group' },
  { id: 'K_4', group: 'K', home: 'Colombia', away: 'R.D. Congo', date: '2026-06-23', time: '22:00', venue: 'Estadio Guadalajara', isDouble: false, phase: 'group' },
  { id: 'K_5', group: 'K', home: 'Colombia', away: 'Portugal', date: '2026-06-27', time: '19:30', venue: 'Hard Rock Stadium, Miami', isDouble: false, phase: 'group' },
  { id: 'K_6', group: 'K', home: 'R.D. Congo', away: 'Uzbekistán', date: '2026-06-27', time: '19:30', venue: 'Mercedes-Benz Stadium, Atlanta', isDouble: false, phase: 'group' },

  // GRUPO L
  { id: 'L_1', group: 'L', home: 'Inglaterra', away: 'Croacia', date: '2026-06-17', time: '16:00', venue: 'AT&T Stadium, Dallas', isDouble: false, phase: 'group' },
  { id: 'L_2', group: 'L', home: 'Ghana', away: 'Panamá', date: '2026-06-17', time: '19:00', venue: 'BMO Field, Toronto', isDouble: false, phase: 'group' },
  { id: 'L_3', group: 'L', home: 'Inglaterra', away: 'Ghana', date: '2026-06-23', time: '16:00', venue: 'Gillette Stadium, Boston', isDouble: false, phase: 'group' },
  { id: 'L_4', group: 'L', home: 'Panamá', away: 'Croacia', date: '2026-06-23', time: '19:00', venue: 'BMO Field, Toronto', isDouble: false, phase: 'group' },
  { id: 'L_5', group: 'L', home: 'Panamá', away: 'Inglaterra', date: '2026-06-27', time: '17:00', venue: 'MetLife Stadium, Nueva York', isDouble: false, phase: 'group' },
  { id: 'L_6', group: 'L', home: 'Croacia', away: 'Ghana', date: '2026-06-27', time: '17:00', venue: 'Lincoln Financial Field, Filadelfia', isDouble: false, phase: 'group' },
];

export function getAllGroupMatches() { return GROUP_MATCHES; }
export function generateGroupMatches(group, groupId) { return GROUP_MATCHES.filter(m => m.group === groupId); }

// ─── COMPUTE BEST THIRD PLACES ───────────────────────────────────────────────
export function computeThirdPlaces(picks) {
  const thirds = [];
  for (const [groupId, group] of Object.entries(GROUPS)) {
    const groupMatches = GROUP_MATCHES.filter(m => m.group === groupId);
    const table = {};
    for (const t of group.teams) table[t] = { team: t, group: groupId, pts: 0, gf: 0, ga: 0, gd: 0, played: 0, w: 0, d: 0, l: 0 };
    for (const match of groupMatches) {
      const pick = picks[match.id];
      if (!pick || pick.home_goals === null || pick.home_goals === undefined) continue;
      const rh = Number(pick.home_goals), ra = Number(pick.away_goals);
      if (isNaN(rh) || isNaN(ra)) continue;
      table[match.home].played++; table[match.away].played++;
      table[match.home].gf += rh; table[match.home].ga += ra;
      table[match.away].gf += ra; table[match.away].ga += rh;
      table[match.home].gd = table[match.home].gf - table[match.home].ga;
      table[match.away].gd = table[match.away].gf - table[match.away].ga;
      if (rh > ra) { table[match.home].pts += 3; table[match.home].w++; table[match.away].l++; }
      else if (rh < ra) { table[match.away].pts += 3; table[match.away].w++; table[match.home].l++; }
      else { table[match.home].pts++; table[match.home].d++; table[match.away].pts++; table[match.away].d++; }
    }
    const sorted = Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    if (sorted[2]) thirds.push(sorted[2]);
  }
  return thirds.sort((a, b) =>
    b.pts - a.pts ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    a.ga - b.ga ||
    a.group.localeCompare(b.group)
  );
}

export const THIRD_PLACE_SLOTS = {
  'r32_74': 'ABCDF',
  'r32_77': 'CDFGH',
  'r32_79': 'CEFHI',
  'r32_80': 'EHIJK',
  'r32_81': 'BEFIJ',
  'r32_82': 'AEHIJ',
  'r32_85': 'EFGIJ',
  'r32_87': 'DEIJL',
};

export function assignThirdsToSlots(sortedThirds) {
  const best8 = sortedThirds.slice(0, 8);
  const slots = Object.keys(THIRD_PLACE_SLOTS);
  const assigned = {};

  function backtrack(slotIdx, usedGroups) {
    if (slotIdx === slots.length) return true;
    const slot = slots[slotIdx];
    const validGroups = THIRD_PLACE_SLOTS[slot];

    for (const third of best8) {
      if (usedGroups.has(third.group)) continue;
      if (!validGroups.includes(third.group)) continue;
      assigned[slot] = third.team;
      usedGroups.add(third.group);
      if (backtrack(slotIdx + 1, usedGroups)) return true;
      delete assigned[slot];
      usedGroups.delete(third.group);
    }
    return false;
  }

  backtrack(0, new Set());
  return assigned;
}

// ─── OFFICIAL FIFA R32 BRACKET (matches 73-88) ──────────────────────────────
export const R32_BRACKET = [
  { id: 'r32_73', matchNum: 73, date: '2026-06-28', venue: 'SoFi Stadium, Los Ángeles',                homeSource: 'A2', awaySource: 'B2',   thirdSources: null },
  { id: 'r32_74', matchNum: 74, date: '2026-06-29', venue: 'Gillette Stadium, Boston',                  homeSource: 'E1', awaySource: null,   thirdSources: 'ABCDF' },
  { id: 'r32_75', matchNum: 75, date: '2026-06-29', venue: 'Estadio Monterrey',                         homeSource: 'F1', awaySource: 'C2',   thirdSources: null },
  { id: 'r32_76', matchNum: 76, date: '2026-06-29', venue: 'NRG Stadium, Houston',                      homeSource: 'C1', awaySource: 'F2',   thirdSources: null },
  { id: 'r32_77', matchNum: 77, date: '2026-06-30', venue: 'MetLife Stadium, Nueva York',               homeSource: 'I1', awaySource: null,   thirdSources: 'CDFGH' },
  { id: 'r32_78', matchNum: 78, date: '2026-06-30', venue: 'AT&T Stadium, Dallas',                      homeSource: 'E2', awaySource: 'I2',   thirdSources: null },
  { id: 'r32_79', matchNum: 79, date: '2026-06-30', venue: 'Estadio Azteca, Ciudad de México',          homeSource: 'A1', awaySource: null,   thirdSources: 'CEFHI' },
  { id: 'r32_80', matchNum: 80, date: '2026-07-01', venue: 'Mercedes-Benz Stadium, Atlanta',            homeSource: 'L1', awaySource: null,   thirdSources: 'EHIJK' },
  { id: 'r32_81', matchNum: 81, date: '2026-07-01', venue: 'Levi\'s Stadium, San Francisco',            homeSource: 'D1', awaySource: null,   thirdSources: 'BEFIJ' },
  { id: 'r32_82', matchNum: 82, date: '2026-07-01', venue: 'CenturyLink Field, Seattle',                homeSource: 'G1', awaySource: null,   thirdSources: 'AEHIJ' },
  { id: 'r32_83', matchNum: 83, date: '2026-07-02', venue: 'BMO Field, Toronto',                        homeSource: 'K2', awaySource: 'L2',   thirdSources: null },
  { id: 'r32_84', matchNum: 84, date: '2026-07-02', venue: 'SoFi Stadium, Los Ángeles',                 homeSource: 'H1', awaySource: 'J2',   thirdSources: null },
  { id: 'r32_85', matchNum: 85, date: '2026-07-02', venue: 'BC Place, Vancouver',                       homeSource: 'B1', awaySource: null,   thirdSources: 'EFGIJ' },
  { id: 'r32_86', matchNum: 86, date: '2026-07-03', venue: 'Hard Rock Stadium, Miami',                  homeSource: 'J1', awaySource: 'H2',   thirdSources: null },
  { id: 'r32_87', matchNum: 87, date: '2026-07-03', venue: 'Arrowhead Stadium, Kansas City',            homeSource: 'K1', awaySource: null,   thirdSources: 'DEIJL' },
  { id: 'r32_88', matchNum: 88, date: '2026-07-03', venue: 'AT&T Stadium, Dallas',                      homeSource: 'D2', awaySource: 'G2',   thirdSources: null },
];

export const R16_BRACKET = [
  { id: 'r16_89', matchNum: 89, date: '2026-07-04', venue: 'Lincoln Financial Field, Filadelfia', homeSource: 'r32_74', awaySource: 'r32_77' },
  { id: 'r16_90', matchNum: 90, date: '2026-07-04', venue: 'NRG Stadium, Houston',                homeSource: 'r32_73', awaySource: 'r32_75' },
  { id: 'r16_91', matchNum: 91, date: '2026-07-05', venue: 'MetLife Stadium, Nueva York',         homeSource: 'r32_76', awaySource: 'r32_78' },
  { id: 'r16_92', matchNum: 92, date: '2026-07-05', venue: 'Estadio Azteca, Ciudad de México',    homeSource: 'r32_79', awaySource: 'r32_80' },
  { id: 'r16_93', matchNum: 93, date: '2026-07-06', venue: 'AT&T Stadium, Dallas',                homeSource: 'r32_83', awaySource: 'r32_84' },
  { id: 'r16_94', matchNum: 94, date: '2026-07-06', venue: 'CenturyLink Field, Seattle',          homeSource: 'r32_81', awaySource: 'r32_82' },
  { id: 'r16_95', matchNum: 95, date: '2026-07-07', venue: 'Mercedes-Benz Stadium, Atlanta',      homeSource: 'r32_86', awaySource: 'r32_88' },
  { id: 'r16_96', matchNum: 96, date: '2026-07-07', venue: 'BC Place, Vancouver',                 homeSource: 'r32_85', awaySource: 'r32_87' },
];

export const QF_BRACKET = [
  { id: 'qf_97',  matchNum: 97,  date: '2026-07-09', venue: 'Gillette Stadium, Boston',           homeSource: 'r16_89', awaySource: 'r16_90' },
  { id: 'qf_98',  matchNum: 98,  date: '2026-07-10', venue: 'SoFi Stadium, Los Ángeles',          homeSource: 'r16_93', awaySource: 'r16_94' },
  { id: 'qf_99',  matchNum: 99,  date: '2026-07-11', venue: 'Hard Rock Stadium, Miami',           homeSource: 'r16_91', awaySource: 'r16_92' },
  { id: 'qf_100', matchNum: 100, date: '2026-07-11', venue: 'Arrowhead Stadium, Kansas City',     homeSource: 'r16_95', awaySource: 'r16_96' },
];

export const SF_BRACKET = [
  { id: 'sf_101', matchNum: 101, date: '2026-07-14', venue: 'AT&T Stadium, Dallas',               homeSource: 'qf_97',  awaySource: 'qf_98' },
  { id: 'sf_102', matchNum: 102, date: '2026-07-15', venue: 'Mercedes-Benz Stadium, Atlanta',     homeSource: 'qf_99',  awaySource: 'qf_100' },
];

export const THIRD_PLACE = { id: 'match_103', matchNum: 103, date: '2026-07-18', venue: 'Hard Rock Stadium, Miami',    homeSource: 'sf_101_loser', awaySource: 'sf_102_loser' };
export const FINAL       = { id: 'match_104', matchNum: 104, date: '2026-07-19', venue: 'MetLife Stadium, Nueva York', homeSource: 'sf_101',       awaySource: 'sf_102' };

export const PHASE_LABELS = {
  group: 'Fase de Grupos', r32: 'Dieciseisavos', r16: 'Octavos de Final',
  qf: 'Cuartos de Final', sf: 'Semifinales', final: 'Final',
};

export const SCORING = {
  exactResult: 3, correctWinner: 1, doubleMultiplier: 2,
  bonusTopScorer: 10, bonusTopScoringTeam: 10,
};

export const FLAGS = {
  'México': '🇲🇽', 'Corea del Sur': '🇰🇷', 'Sudáfrica': '🇿🇦', 'República Checa': '🇨🇿',
  'Canadá': '🇨🇦', 'Bosnia y Herzegovina': '🇧🇦', 'Qatar': '🇶🇦', 'Suiza': '🇨🇭',
  'Brasil': '🇧🇷', 'Marruecos': '🇲🇦', 'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Haití': '🇭🇹',
  'Estados Unidos': '🇺🇸', 'Australia': '🇦🇺', 'Paraguay': '🇵🇾', 'Turquía': '🇹🇷',
  'Alemania': '🇩🇪', 'Ecuador': '🇪🇨', 'Costa de Marfil': '🇨🇮', 'Curazao': '🇨🇼',
  'Países Bajos': '🇳🇱', 'Japón': '🇯🇵', 'Túnez': '🇹🇳', 'Suecia': '🇸🇪',
  'Bélgica': '🇧🇪', 'Irán': '🇮🇷', 'Egipto': '🇪🇬', 'Nueva Zelanda': '🇳🇿',
  'España': '🇪🇸', 'Uruguay': '🇺🇾', 'Arabia Saudita': '🇸🇦', 'Cabo Verde': '🇨🇻',
  'Francia': '🇫🇷', 'Senegal': '🇸🇳', 'Noruega': '🇳🇴', 'Irak': '🇮🇶',
  'Argentina': '🇦🇷', 'Austria': '🇦🇹', 'Argelia': '🇩🇿', 'Jordania': '🇯🇴',
  'Portugal': '🇵🇹', 'Colombia': '🇨🇴', 'Uzbekistán': '🇺🇿', 'R.D. Congo': '🇨🇩',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croacia': '🇭🇷', 'Panamá': '🇵🇦', 'Ghana': '🇬🇭',
};

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${months[parseInt(m)]}`;
}
