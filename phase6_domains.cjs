const fs = require('fs');
const path = require('path');

const files = {
  // NumericInputCard for Workouts
  'src/components/tasks/NumericInputCard/NumericInputCard.jsx': `import React, { useState } from 'react';
import { useTaskStore } from '../../../store/taskStore';
import { useScoreStore } from '../../../store/scoreStore';
import { useAuraStore } from '../../../store/auraStore';
import { getTodayStr } from '../../../utils/dateUtils';
import { computeDailyScore } from '../../../utils/scoreCalculator';
import { DEFAULT_WEIGHTS } from '../../../constants/scoreWeights';
import styles from './NumericInputCard.module.css';

const NumericInputCard = ({ task }) => {
  const completions = useTaskStore(state => state.completions);
  const toggleCompletion = useTaskStore(state => state.toggleCompletion);
  const tasks = useTaskStore(state => state.tasks);
  const today = getTodayStr();

  const [val, setVal] = useState(completions[task.id]?.[today] || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    toggleCompletion(task.id, today, Number(val));
    
    // Recalculate global scores
    const snapTasks = tasks.map(t => ({
      ...t, 
      progress: t.id === task.id ? Number(val) : (completions[t.id]?.[today] || 0)
    }));

    const newScore = computeDailyScore(snapTasks, DEFAULT_WEIGHTS);
    useScoreStore.setState(prev => ({ dailyScores: { ...prev.dailyScores, [today]: newScore }, todayScore: newScore }));
    useAuraStore.getState().computeTodayAura(newScore, false, false, 0); 
  };

  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <h3>{task.title}</h3>
        <span className={styles.badge}>Target: {task.target} {task.unit} | {task.weight} AP</span>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input 
          type="number" 
          value={val} 
          onChange={(e) => setVal(e.target.value)}
          className={styles.input}
          min="0"
        />
        <button type="submit" className={styles.btnLog}>LOG</button>
      </form>
    </div>
  );
};
export default NumericInputCard;\n`,

  'src/components/tasks/NumericInputCard/NumericInputCard.module.css': `.card {
  background: var(--bg-surface);
  border: 1px solid rgba(255,255,255,0.05);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info h3 { color: #fff; margin-bottom: 0.25rem; }
.badge { font-size: 0.65rem; background: rgba(255, 255, 255, 0.1); color: var(--text-secondary); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; }
.form { display: flex; gap: 0.5rem; align-items: center; }
.input {
  width: 80px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  color: #fff;
  font-family: 'Outfit';
  font-weight: 800;
  text-align: center;
}
.input:focus { outline: none; border-color: var(--rank-alpha); }
.btnLog { background: var(--rank-alpha); color: #000; border: none; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-weight: 800; cursor: pointer; transition: 0.2s; }
.btnLog:hover { transform: translateY(-2px); }\n`,

  // Workout Page
  'src/pages/Workout/WorkoutPage.jsx': `import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import NumericInputCard from '../../components/tasks/NumericInputCard/NumericInputCard';
import { useTaskStore } from '../../store/taskStore';
import { TASK_TYPES } from '../../constants/taskTypes';
import styles from '../Habits/Habits.module.css';

const WorkoutPage = () => {
  const tasks = useTaskStore(state => state.tasks);
  const workoutTasks = tasks.filter(t => t.type === 'WORKOUT');
  
  // Temporary seed for UX viewing if empty
  const [mockMode, setMockMode] = useState(workoutTasks.length === 0);

  const MOCK = [
    { id: 'w1', title: 'Cardio Engine', type: 'WORKOUT', weight: 200, method: 'numeric', target: 60, unit: 'mins' },
    { id: 'w2', title: 'Push Hypertrophy', type: 'WORKOUT', weight: 150, method: 'numeric', target: 15, unit: 'sets' }
  ];

  const renderData = mockMode ? MOCK : workoutTasks;

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1>Workout Engine</h1>
            <p className={styles.subtitle}>Log volume and cardio to scale physical vectors.</p>
          </div>
        </div>
      </header>
      
      <div className={styles.list}>
        {renderData.length === 0 && <p className={styles.empty}>No workout vectors established. Head to Habits to inject Workout directives.</p>}
        {renderData.map(t => <NumericInputCard key={t.id} task={t} />)}
      </div>
    </PageWrapper>
  );
};
export default WorkoutPage;\n`,

  // Study Page
  'src/pages/Study/StudyPage.jsx': `import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import NumericInputCard from '../../components/tasks/NumericInputCard/NumericInputCard';
import styles from '../Habits/Habits.module.css'; // Re-use shell

const StudyPage = () => {
  // Temporary mock structure for Study blocks
  const [sessionActive, setSessionActive] = useState(false);

  const mockStudyTask = { 
    id: 's1', title: 'Deep Work (Blocks)', type: 'STUDY', weight: 200, method: 'numeric', target: 4, unit: 'pomodoros' 
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1>Deep Work Engine</h1>
            <p className={styles.subtitle}>Scale cognitive vectors through highly focused pomodoro blocks.</p>
          </div>
        </div>
      </header>
      
      <div className={styles.list}>
        <NumericInputCard task={mockStudyTask} />
      </div>
      
      {/* Visual only placeholder for native pomodoro timer */}
      <div style={{ marginTop: '2rem', padding: '2rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--rank-alpha)' }}>
        <h2 style={{ fontFamily: 'Outfit', color: '#fff', fontSize: '3rem', marginBottom: '1rem' }}>25:00</h2>
        <button 
          onClick={() => setSessionActive(!sessionActive)}
          style={{ background: sessionActive ? 'var(--rank-slacking)' : 'var(--rank-alpha)', color: '#000', border: 'none', padding: '1rem 3rem', borderRadius: 'var(--radius-pill)', fontWeight: '800', cursor: 'pointer' }}
        >
          {sessionActive ? 'TERMINATE FOCUS' : 'INITIATE DEEP WORK'}
        </button>
      </div>
    </PageWrapper>
  );
};
export default StudyPage;\n`,

  // Update Router to map Study
  'src/router/routes.jsx': `import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import HabitsPage from '../pages/Habits/HabitsPage';
import WorkoutPage from '../pages/Workout/WorkoutPage';
import StudyPage from '../pages/Study/StudyPage';
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
      { path: 'study', element: <StudyPage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: '*', element: <div style={{padding: '5rem', color: '#fff'}}><h2>Under Construction</h2><p>This module lands in Phase 7.</p></div> }
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
