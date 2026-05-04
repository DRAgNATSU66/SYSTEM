-- ============================================================
-- PHASE 3 FEATURES
-- Run AFTER: security_patch_3.sql
-- ============================================================

-- Duel table: add phase-3 columns
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS start_at         TIMESTAMPTZ;
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS end_at           TIMESTAMPTZ;
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS match_type       TEXT DEFAULT 'direct';
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS challenger_escrowed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS opponent_escrowed   BOOLEAN DEFAULT FALSE;

-- Matchmaking queue
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  user_id    UUID    NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  ap_bracket INTEGER NOT NULL,
  joined_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matchmaking_self" ON public.matchmaking_queue
  FOR ALL USING (auth.uid() = user_id);

-- ── get_top5_profile RPC ─────────────────────────────────────────────────────
-- Returns expanded profile data for a target user.
-- Access is restricted to users who are themselves in the top 5.
CREATE OR REPLACE FUNCTION public.get_top5_profile(target_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  caller_rank INTEGER;
  target_rank INTEGER;
BEGIN
  -- Rank the caller
  SELECT position INTO caller_rank FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_aura_points DESC) AS position
    FROM public.profiles WHERE total_aura_points > 0
  ) t WHERE id = auth.uid();

  -- Rank the target
  SELECT position INTO target_rank FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_aura_points DESC) AS position
    FROM public.profiles WHERE total_aura_points > 0
  ) t WHERE id = target_user_id;

  IF COALESCE(caller_rank, 9999) > 5 OR COALESCE(target_rank, 9999) > 5 THEN
    RETURN jsonb_build_object('error', 'access_denied');
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'id',                  p.id,
      'username',            p.username,
      'avatar_url',          p.avatar_url,
      'rank_position',       target_rank,
      'rank_tier',           p.rank_tier,
      'total_aura_points',   p.total_aura_points,
      'current_streak',      p.current_streak,
      'multiplier',          p.multiplier,
      'last_seen_at',        p.last_seen_at,
      'today_score',         COALESCE(ds.score, 0),
      'today_earned',        COALESCE(al.earned, 0),
      'today_lost',          COALESCE(al.lost, 0),
      'neural_sleep',        COALESCE(dm.sleep, 0),
      'neural_mood',         COALESCE(dm.mood, 0)
    )
    FROM public.profiles p
    LEFT JOIN public.aura_logs al
      ON al.user_id = p.id AND al.date = CURRENT_DATE
    LEFT JOIN public.daily_scores ds
      ON ds.user_id = p.id AND ds.date = CURRENT_DATE
    LEFT JOIN public.daily_metrics dm
      ON dm.user_id = p.id AND dm.date = CURRENT_DATE
    WHERE p.id = target_user_id
  );
END;
$$;

-- ── leaderboard_streak cron helper ──────────────────────────────────────────
-- Call from the nightly cron alongside compute_midnight_penalties().
-- Increments leaderboard_streak_days for users currently in top 5,
-- resets those who dropped out, and flags 90-day milestone.
CREATE OR REPLACE FUNCTION public.update_leaderboard_streaks() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  top5_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(id) INTO top5_ids
  FROM (
    SELECT id FROM public.profiles
    WHERE total_aura_points > 0
    ORDER BY total_aura_points DESC LIMIT 5
  ) t;

  -- Increment streak for top-5 users
  UPDATE public.profiles
  SET leaderboard_streak_days = leaderboard_streak_days + 1, updated_at = NOW()
  WHERE id = ANY(top5_ids);

  -- Reset streak for users who dropped out of top 5
  UPDATE public.profiles
  SET leaderboard_streak_days = 0, updated_at = NOW()
  WHERE leaderboard_streak_days > 0 AND NOT (id = ANY(top5_ids));
END;
$$;
