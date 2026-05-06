-- ============================================================
-- patch_missing_columns.sql
-- Run in Supabase SQL Editor after init.sql
-- All statements are idempotent — safe to re-run.
-- ============================================================

-- profiles: avatar URL, cypher ID, last_seen_at
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cypher_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Unique partial index on cypher_id (only enforced on non-null values)
-- DROP the old non-unique index first if it exists, then recreate unique.
DROP INDEX IF EXISTS idx_profiles_cypher_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cypher_id ON profiles(cypher_id) WHERE cypher_id IS NOT NULL;

-- daily_metrics: mood_note + micros JSONB
ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS mood_note TEXT;
ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS micros JSONB DEFAULT '{}';

-- goals: retry_count
ALTER TABLE goals ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- ============================================================
-- TABLE: body_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  bodyweight NUMERIC,
  body_fat NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own body_metrics" ON body_metrics
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date ON body_metrics(user_id, date);

-- ============================================================
-- TABLE: aura_history_detail (if not created by phase3_features.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS aura_history_detail (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  reason TEXT,
  net INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE aura_history_detail ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own aura_history_detail" ON aura_history_detail
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_aura_history_detail_user ON aura_history_detail(user_id, date);

-- ============================================================
-- TABLE: ai_usage (rate limiting for HF AI backend)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own ai_usage" ON ai_usage
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Triggers for new tables
-- ============================================================
DO $$ BEGIN
  CREATE TRIGGER trg_body_metrics_updated_at
    BEFORE UPDATE ON body_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Server-authoritative total_aura_points
-- Recomputes profiles.total_aura_points from aura_logs whenever
-- a daily log row is inserted or updated, so clients cannot forge it.
-- ============================================================
CREATE OR REPLACE FUNCTION sync_profile_total_ap()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET total_aura_points = (
    SELECT COALESCE(SUM(earned - lost), 0)
    FROM aura_logs
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DO $$ BEGIN
  CREATE TRIGGER trg_aura_logs_sync_total_ap
    AFTER INSERT OR UPDATE ON aura_logs
    FOR EACH ROW EXECUTE FUNCTION sync_profile_total_ap();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
