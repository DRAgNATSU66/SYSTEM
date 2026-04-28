const fs = require('fs');
const path = require('path');

const files = {
  // Sync Hook
  'src/hooks/useCloudSync.js': `import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuraStore } from '../store/auraStore';
import { useUserStore } from '../store/userStore';
import { useScoreStore } from '../store/scoreStore';

export const useCloudSync = () => {
  const user = useUserStore(state => state.user);
  const auraState = useAuraStore();
  const scoreState = useScoreStore();
  const lastSyncTime = useRef(0);

  useEffect(() => {
    // Only sync if logged in and configured
    if (!user || !supabase) return;

    // Throttle exact sync to run max every 5 seconds natively on state-change ping
    const now = Date.now();
    if (now - lastSyncTime.current < 5000) return;
    lastSyncTime.current = now;

    const syncToDB = async () => {
      try {
        // Upsert Profile values (Aura, Streak, Multiplier)
        await supabase.from('profiles').upsert({
          id: user.id,
          total_aura_points: auraState.totalAuraPoints,
          current_streak: auraState.streakDays,
          multiplier: auraState.multiplier,
          last_login_date: auraState.lastLoginDate
        });

        // Upsert today's score
        if (scoreState.todayScore > 0) {
          const today = new Date().toISOString().split('T')[0];
          await supabase.from('daily_scores').upsert({
            user_id: user.id,
            date: today,
            score: scoreState.todayScore
          }, { onConflict: 'user_id, date' });
        }
        
      } catch (err) {
        console.error('Cloud Sync failed silently:', err);
      }
    };

    // Fire and forget background sync
    syncToDB();

  }, [
    user, 
    auraState.totalAuraPoints, 
    auraState.streakDays, 
    scoreState.todayScore
  ]);
};\n`,

  'src/App.jsx': `import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar/Sidebar';
import Header from './components/layout/Header/Header';
import ParticleBackground from './components/three/ParticleBackground/ParticleBackground';
import { useCloudSync } from './hooks/useCloudSync';
import './index.css';

function App() {
  // Mount the global background syncer
  useCloudSync();

  return (
    <div className="app-layout">
      <ParticleBackground />
      <Sidebar />
      <main>
        <Header />
        <Outlet />
      </main>
    </div>
  );
}

export default App;\n`,

  // Auth Layout Update (adding Logout to Sidebar for completeness)
  'src/components/layout/Sidebar/Sidebar.jsx': `import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUiStore } from '../../../store/uiStore';
import { useUserStore } from '../../../store/userStore';
import { supabase } from '../../../services/supabaseClient';
import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import styles from './Sidebar.module.css';
import { LayoutDashboard, Dumbbell, BookOpen, Utensils, Moon, Smile, CheckCircle, Target, Video, Calendar, Trophy, History, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const { sidebarOpen } = useUiStore();
  const clearUser = useUserStore(state => state.clearUser);
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    clearUser();
    navigate('/auth');
  };

  if (!sidebarOpen) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h2>ANTIGRAVITY ⚡</h2>
      </div>
      
      <nav className={styles.nav}>
        <SidebarItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" exact />
        
        <SidebarSection title="DAILY CORE">
          <SidebarItem to="/workout" icon={<Dumbbell size={18} />} label="Workout" />
          <SidebarItem to="/study" icon={<BookOpen size={18} />} label="Study" />
          <SidebarItem to="/nutrition" icon={<Utensils size={18} />} label="Nutrition" />
          <SidebarItem to="/sleep" icon={<Moon size={18} />} label="Sleep" />
          <SidebarItem to="/mood" icon={<Smile size={18} />} label="Mood" />
        </SidebarSection>
        
        <SidebarSection title="HABITS">
          <SidebarItem to="/habits" icon={<CheckCircle size={18} />} label="Habits" />
          <SidebarItem to="/goals" icon={<Target size={18} />} label="Goals" />
        </SidebarSection>
        
        <SidebarSection title="SIDE HUSTLES">
          <SidebarItem to="/sidehustles" icon={<Video size={18} />} label="Content / Projects" />
        </SidebarSection>

        <SidebarSection title="AURA">
          <SidebarItem to="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" />
          <SidebarItem to="/history" icon={<History size={18} />} label="Aura History" />
        </SidebarSection>

        <SidebarSection title="ANALYTICS">
          <SidebarItem to="/calendar" icon={<Calendar size={18} />} label="Calendar" />
        </SidebarSection>
        
        <div className={styles.spacer} />
        <SidebarItem to="/settings" icon={<Settings size={18} />} label="Settings" />
        <div style={{ cursor: 'pointer', marginTop: 'auto' }} onClick={handleLogout}>
          <div className="\${styles.item}" style={{ color: 'var(--rank-slacking)' }}>
            <span className={styles.icon}><LogOut size={18} /></span>
            <span className={styles.label}>Log Out</span>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
