// Dev-only demo mode: skips Supabase and seeds mock data. Never true in a production build.
export const IS_DEMO = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';
