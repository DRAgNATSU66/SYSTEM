-- ============================================================
-- SECURITY PATCH
-- Run this in Supabase SQL Editor to fix advisory warnings.
-- ============================================================

-- ----------------------------------------------------------------
-- Fix 1: security_definer_view on public.leaderboard (ERROR)
--
-- Views are SECURITY DEFINER by default — they run as the creator
-- (postgres superuser), bypassing RLS on the underlying tables.
-- WITH (security_invoker = true) makes the view respect the
-- querying user's RLS policies instead.
-- ----------------------------------------------------------------
DROP VIEW IF EXISTS public.leaderboard;
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

-- With security_invoker = true, the view now runs as the caller.
-- daily_scores only had a policy for own rows (auth.uid() = user_id),
-- so the LEFT JOIN would return NULL for all other users' today_score.
-- This extra SELECT policy makes daily_scores readable for leaderboard reads.
CREATE POLICY "daily_scores_leaderboard_select" ON public.daily_scores
  FOR SELECT USING (true);

-- ----------------------------------------------------------------
-- Fix 2: function_search_path_mutable on update_updated_at (WARN)
--
-- Without a fixed search_path, a schema injection attack could
-- shadow built-ins or table names. SET search_path = '' locks it
-- to an empty path — only pg_catalog is implicitly searched.
-- This function only calls NOW() which lives in pg_catalog, so
-- no body changes are needed.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ----------------------------------------------------------------
-- Fix 3: function_search_path_mutable on compute_midnight_penalties (WARN)
--
-- Same fix as above. Additionally, all table names are now schema-
-- qualified (public.*) so they resolve correctly with an empty path.
-- SECURITY DEFINER is intentional here — the cron job runs as
-- postgres so it can update all users' rows regardless of RLS.
-- ----------------------------------------------------------------
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

      IF escalation >= 7 THEN
        penalty := -1500;
      ELSIF escalation >= 3 THEN
        penalty := -(1200 + (escalation - 3) * 100);
      ELSIF escalation >= 2 THEN
        penalty := -1100;
      ELSE
        penalty := -1000;
      END IF;

      INSERT INTO public.aura_logs (user_id, date, earned, lost, reason)
      VALUES (rec.id, yesterday, 0, ABS(penalty), 'Inactivity Penalty')
      ON CONFLICT (user_id, date) DO UPDATE
        SET lost = public.aura_logs.lost + ABS(penalty),
            reason = 'Inactivity Penalty',
            updated_at = NOW();

      UPDATE public.profiles
      SET
        total_aura_points = GREATEST(0, rec.total_aura_points + penalty),
        current_streak = 0,
        multiplier = 1.0,
        updated_at = NOW()
      WHERE id = rec.id AND escalation >= 7;

      IF escalation >= 7 THEN
        UPDATE public.profiles
        SET current_streak = 0, multiplier = 1.0, updated_at = NOW()
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
