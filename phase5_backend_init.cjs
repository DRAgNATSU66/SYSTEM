const fs = require('fs');
const path = require('path');

const files = {
  // SQL Schema Definitions
  'supabase/init.sql': `-- Schema for Antigravity OS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  total_aura_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  multiplier DECIMAL(3,1) DEFAULT 1.0,
  last_login_date DATE,
  rank_tier TEXT DEFAULT 'Normie',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table: aura_logs
CREATE TABLE aura_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  net_earned INTEGER NOT NULL,
  multiplier DECIMAL(3,1) DEFAULT 1.0,
  reason TEXT, -- e.g., 'Daily Log', 'Penalty: Inactivity'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, date, reason)
);

-- Table: daily_scores
CREATE TABLE daily_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, date)
);

-- Table: tasks
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'PERMANENT_DAILY', 'SIDE_HUSTLE'
  base_weight INTEGER DEFAULT 100,
  method TEXT DEFAULT 'checkbox', -- 'checkbox', 'numeric'
  target INTEGER, -- For numeric tasks (e.g. 60 mins cardio)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table: task_completions
CREATE TABLE task_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC, -- 1 for boolean, actual number for numeric
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(task_id, date)
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can only edit their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users control their own aura logs" ON aura_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users control their own scores" ON daily_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users control their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users control their own task completions" ON task_completions FOR ALL USING (auth.uid() = user_id);\n`,

  // Environment Configs
  '.env.example': `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key\n`,

  // Supabase Client Initialization
  'src/services/supabaseClient.js': `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if keys are present (prevents crash on local if user hasn't configured it yet)
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
