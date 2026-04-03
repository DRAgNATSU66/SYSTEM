import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../../store/uiStore';
import { useUserStore } from '../../../store/userStore';
import { useWorkoutStore } from '../../../store/workoutStore';
import { useStudyStore } from '../../../store/studyStore';
import { useMetricsStore } from '../../../store/metricsStore';
import { getTodayStr } from '../../../utils/dateUtils';
import { supabase } from '../../../services/supabaseClient';
import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import styles from './Sidebar.module.css';
import { LayoutDashboard, Terminal, Dumbbell, BookOpen, Utensils, Moon, Smile, CheckCircle, Target, Video, Users, Swords, Calendar, Trophy, History, Settings, LogOut, Menu, X, ShoppingBag } from 'lucide-react';
import systemIcon from '../../../assets/system.png';

const Sidebar = () => {
  const { sidebarOpen } = useUiStore();
  const { clearUser } = useUserStore();
  const { logs: workoutLogs } = useWorkoutStore();
  const { sessions: studySessions } = useStudyStore();
  const { dailyMetrics, customMacros } = useMetricsStore();
  
  const today = getTodayStr();
  const navigate = useNavigate();
  
  // Calculate Progress Data
  const workoutSets = Object.values(workoutLogs[today] || {}).reduce((acc, subMap) => 
    acc + Object.values(subMap).reduce((a, bEntries) => a + bEntries.reduce((s, e) => s + e.sets, 0), 0), 0);
  const progWorkout = { value: Math.min(100, (workoutSets / 20) * 100), label: 'Sets', color: 'var(--rank-alpha)' };

  const studyMinutes = Object.values(studySessions[today] || {}).reduce((a, b) => a + b, 0);
  const progStudy = { value: Math.min(100, (studyMinutes / 120) * 100), label: 'Minutes', color: 'var(--rank-alpha)' }; // 2h = 100%

  const todayMacros = dailyMetrics[today]?.macros || {};
  const macroProgs = customMacros.map(m => (todayMacros[m.id] || 0) / m.minLimit);
  const avgMacro = (macroProgs.reduce((a, b) => a + b, 0) / (customMacros.length || 1)) * 100;
  const progNutrition = { value: Math.min(100, avgMacro), label: 'Macros', color: '#FFD700' };

  const sleepHours = dailyMetrics[today]?.sleep || 0;
  const progSleep = { value: Math.min(100, (sleepHours / 8) * 100), label: 'Recovery', color: '#00BFFF' };

  const moodVal = dailyMetrics[today]?.mood || 5;
  const progMood = { value: (moodVal / 10) * 100, label: 'Bandwidth', color: 'var(--rank-alpha)' };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    clearUser();
    navigate('/auth');
  };

  if (!sidebarOpen) return null;

  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
      <div className={styles.brand}>
        <div className={styles.logoContainer}>
          <img src={systemIcon} alt="System" className={styles.logo} />
        </div>
        <h2 className={styles.brandTitle}>SYSTEM</h2>
      </div>
      
      <nav className={styles.nav}>
        <SidebarItem to="/command" icon={<Terminal size={18} />} label="Command Center" />
        <SidebarItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" exact />
        
        <SidebarSection title="DAILY CORE">
          <SidebarItem to="/workout" icon={<Dumbbell size={18} />} label="Workout" progressData={progWorkout} />
          <SidebarItem to="/study" icon={<BookOpen size={18} />} label="Study" progressData={progStudy} />
          <SidebarItem to="/nutrition" icon={<Utensils size={18} />} label="Nutrition" progressData={progNutrition} />
          <SidebarItem to="/sleep" icon={<Moon size={18} />} label="Sleep" progressData={progSleep} />
          <SidebarItem to="/mood" icon={<Smile size={18} />} label="Mood" progressData={progMood} />
        </SidebarSection>
        
        <SidebarSection title="HOBBIES">
          <SidebarItem to="/habits" icon={<CheckCircle size={18} />} label="Hobbies" />
          <SidebarItem to="/goals" icon={<Target size={18} />} label="Goals" />
        </SidebarSection>
        
        <SidebarSection title="SIDE HUSTLES">
          <SidebarItem to="/sidehustles" icon={<Video size={18} />} label="Content / Projects" />
        </SidebarSection>

        <SidebarSection title="SOCIAL">
          <SidebarItem to="/social" icon={<Users size={18} />} label="Social Hub" />
          <SidebarItem to="/duels" icon={<Swords size={18} />} label="Aura Duels" />
        </SidebarSection>

        <SidebarSection title="AURA">
          <SidebarItem to="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" />
          <SidebarItem to="/history" icon={<History size={18} />} label="Aura History" />
        </SidebarSection>

        <SidebarSection title="ANALYTICS">
          <SidebarItem to="/calendar" icon={<Calendar size={18} />} label="Calendar" />
        </SidebarSection>
        
        <div className={styles.spacer} />
        <SidebarItem to="/shop" icon={<ShoppingBag size={18} />} label="Shop" />
        <SidebarItem to="/settings" icon={<Settings size={18} />} label="Settings" />
        <div style={{ cursor: 'pointer', marginTop: 'auto' }} onClick={handleLogout}>
          <div className={styles.item} style={{ color: 'var(--rank-slacking)' }}>
            <span className={styles.icon}><LogOut size={18} /></span>
            <span className={styles.label}>Log Out</span>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
