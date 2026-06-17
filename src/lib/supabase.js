import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function loginUser(username) {
  const trimmed = username.trim();
  const email = `${trimmed.toLowerCase()}@quiniela.local`;
  const password = `qniela_${trimmed.toLowerCase()}_2026`;

  // Try sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInError && signInData.user) return { user: signInData.user, isNew: false };

  // If not found, create account with username in metadata
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: trimmed } },
  });
  if (signUpError) throw signUpError;
  return { user: signUpData.user, isNew: true };
}

export async function loginAdmin(password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'yaroslavvolkov@hotmail.com',
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── PICKS ───────────────────────────────────────────────────────────────────

export async function savePick(userId, matchId, homeGoals, awayGoals) {
  const { error } = await supabase.from('picks').upsert({
    user_id: userId,
    match_id: matchId,
    home_goals: homeGoals,
    away_goals: awayGoals,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,match_id' });
  if (error) throw error;
}

export async function saveKnockoutPick(userId, matchId, winner) {
  const { error } = await supabase.from('knockout_picks').upsert({
    user_id: userId,
    match_id: matchId,
    winner,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,match_id' });
  if (error) throw error;
}

export async function getUserPicks(userId) {
  const [{ data: picks }, { data: koPicks }] = await Promise.all([
    supabase.from('picks').select('*').eq('user_id', userId),
    supabase.from('knockout_picks').select('*').eq('user_id', userId),
  ]);
  return { picks: picks || [], koPicks: koPicks || [] };
}

export async function getAllUserPicks() {
  // Fetch all picks using pagination to bypass Supabase's 1000-row default limit
  async function fetchAll(table) {
    const allRows = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      allRows.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return allRows;
  }

  const [picks, koPicks] = await Promise.all([
    fetchAll('picks'),
    fetchAll('knockout_picks'),
  ]);
  return { picks, koPicks };
}

export async function saveBonusPick(userId, bonusId, value) {
  const { error } = await supabase.from('bonus_picks').upsert({
    user_id: userId,
    bonus_id: bonusId,
    value,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,bonus_id' });
  if (error) throw error;
}

export async function getUserBonusPicks(userId) {
  const { data } = await supabase.from('bonus_picks').select('*').eq('user_id', userId);
  return data || [];
}

export async function confirmQuiniela(userId) {
  const { error } = await supabase.from('users_meta')
    .update({ confirmed: true, confirmed_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function unconfirmQuiniela(userId) {
  const { error } = await supabase.from('users_meta')
    .update({ confirmed: false, confirmed_at: null })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getUserMeta(userId) {
  const { data } = await supabase.from('users_meta').select('*').eq('user_id', userId).single();
  return data;
}

// ─── RESULTS (admin only) ────────────────────────────────────────────────────

export async function saveResult(matchId, homeGoals, awayGoals, phase) {
  const { error } = await supabase.from('results').upsert({
    match_id: matchId,
    home_goals: homeGoals,
    away_goals: awayGoals,
    phase,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'match_id' });
  if (error) throw error;
}

export async function saveKnockoutResult(matchId, winner, phase) {
  const { error } = await supabase.from('knockout_results').upsert({
    match_id: matchId,
    winner,
    phase,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'match_id' });
  if (error) throw error;
}

export async function getAllResults() {
  const [{ data: results }, { data: koResults }] = await Promise.all([
    supabase.from('results').select('*'),
    supabase.from('knockout_results').select('*'),
  ]);
  return { results: results || [], koResults: koResults || [] };
}

export async function toggleDoubleMatch(matchId, isDouble) {
  const { error } = await supabase.from('double_matches').upsert({
    match_id: matchId,
    is_double: isDouble,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'match_id' });
  if (error) throw error;
}

export async function getDoubleMatches() {
  const { data } = await supabase.from('double_matches').select('*').eq('is_double', true);
  return (data || []).map(d => d.match_id);
}

// ─── BONUS CHALLENGES ────────────────────────────────────────────────────────

export async function getBonusChallenges() {
  const { data } = await supabase.from('bonus_challenges').select('*').order('created_at');
  return data || [];
}

export async function saveBonusChallenge(challenge) {
  const { error } = await supabase.from('bonus_challenges').upsert(challenge, { onConflict: 'id' });
  if (error) throw error;
}

export async function saveBonusResult(bonusId, correctValue) {
  const { error } = await supabase.from('bonus_challenges').update({
    correct_value: correctValue,
    resolved: true,
  }).eq('id', bonusId);
  if (error) throw error;
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  const { data } = await supabase.from('users_meta').select('*');
  return data || [];
}

// ─── REAL-TIME ───────────────────────────────────────────────────────────────

export function subscribeToResults(callback) {
  return supabase
    .channel('results_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'knockout_results' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bonus_challenges' }, callback)
    .subscribe();
}
