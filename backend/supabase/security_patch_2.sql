-- ============================================================
-- SECURITY PATCH 2
-- Run in Supabase SQL Editor
-- ============================================================

-- ----------------------------------------------------------------
-- Fix 1: leaderboard_select + daily_scores_leaderboard_select
--
-- Old: USING (true) -- unauthenticated (anon) API calls could
--      read all profiles and scores without being logged in.
-- Fix: USING (auth.uid() IS NOT NULL) -- requires a valid JWT
--      (logged-in user) before returning any rows.
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
-- Fix 2: Lock down SECURITY DEFINER RPCs
--
-- compute_midnight_penalties() and reset_weekly_progress() run as
-- the postgres superuser (SECURITY DEFINER) and bypass RLS.
-- Any logged-in user could call them via supabase.rpc() and
-- apply penalties to all users or wipe everyone's weekly progress.
--
-- Wrapped in DO blocks so this patch is safe to run even if
-- prd_v2_migration.sql has not been applied yet on this database.
-- calculate_vo2max() is left callable -- it is pure math, no writes.
-- ----------------------------------------------------------------

DO $$
BEGIN
  REVOKE EXECUTE ON FUNCTION public.compute_midnight_penalties() FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.compute_midnight_penalties() FROM authenticated;
EXCEPTION WHEN undefined_function THEN
  NULL;
END $$;

DO $$
BEGIN
  REVOKE EXECUTE ON FUNCTION public.reset_weekly_progress() FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.reset_weekly_progress() FROM authenticated;
EXCEPTION WHEN undefined_function THEN
  NULL;
END $$;
