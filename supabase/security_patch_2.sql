-- ============================================================
-- SECURITY PATCH 2 — Run in Supabase SQL Editor
-- ============================================================

-- ----------------------------------------------------------------
-- Fix 1: leaderboard_select and daily_scores_leaderboard_select
--         used USING (true) — allows unauthenticated (anon) API
--         calls to read ALL profiles and scores without logging in.
--
-- Fix: require auth.uid() IS NOT NULL so only sessions with a
--      valid JWT (logged-in users) can read leaderboard data.
-- ----------------------------------------------------------------

DROP POLICY IF EXISTS "leaderboard_select" ON public.profiles;
CREATE POLICY "leaderboard_select" ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "daily_scores_leaderboard_select" ON public.daily_scores;
CREATE POLICY "daily_scores_leaderboard_select" ON public.daily_scores
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------
-- Fix 2: compute_midnight_penalties() and reset_weekly_progress()
--         are SECURITY DEFINER (run as postgres superuser) and were
--         callable by any authenticated user via supabase.rpc().
--
--         compute_midnight_penalties: applies inactivity penalties
--           to ALL users in one call — abuse would spam penalty logs
--           and drain everyone's aura points.
--         reset_weekly_progress: resets ALL users' weekly workout
--           progress — any user could wipe everyone's data.
--
--         Fix: REVOKE EXECUTE from public and authenticated roles.
--         The pg_cron scheduler runs as the postgres superuser and
--         is unaffected by this REVOKE.
-- ----------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.compute_midnight_penalties() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compute_midnight_penalties() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_weekly_progress() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_weekly_progress() FROM authenticated;

-- calculate_vo2max is intentionally left callable — it is pure math
-- with no DB writes and is safe for any authenticated user to call.
