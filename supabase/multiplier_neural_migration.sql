-- ============================================================
-- MIGRATION: Multiplier system upgrade + Neural stats
-- Run this on your Supabase database to support:
--   1. Negative multipliers (-5.0 to 5.0)
--   2. Accumulated IQ and Knowledge stats
-- ============================================================

-- Step 1: Drop the leaderboard view first (it depends on multiplier column)
DROP VIEW IF EXISTS public.leaderboard;

-- Step 2: Expand multiplier range to support -5.0 to 5.0
ALTER TABLE public.profiles
  ALTER COLUMN multiplier TYPE NUMERIC(3,1);

-- Step 3: Expand multiplier in aura_logs too
ALTER TABLE public.aura_logs
  ALTER COLUMN multiplier TYPE NUMERIC(3,1);

-- Step 4: Add accumulated neural stats columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accumulated_iq NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accumulated_knowledge NUMERIC(8,2) DEFAULT 0;

-- Step 5: Recreate the leaderboard view with new columns
CREATE VIEW public.leaderboard WITH (security_invoker = true) AS
SELECT
  p.id,
  p.username,
  p.total_aura_points,
  p.current_streak,
  p.max_streak,
  p.multiplier,
  p.accumulated_iq,
  p.accumulated_knowledge,
  p.rank_tier,
  COALESCE(today.score, 0) AS today_score,
  ROW_NUMBER() OVER (ORDER BY p.total_aura_points DESC) AS rank
FROM public.profiles p
LEFT JOIN public.daily_scores today ON today.user_id = p.id AND today.date = CURRENT_DATE;
