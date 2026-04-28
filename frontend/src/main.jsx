import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/routes';
import { AuthProvider } from './components/auth/AuthProvider';
import { injectMockData } from './utils/mockSeed';
import './index.css';

// Seed mock data ONLY in local dev when Supabase is NOT configured and no store exists yet.
// In production (Supabase env vars present) real data is pulled from the server.
const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
if (!hasSupabase && !localStorage.getItem('antigravity-aura-store')) {
  injectMockData();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
