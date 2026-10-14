import { createClient } from '@supabase/supabase-js';
import { IS_DEMO } from './demoFlag';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = (!IS_DEMO && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;
