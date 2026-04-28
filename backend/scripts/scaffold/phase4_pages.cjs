const fs = require('fs');
const path = require('path');

const files = {
  // HabitsPage
  'src/pages/Habits/HabitsPage.jsx': `import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useTaskStore } from '../../store/taskStore';
import { getTodayStr } from '../../utils/dateUtils';
import styles from './Habits.module.css';

const MOCK_HABITS = [
  { id: 'h1', title: 'Deep Work (2hr)', priority: 'High', points: 200 },
  { id: 'h2', title: 'Cardio', priority: 'Med', points: 100 },
  { id: 'h3', title: 'Reading (30m)', priority: 'Low', points: 50 },
];

const HabitsPage = () => {
  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>Daily Directives</h1>
        <p>Your permanent habits tracker.</p>
      </header>
      
      <div className={styles.list}>
        {MOCK_HABITS.map(h => (
          <div key={h.id} className={styles.item}>
            <div className={styles.info}>
              <h3>{h.title}</h3>
              <span className={styles.badge}>{h.points} AP</span>
            </div>
            <div className={styles.actions}>
              <button className={styles.btnOutline}>Log</button>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
export default HabitsPage;\n`,

  'src/pages/Habits/Habits.module.css': `.container { padding: 2rem; max-width: 800px; margin: 0 auto; }
.header { margin-bottom: 2rem; }
.header h1 { font-family: 'Outfit'; font-size: 2rem; color: #fff; }
.list { display: flex; flex-direction: column; gap: 1rem; }
.item { background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; }
.info h3 { color: #fff; margin-bottom: 0.25rem; }
.badge { font-size: 0.75rem; background: rgba(0, 191, 255, 0.1); color: var(--rank-alpha); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; }\n`,

  // WorkoutPage
  'src/pages/Workout/WorkoutPage.jsx': `import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import styles from '../Habits/Habits.module.css'; // Reuse shell styles temporarily

const WorkoutPage = () => {
  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>Workout Engine</h1>
        <p>Log volume, cardio, and mobility.</p>
      </header>
      
      <div className={styles.list}>
        <div className={styles.item}>
          <div className={styles.info}>
            <h3>Push Day (Chest/Tris)</h3>
            <span className={styles.badge}>Strength</span>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
export default WorkoutPage;\n`,

  // Auth / Leaderboard
  'src/pages/Leaderboard/LeaderboardPage.jsx': `import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import GlobeStats from '../../components/three/GlobeStats/GlobeStats';
import { useAuraStore } from '../../store/auraStore';
import styles from './Leaderboard.module.css';

const LeaderboardPage = () => {
  const { totalAuraPoints, streakDays, multiplier } = useAuraStore();
  
  return (
    <div className={styles.relativeWrap}>
      <GlobeStats />
      <PageWrapper className={styles.container}>
        <header className={styles.header}>
          <h1>GLOBAL LEADERBOARD</h1>
          <p>Syncing Aura Points...</p>
        </header>
        
        <div className={styles.podium}>
          <div className={styles.card}>
            <h2>YOU</h2>
            <div className={styles.stats}>
              <p>{totalAuraPoints.toLocaleString()} AP</p>
              <span>{multiplier}x | {streakDays}d Streak</span>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
};
export default LeaderboardPage;\n`,

  'src/pages/Leaderboard/Leaderboard.module.css': `.relativeWrap { position: relative; min-height: 100vh; overflow: hidden; }
.container { padding: 4rem 2rem; max-width: 1000px; margin: 0 auto; position: relative; z-index: 10; }
.header { text-align: center; margin-bottom: 4rem; text-shadow: 0 4px 20px rgba(0,0,0,0.8); }
.header h1 { font-family: 'Outfit'; font-size: 3rem; color: #fff; letter-spacing: 0.2em; }
.podium { display: flex; justify-content: center; }
.card { background: rgba(20, 20, 23, 0.6); backdrop-filter: blur(20px); border: 1px solid var(--rank-alpha); border-radius: var(--radius-lg); padding: 2rem; text-align: center; width: 100%; max-width: 400px; box-shadow: 0 0 30px rgba(0, 191, 255, 0.2); }
.card h2 { color: #fff; font-family: 'Outfit'; margin-bottom: 1rem; }
.stats p { font-size: 2.5rem; font-weight: 800; color: #fff; text-shadow: 0 0 10px var(--rank-alpha); margin-bottom: 0.5rem; }\n`,

  // Routes Integration
  'src/router/routes.jsx': `import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import HabitsPage from '../pages/Habits/HabitsPage';
import WorkoutPage from '../pages/Workout/WorkoutPage';
import LeaderboardPage from '../pages/Leaderboard/LeaderboardPage';

export const router = createBrowserRouter([
  { 
    path: '/', 
    element: <App />, 
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'habits', element: <HabitsPage /> },
      { path: 'workout', element: <WorkoutPage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      // Fallback
      { path: '*', element: <div style={{padding: '5rem', color: '#fff'}}><h2>Under Construction</h2><p>This module lands in Phase 5.</p></div> }
    ]
  }
]);\n`,

  // Update App.jsx to render ParticleBackground globally
  'src/App.jsx': `import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar/Sidebar';
import Header from './components/layout/Header/Header';
import ParticleBackground from './components/three/ParticleBackground/ParticleBackground';
import './index.css';

function App() {
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

export default App;\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
