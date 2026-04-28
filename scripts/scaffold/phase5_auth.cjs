const fs = require('fs');
const path = require('path');

const files = {
  // Auth Store to track authenticated user
  'src/store/userStore.js': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS } from '../constants/scoreWeights';

export const useUserStore = create(
  persist(
    (set) => ({
      user: null, // Holds Supabase Auth User object if logged in
      profile: { name: 'Grinder', rank_tier: 'Normie' },
      preferences: { scoreWeights: DEFAULT_WEIGHTS },
      
      setUser: (user) => set({ user }),
      updateProfile: (data) => set((state) => ({ profile: { ...state.profile, ...data } })),
      clearUser: () => set({ user: null, profile: { name: 'Grinder', rank_tier: 'Normie' } })
    }),
    { name: 'antigravity-user-store' }
  )
);\n`,

  // AuthPage component
  'src/pages/Auth/AuthPage.jsx': `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useUserStore } from '../../store/userStore';
import ParticleBackground from '../../components/three/ParticleBackground/ParticleBackground';
import styles from './Auth.module.css';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useUserStore(state => state.setUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured yet. Set VITE_SUPABASE_URL and KEY in .env');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = isLogin 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      setUser(data.user);
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <ParticleBackground />
      <div className={styles.card}>
        <h1>ANTIGRAVITY ⚡</h1>
        <p className={styles.subtitle}>{isLogin ? 'Initialize Uplink' : 'Register Signature'}</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <input 
            type="email" 
            placeholder="Identity Hook (Email)" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required 
          />
          <input 
            type="password" 
            placeholder="Cipher (Password)" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required 
          />
          
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'SYNCING...' : (isLogin ? 'ACCESS TERMINAL' : 'INITIALIZE PROTOCOL')}
          </button>
        </form>
        
        <p className={styles.toggle} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'No signature? Create one.' : 'Already registered? Login.'}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;\n`,

  'src/pages/Auth/Auth.module.css': `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  position: relative;
  z-index: 10;
}

.card {
  background: rgba(20, 20, 23, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 3rem;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
}

.card h1 {
  font-family: 'Outfit', sans-serif;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #fff;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 2rem;
  letter-spacing: 0.05em;
}

.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input {
  width: 100%;
  padding: 0.8rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: #fff;
  font-family: 'Inter', sans-serif;
  transition: var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--rank-alpha);
  box-shadow: 0 0 10px rgba(0, 191, 255, 0.2);
}

.button {
  width: 100%;
  padding: 1rem;
  background: var(--rank-alpha);
  color: #000;
  font-weight: 800;
  font-family: 'Outfit', sans-serif;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  margin-top: 1rem;
}

.button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 191, 255, 0.4);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  width: 100%;
  padding: 0.8rem;
  background: rgba(255, 49, 49, 0.1);
  border: 1px solid var(--rank-slacking);
  color: var(--rank-slacking);
  border-radius: var(--radius-sm);
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
  text-align: center;
}

.toggle {
  margin-top: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.toggle:hover {
  color: #fff;
}\n`,

  // Guarded Routes Update
  'src/router/routes.jsx': `import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import HabitsPage from '../pages/Habits/HabitsPage';
import WorkoutPage from '../pages/Workout/WorkoutPage';
import LeaderboardPage from '../pages/Leaderboard/LeaderboardPage';
import AuthPage from '../pages/Auth/AuthPage';
import { useUserStore } from '../store/userStore';

const ProtectedRoute = ({ children }) => {
  const user = useUserStore((state) => state.user);
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  { 
    path: '/', 
    element: <ProtectedRoute><App /></ProtectedRoute>, 
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'habits', element: <HabitsPage /> },
      { path: 'workout', element: <WorkoutPage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: '*', element: <div style={{padding: '5rem', color: '#fff'}}><h2>Under Construction</h2><p>This module lands in Phase 5.</p></div> }
    ]
  }
]);\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
