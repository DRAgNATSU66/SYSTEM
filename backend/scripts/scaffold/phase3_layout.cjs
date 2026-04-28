const fs = require('fs');
const path = require('path');

const files = {
  // Sidebar JSX
  'src/components/layout/Sidebar/Sidebar.jsx': `import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '../../../store/uiStore';
import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import styles from './Sidebar.module.css';
import { LayoutDashboard, Dumbbell, BookOpen, Utensils, Moon, Smile, CheckCircle, Target, Video, Calendar, Trophy, History, Settings } from 'lucide-react';

const Sidebar = () => {
  const { sidebarOpen } = useUiStore();
  
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
      </nav>
    </aside>
  );
};

export default Sidebar;\n`,

  'src/components/layout/Sidebar/SidebarItem.jsx': `import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const SidebarItem = ({ to, icon, label, exact }) => {
  return (
    <NavLink 
      to={to} 
      end={exact}
      className={({ isActive }) => \`\${styles.item} \${isActive ? styles.active : ''}\`}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </NavLink>
  );
};
export default SidebarItem;\n`,

  'src/components/layout/Sidebar/SidebarSection.jsx': `import React from 'react';
import styles from './Sidebar.module.css';

const SidebarSection = ({ title, children }) => {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionContent}>
        {children}
      </div>
    </div>
  );
};
export default SidebarSection;\n`,

  'src/components/layout/Sidebar/Sidebar.module.css': `.sidebar {
  width: 260px;
  background-color: var(--bg-surface);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.brand {
  height: 72px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.brand h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #fff;
}

.nav {
  padding: 1.5rem 1rem;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.section {
  margin-top: 1.5rem;
}

.sectionTitle {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  padding: 0 0.5rem;
  margin-bottom: 0.5rem;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.5rem;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition-fast);
}

.item:hover {
  background-color: var(--bg-surface-hover);
  color: #fff;
}

.item.active {
  background-color: rgba(0, 191, 255, 0.1);
  color: var(--rank-alpha);
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spacer {
  flex: 1;
  min-height: 2rem;
}\n`,

  // Header JSX
  'src/components/layout/Header/Header.jsx': `import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import { useScoreStore } from '../../../store/scoreStore';
import RankBadge from './RankBadge';
import { getTodayStr } from '../../../utils/dateUtils';
import styles from './Header.module.css';

const Header = () => {
  const { todayScore } = useScoreStore();
  
  // Format Date: e.g. "Mon, Oct 24"
  const dateStr = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

  return (
    <header className={styles.header}>
      <div className={styles.date}>{dateStr}</div>
      <div className={styles.right}>
        <div className={styles.scoreContainer}>
          <span className={styles.scoreLabel}>Score:</span>
          <span className={styles.scoreValue}>{todayScore}</span>
        </div>
        <RankBadge score={todayScore} />
      </div>
    </header>
  );
};
export default Header;\n`,

  'src/components/layout/Header/RankBadge.jsx': `import React from 'react';
import { resolveRank } from '../../../utils/rankResolver';
import styles from './Header.module.css';

const RankBadge = ({ score }) => {
  const rank = resolveRank(score);
  
  return (
    <div 
      className={styles.rankBadge} 
      style={{ 
        '--badge-color': rank.color,
        boxShadow: \`0 0 12px \${rank.color}40, inset 0 0 8px \${rank.color}20\`
      }}
    >
      <div className={styles.pulse} style={{ backgroundColor: rank.color }} />
      <span className={styles.rankTitle} style={{ color: rank.color }}>{rank.title.toUpperCase()}</span>
    </div>
  );
};
export default RankBadge;\n`,

  'src/components/layout/Header/Header.module.css': `.header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(20, 20, 23, 0.8);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.date {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
}

.right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.scoreContainer {
  font-family: 'Outfit', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-surface-hover);
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.scoreLabel {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

.scoreValue {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
}

.rankBadge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--badge-color);
  background: rgba(0, 0, 0, 0.2);
}

.pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.rankTitle {
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 var(--badge-color); }
  70% { transform: scale(1.5); box-shadow: 0 0 0 6px transparent; }
  100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
}\n`,

  'src/App.jsx': `import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar/Sidebar';
import Header from './components/layout/Header/Header';
import './index.css';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main>
        <Header />
        <Outlet />
      </main>
    </div>
  );
}

export default App;\n`,

  'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/routes';
import { injectMockData } from './utils/mockSeed';
import './index.css';

// Remove this in production. Initial seed for debugging UI shapes.
if (!localStorage.getItem('antigravity-aura-store')) {
  injectMockData();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);\n`

};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
