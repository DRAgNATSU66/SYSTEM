-- ============================================================
-- SYSTEM OS - Full Database Migration
-- Run in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  total_aura_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  multiplier NUMERIC(3,1) DEFAULT 1.0,
  accumulated_iq NUMERIC(8,2) DEFAULT 0,
  accumulated_knowledge NUMERIC(8,2) DEFAULT 0,
  last_login_date DATE,
  rank_tier TEXT DEFAULT 'Normie',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: aura_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS aura_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  earned INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  net INTEGER GENERATED ALWAYS AS (earned - lost) STORED,
  multiplier NUMERIC(3,1) DEFAULT 1.0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- TABLE: daily_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- TABLE: tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'PERMANENT_DAILY',
  base_weight INTEGER DEFAULT 100,
  method TEXT DEFAULT 'checkbox',
  target INTEGER,
  subcategory TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: task_completions
-- ============================================================
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, date)
);

-- ============================================================
-- TABLE: workout_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  cardio JSONB DEFAULT '{}',
  volume JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- TABLE: personal_bests
-- ============================================================
CREATE TABLE IF NOT EXISTS personal_bests (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  data JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: study_subjects
-- ============================================================
CREATE TABLE IF NOT EXISTS study_subjects (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- ============================================================
-- TABLE: study_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- TABLE: daily_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sleep NUMERIC,
  deep_sleep NUMERIC,
  mood INTEGER,
  macros JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- TABLE: macro_configs
-- ============================================================
CREATE TABLE IF NOT EXISTS macro_configs (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  macros JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: goals
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  bounty_ap INTEGER DEFAULT 1000,
  archived BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- ============================================================
-- TABLE: projects
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'CS',
  status TEXT DEFAULT 'UPCOMING',
  color TEXT DEFAULT '#FFFFFF',
  total_hours NUMERIC DEFAULT 0,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- ============================================================
-- TABLE: project_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS project_sessions (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID NOT NULL,
  date DATE NOT NULL,
  hours NUMERIC DEFAULT 0,
  efficiency INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- ============================================================
-- TABLE: hobbies
-- ============================================================
CREATE TABLE IF NOT EXISTS hobbies (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- ============================================================
-- TABLE: friends
-- ============================================================
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ============================================================
-- TABLE: duels
-- ============================================================
CREATE TABLE IF NOT EXISTS duels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opponent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  state TEXT DEFAULT 'pending',
  stake_ap INTEGER DEFAULT 500,
  winner_id UUID REFERENCES profiles(id),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_aura_logs_user_date ON aura_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_scores_user_date ON daily_scores(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_date ON task_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','aura_logs','daily_scores','tasks','task_completions',
    'workout_logs','study_sessions','daily_metrics','goals','projects',
    'project_sessions','hobbies','friends','duels'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_bests ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Per-user tables (user_id based)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'aura_logs','daily_scores','tasks','task_completions',
    'workout_logs','study_subjects','study_sessions','daily_metrics',
    'goals','projects','project_sessions','hobbies'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "%s_all" ON %s FOR ALL USING (auth.uid() = user_id)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Personal bests (PK is user_id)
CREATE POLICY "personal_bests_all" ON personal_bests FOR ALL USING (auth.uid() = user_id);

-- Macro configs (PK is user_id)
CREATE POLICY "macro_configs_all" ON macro_configs FOR ALL USING (auth.uid() = user_id);

-- Friends (see own rows)
CREATE POLICY "friends_all" ON friends FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Duels (see own duels)
CREATE POLICY "duels_all" ON duels FOR ALL USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- ============================================================
-- LEADERBOARD VIEW
-- security_invoker = true: view respects caller's RLS policies
-- instead of running as the postgres superuser (SECURITY DEFINER default)
-- ============================================================
CREATE VIEW public.leaderboard WITH (security_invoker = true) AS
SELECT
  p.id,
  p.username,
  p.total_aura_points,
  p.current_streak,
  p.max_streak,
  p.multiplier,
  p.rank_tier,
  COALESCE(today.score, 0) AS today_score,
  ROW_NUMBER() OVER (ORDER BY p.total_aura_points DESC) AS rank
FROM public.profiles p
LEFT JOIN public.daily_scores today ON today.user_id = p.id AND today.date = CURRENT_DATE;

-- Allow all authenticated users to read all profiles (for leaderboard)
CREATE POLICY "leaderboard_select" ON profiles FOR SELECT USING (true);
-- Allow all authenticated users to read daily_scores (for leaderboard today_score join)
CREATE POLICY "daily_scores_leaderboard_select" ON daily_scores FOR SELECT USING (true);

-- ============================================================
-- MIDNIGHT PENALTY FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_midnight_penalties() RETURNS void AS $$
DECLARE
  rec RECORD;
  yesterday DATE := CURRENT_DATE - 1;
  gap_days INTEGER;
  penalty INTEGER;
  escalation INTEGER;
BEGIN
  -- For each profile, check if they had any activity yesterday
  FOR rec IN SELECT id, current_streak, total_aura_points FROM public.profiles LOOP
    -- Check if any task completion or metric exists for yesterday
    SELECT COUNT(*) INTO gap_days
    FROM public.task_completions
    WHERE user_id = rec.id AND date = yesterday;

    IF gap_days = 0 THEN
      -- No activity yesterday — compute consecutive inactive days
      SELECT COUNT(*) INTO escalation
      FROM generate_series(1, 7) AS s(n)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.task_completions
        WHERE user_id = rec.id AND date = (yesterday - (s.n - 1))
      );

      -- Escalating penalty
      IF escalation >= 7 THEN
        penalty := -1500;
      ELSIF escalation >= 3 THEN
        penalty := -(1200 + (escalation - 3) * 100);
      ELSIF escalation >= 2 THEN
        penalty := -1100;
      ELSE
        penalty := -1000;
      END IF;

      -- Insert penalty aura log
      INSERT INTO public.aura_logs (user_id, date, earned, lost, reason)
      VALUES (rec.id, yesterday, 0, ABS(penalty), 'Inactivity Penalty')
      ON CONFLICT (user_id, date) DO UPDATE
        SET lost = public.aura_logs.lost + ABS(penalty),
            reason = 'Inactivity Penalty',
            updated_at = NOW();

      -- Update total_aura_points (floor at 0)
      UPDATE public.profiles
      SET
        total_aura_points = GREATEST(0, rec.total_aura_points + penalty),
        current_streak = 0,
        multiplier = 1.0,
        updated_at = NOW()
      WHERE id = rec.id AND escalation >= 7;

      -- Reset streak only for 7+ day gap
      IF escalation >= 7 THEN
        UPDATE public.profiles SET current_streak = 0, multiplier = 1.0, updated_at = NOW()
        WHERE id = rec.id;
      END IF;

      UPDATE public.profiles
      SET total_aura_points = GREATEST(0, total_aura_points + penalty), updated_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Schedule midnight penalties via pg_cron
SELECT cron.schedule('midnight-penalties', '0 0 * * *', 'SELECT compute_midnight_penalties()');
