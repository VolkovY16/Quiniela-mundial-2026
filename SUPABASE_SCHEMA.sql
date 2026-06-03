-- =============================================================
-- QUINIELA MUNDIAL 2026 - Supabase Database Schema
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- =============================================================

-- 1. Tabla de metadatos de usuarios
CREATE TABLE IF NOT EXISTS users_meta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Picks de fase de grupos (marcador exacto)
CREATE TABLE IF NOT EXISTS picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id TEXT NOT NULL,
  home_goals INTEGER,
  away_goals INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- 3. Picks de fases eliminatorias (solo ganador)
CREATE TABLE IF NOT EXISTS knockout_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id TEXT NOT NULL,
  winner TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- 4. Picks de retos bonus
CREATE TABLE IF NOT EXISTS bonus_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bonus_id UUID NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bonus_id)
);

-- 5. Resultados reales de fase de grupos (admin)
CREATE TABLE IF NOT EXISTS results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE,
  home_goals INTEGER,
  away_goals INTEGER,
  phase TEXT DEFAULT 'group',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Resultados reales eliminatorias (admin)
CREATE TABLE IF NOT EXISTS knockout_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE,
  winner TEXT,
  phase TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Partidos con puntos dobles (admin puede agregar/quitar)
CREATE TABLE IF NOT EXISTS double_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE,
  is_double BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Retos bonus configurables por admin
CREATE TABLE IF NOT EXISTS bonus_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 10,
  type TEXT DEFAULT 'text', -- 'text', 'team', 'player', 'number'
  options JSONB, -- para tipo select, lista de opciones
  correct_value TEXT, -- respuesta correcta (se llena al resolver)
  resolved BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  deadline TIMESTAMPTZ, -- hasta cuando se puede responder
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE users_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knockout_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE knockout_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE double_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_challenges ENABLE ROW LEVEL SECURITY;

-- users_meta: cada usuario ve todos, edita solo el suyo
CREATE POLICY "users_meta_select_all" ON users_meta FOR SELECT USING (true);
CREATE POLICY "users_meta_insert_own" ON users_meta FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_meta_update_own" ON users_meta FOR UPDATE USING (auth.uid() = user_id);

-- picks: cada usuario ve todos los picks, edita solo los suyos
CREATE POLICY "picks_select_all" ON picks FOR SELECT USING (true);
CREATE POLICY "picks_insert_own" ON picks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "picks_update_own" ON picks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "picks_delete_own" ON picks FOR DELETE USING (auth.uid() = user_id);

-- knockout_picks
CREATE POLICY "ko_picks_select_all" ON knockout_picks FOR SELECT USING (true);
CREATE POLICY "ko_picks_insert_own" ON knockout_picks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ko_picks_update_own" ON knockout_picks FOR UPDATE USING (auth.uid() = user_id);

-- bonus_picks
CREATE POLICY "bonus_picks_select_all" ON bonus_picks FOR SELECT USING (true);
CREATE POLICY "bonus_picks_insert_own" ON bonus_picks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bonus_picks_update_own" ON bonus_picks FOR UPDATE USING (auth.uid() = user_id);

-- results: todos leen, solo admin escribe (manejado en app)
CREATE POLICY "results_select_all" ON results FOR SELECT USING (true);
CREATE POLICY "results_all_authenticated" ON results FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "ko_results_select_all" ON knockout_results FOR SELECT USING (true);
CREATE POLICY "ko_results_all_authenticated" ON knockout_results FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "double_matches_select_all" ON double_matches FOR SELECT USING (true);
CREATE POLICY "double_matches_all_authenticated" ON double_matches FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "bonus_challenges_select_all" ON bonus_challenges FOR SELECT USING (true);
CREATE POLICY "bonus_challenges_all_authenticated" ON bonus_challenges FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================
-- ADMIN USER SETUP
-- =============================================================
-- Después de correr este script:
-- 1. Ve a Authentication > Users en Supabase
-- 2. Crea manualmente el usuario: admin@quiniela.local
-- 3. Pon la contraseña que quieras (la necesitarás para el login admin)
-- 4. Copia su UUID y ejecuta:
--
-- INSERT INTO users_meta (user_id, username, is_admin, confirmed)
-- VALUES ('<UUID_DEL_ADMIN>', 'Admin', TRUE, TRUE);

-- =============================================================
-- BONUS CHALLENGES INICIALES
-- =============================================================
INSERT INTO bonus_challenges (title, description, points, type)
VALUES 
  ('Máximo goleador', '¿Quién será el jugador con más goles del torneo?', 10, 'text'),
  ('Selección más goleadora', '¿Qué selección anotará más goles en todo el torneo?', 10, 'text');

-- =============================================================
-- REALTIME - habilitar para tablas clave
-- =============================================================
-- Ve a Database > Replication en Supabase y activa estas tablas:
-- results, knockout_results, picks, knockout_picks, bonus_challenges
