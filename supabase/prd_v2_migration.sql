-- ============================================================
-- PRD v2 Migration — Run in Supabase SQL Editor
-- Safe to run against existing init.sql schema.
-- ============================================================

-- ── 1. Add micros JSONB column to daily_metrics ─────────────────────────────
-- Stores all 16 micronutrient values per day
ALTER TABLE public.daily_metrics
  ADD COLUMN IF NOT EXISTS micros JSONB DEFAULT '{}';

-- ── 2. Add nutrition_baseline to profiles.preferences ───────────────────────
-- Already stored as JSONB via preferences column (no schema change needed)
-- Baseline is: preferences->>'nutrition_baseline' as a JSON object

-- ── 3. Add weekly_workout_progress to profiles ──────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_workout_progress NUMERIC DEFAULT 0;

-- ── 4. Add difficulty column to goals ───────────────────────────────────────
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- ── 5. Add hobbytype column to hobbies ──────────────────────────────────────
ALTER TABLE public.hobbies
  ADD COLUMN IF NOT EXISTS hobby_type TEXT DEFAULT 'temporary'
    CHECK (hobby_type IN ('permanent', 'temporary'));

-- ── 6. VO2 Max RPC ──────────────────────────────────────────────────────────
-- Calculates a normalized VO2 Max score (0–100) from Airbike session inputs.
-- Mirrors the frontend vo2MaxCalculator.js formula.
CREATE OR REPLACE FUNCTION public.calculate_vo2max(
  p_bpm       INTEGER,
  p_dist_km   NUMERIC,
  p_time_min  NUMERIC,
  p_age       INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  dist_per_min NUMERIC;
  age_factor   NUMERIC;
  raw_vo2      NUMERIC;
  clamped      NUMERIC;
  score        INTEGER;
BEGIN
  IF p_bpm IS NULL OR p_dist_km IS NULL OR p_time_min IS NULL OR p_age IS NULL THEN
    RETURN jsonb_build_object('rawVO2', 0, 'score', 0);
  END IF;

  dist_per_min := p_dist_km / NULLIF(p_time_min, 0);
  age_factor   := GREATEST(0, 30 - p_age) * 0.1;
  raw_vo2      := (dist_per_min * 21.4) - (0.065 * p_bpm) + age_factor + 10;
  clamped      := GREATEST(20, LEAST(80, raw_vo2));
  score        := ROUND(((clamped - 20) / 60.0) * 100);

  RETURN jsonb_build_object(
    'rawVO2', ROUND(clamped::NUMERIC, 1),
    'score',  score
  );
END;
$$;

-- ── 7. Weekly Reset Cron (Sunday midnight) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.reset_weekly_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET weekly_workout_progress = 0, updated_at = NOW();
END;
$$;

-- Schedule every Sunday at midnight UTC (day 0 = Sunday in pg_cron)
SELECT cron.schedule(
  'weekly-workout-reset',
  '0 0 * * 0',
  'SELECT reset_weekly_progress()'
);

-- ── 8. AP daily cap enforcement via DB trigger ──────────────────────────────
-- Ensures aura_logs earned and lost columns never exceed 2000 per day per user.
CREATE OR REPLACE FUNCTION public.enforce_daily_ap_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  cap INTEGER := 2000;
BEGIN
  -- Clamp earned
  IF NEW.earned > cap THEN
    NEW.earned := cap;
  END IF;
  -- Clamp lost
  IF NEW.lost > cap THEN
    NEW.lost := cap;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ap_cap ON public.aura_logs;
CREATE TRIGGER trg_ap_cap
  BEFORE INSERT OR UPDATE ON public.aura_logs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_ap_cap();

-- ── 9. Multiplier cap enforcement ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_multiplier_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.multiplier > 4.0 THEN
    NEW.multiplier := 4.0;
  END IF;
  IF NEW.multiplier < 1.0 THEN
    NEW.multiplier := 1.0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mult_cap ON public.profiles;
CREATE TRIGGER trg_mult_cap
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_multiplier_cap();

-- ── 10. Grant RLS policy for new leaderboard read ───────────────────────────
-- Already present in init.sql (leaderboard_select) — no change needed.
-- Confirm it exists:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'leaderboard_select'
  ) THEN
    CREATE POLICY "leaderboard_select" ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;
