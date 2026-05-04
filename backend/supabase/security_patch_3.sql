-- ============================================================
-- SECURITY PATCH 3
-- Run AFTER: init.sql, prd_v2_migration.sql,
--            multiplier_neural_migration.sql,
--            security_patch.sql, security_patch_2.sql
-- ============================================================

-- C4: Fix double penalty in compute_midnight_penalties
CREATE OR REPLACE FUNCTION public.compute_midnight_penalties() RETURNS void AS $$
DECLARE
  rec RECORD;
  yesterday DATE := CURRENT_DATE - 1;
  gap_days INTEGER;
  penalty INTEGER;
  escalation INTEGER;
BEGIN
  FOR rec IN SELECT id, current_streak, total_aura_points FROM public.profiles LOOP
    SELECT COUNT(*) INTO gap_days
    FROM public.task_completions
    WHERE user_id = rec.id AND date = yesterday;
    IF gap_days = 0 THEN
      SELECT COUNT(*) INTO escalation
      FROM generate_series(1, 7) AS s(n)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.task_completions
        WHERE user_id = rec.id AND date = (yesterday - (s.n - 1))
      );
      IF escalation >= 7 THEN penalty := -1500;
      ELSIF escalation >= 3 THEN penalty := -(1200 + (escalation - 3) * 100);
      ELSIF escalation >= 2 THEN penalty := -1100;
      ELSE penalty := -1000;
      END IF;
      INSERT INTO public.aura_logs (user_id, date, earned, lost, reason)
      VALUES (rec.id, yesterday, 0, ABS(penalty), 'Inactivity Penalty')
      ON CONFLICT (user_id, date) DO UPDATE
        SET lost = public.aura_logs.lost + ABS(penalty),
            reason = 'Inactivity Penalty', updated_at = NOW();
      -- Single UPDATE (was incorrectly doubled before this patch)
      UPDATE public.profiles
      SET
        total_aura_points = GREATEST(0, rec.total_aura_points + penalty),
        current_streak = CASE WHEN escalation >= 7 THEN 0 ELSE current_streak END,
        multiplier = CASE WHEN escalation >= 7 THEN 1.0 ELSE multiplier END,
        updated_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- C5: Missing indexes
CREATE INDEX IF NOT EXISTS idx_friends_friend_id        ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_duels_challenger_id      ON public.duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent_id        ON public.duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_state              ON public.duels(state);
CREATE INDEX IF NOT EXISTS idx_study_subjects_user_id  ON public.study_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_aura_logs_date           ON public.aura_logs(date);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON public.task_completions(task_id);

-- C6: calculate_vo2max → SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.calculate_vo2max(
  p_bpm INTEGER, p_dist_km NUMERIC, p_time_min NUMERIC, p_age INTEGER
) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  dist_per_min NUMERIC; age_factor NUMERIC;
  raw_vo2 NUMERIC; clamped NUMERIC; score INTEGER;
BEGIN
  IF p_bpm IS NULL OR p_dist_km IS NULL OR p_time_min IS NULL OR p_age IS NULL THEN
    RETURN jsonb_build_object('rawVO2', 0, 'score', 0);
  END IF;
  dist_per_min := p_dist_km / NULLIF(p_time_min, 0);
  age_factor   := GREATEST(0, 30 - p_age) * 0.1;
  raw_vo2      := (dist_per_min * 21.4) - (0.065 * p_bpm) + age_factor + 10;
  clamped      := GREATEST(20, LEAST(80, raw_vo2));
  score        := ROUND(((clamped - 20) / 60.0) * 100);
  RETURN jsonb_build_object('rawVO2', ROUND(clamped::NUMERIC, 1), 'score', score);
END;
$$;

-- C8: Restrict daily_scores leaderboard policy to today only
DROP POLICY IF EXISTS "daily_scores_leaderboard_select" ON public.daily_scores;
CREATE POLICY "daily_scores_leaderboard_select" ON public.daily_scores
  FOR SELECT USING (auth.uid() IS NOT NULL AND date = CURRENT_DATE);

-- Phase 3 prep: cypher_id + last_seen_at on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cypher_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_streak_days INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_profiles_cypher_id ON public.profiles(cypher_id);

-- Phase 3 prep: friends table — mutual request system
ALTER TABLE public.friends ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted';
ALTER TABLE public.friends ADD COLUMN IF NOT EXISTS requested_by UUID;

-- Phase 3 prep: hobby_sessions table
CREATE TABLE IF NOT EXISTS public.hobby_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hobby_id TEXT NOT NULL,
  hobby_name TEXT NOT NULL,
  type TEXT,
  categories TEXT[],
  duration_minutes INTEGER DEFAULT 0,
  ap_earned INTEGER DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.hobby_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hobby_sessions_user_policy" ON public.hobby_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_hobby_sessions_user_id ON public.hobby_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hobby_sessions_date ON public.hobby_sessions(date);

-- Phase 5 prep: goal retry tracking
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS overdue_penalty_applied BOOLEAN DEFAULT FALSE;

-- Phase 3 prep: ai_usage rate limiting table
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date    DATE    NOT NULL DEFAULT CURRENT_DATE,
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_self" ON public.ai_usage FOR ALL USING (auth.uid() = user_id);

-- Phase 5 prep: aura_history_detail — per-activity AP entries server-side
CREATE TABLE IF NOT EXISTS public.aura_history_detail (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  category   TEXT        NOT NULL,
  reason     TEXT        NOT NULL,
  net        INTEGER     NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.aura_history_detail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aura_history_detail_user_policy"
  ON public.aura_history_detail FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_aura_history_detail_user_date
  ON public.aura_history_detail(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_aura_history_detail_date
  ON public.aura_history_detail(date);
