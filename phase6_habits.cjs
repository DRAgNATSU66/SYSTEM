const fs = require('fs');
const path = require('path');

const files = {
  // TaskForm Modal
  'src/components/tasks/TaskForm/TaskForm.jsx': `import React, { useState } from 'react';
import { useTaskStore } from '../../../store/taskStore';
import { TASK_TYPES } from '../../../constants/taskTypes';
import styles from './TaskForm.module.css';

const TaskForm = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState(TASK_TYPES.PERMANENT_DAILY);
  const [weight, setWeight] = useState(100);
  const addTask = useTaskStore(state => state.addTask);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title, type, weight: Number(weight), method: 'checkbox' });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>New Directive</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input 
            type="text" 
            placeholder="e.g. 10 Pages Reading" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className={styles.input}
            autoFocus 
          />
          <div className={styles.row}>
            <select value={type} onChange={(e) => setType(e.target.value)} className={styles.input}>
              <option value={TASK_TYPES.PERMANENT_DAILY}>Permanent Habit</option>
              <option value={TASK_TYPES.SIDE_HUSTLE}>Side Hustle / Deep Work</option>
            </select>
            <input 
              type="number" 
              value={weight} 
              onChange={e => setWeight(e.target.value)} 
              className={styles.input} 
              style={{ width: '100px' }} 
            />
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>Cancel</button>
            <button type="submit" className={styles.btnSubmit}>Initialize</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default TaskForm;\n`,

  'src/components/tasks/TaskForm/TaskForm.module.css': `.overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.8);
}
.modal h2 { font-family: 'Outfit'; color: #fff; margin-bottom: 1.5rem; }
.form { display: flex; flex-direction: column; gap: 1rem; }
.row { display: flex; gap: 1rem; }
.input {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  color: #fff;
  font-family: inherit;
  width: 100%;
}
.input:focus { outline: none; border-color: var(--rank-alpha); }
.actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
.btnCancel { background: transparent; color: var(--text-secondary); border: none; cursor: pointer; padding: 0.5rem 1rem; border-radius: var(--radius-sm); }
.btnSubmit { background: var(--rank-alpha); color: #000; font-weight: 800; border: none; cursor: pointer; padding: 0.5rem 1.5rem; border-radius: var(--radius-sm); }\n`,

  // Update Habits Page
  'src/pages/Habits/HabitsPage.jsx': `import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import TaskForm from '../../components/tasks/TaskForm/TaskForm';
import { useTaskStore } from '../../store/taskStore';
import { useScoreStore } from '../../store/scoreStore';
import { useAuraStore } from '../../store/auraStore';
import { getTodayStr } from '../../utils/dateUtils';
import { computeDailyScore } from '../../utils/scoreCalculator';
import { DEFAULT_WEIGHTS } from '../../constants/scoreWeights';
import styles from './Habits.module.css';

const HabitsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const tasks = useTaskStore(state => state.tasks);
  const completions = useTaskStore(state => state.completions);
  const toggleCompletion = useTaskStore(state => state.toggleCompletion);
  
  // Directly pull for fast update
  const saveScore = useScoreStore(state => state.computeAndSaveDayScore);
  const computeAura = useAuraStore(state => state.computeTodayAura);
  const today = getTodayStr();

  const handleToggle = (task) => {
    const isCompleted = completions[task.id]?.[today];
    
    // Toggle state internally
    toggleCompletion(task.id, today, !isCompleted);

    // Because state is async, compute logic manually for the snapshot
    const snapTasks = tasks.map(t => ({
      ...t, 
      completed: t.id === task.id ? !isCompleted : (completions[t.id]?.[today] || false)
    }));

    // Trigger instant global point recalculation
    const newScore = computeDailyScore(snapTasks, DEFAULT_WEIGHTS);
    useScoreStore.setState(prev => ({ dailyScores: { ...prev.dailyScores, [today]: newScore }, todayScore: newScore }));
    
    // Refresh Aura
    computeAura(newScore, false, false, 0); 
  };

  const removeTask = useTaskStore(state => state.removeTask);

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1>Daily Directives</h1>
            <p className={styles.subtitle}>Your core operational matrix.</p>
          </div>
          <button className={styles.btnAdd} onClick={() => setShowForm(true)}>+ New Metric</button>
        </div>
      </header>
      
      <div className={styles.list}>
        {tasks.length === 0 && <p className={styles.empty}>No directives established. Awaiting input.</p>}
        {tasks.map(t => {
          const isDone = completions[t.id]?.[today];
          return (
            <div key={t.id} className={\`\${styles.item} \${isDone ? styles.itemDone : ''}\`}>
              <div className={styles.info}>
                <h3 className={isDone ? styles.titleDone : ''}>{t.title}</h3>
                <span className={styles.badge}>{t.weight} AP | {t.type}</span>
              </div>
              <div className={styles.actions}>
                <button 
                  className={\`\${styles.btnLog} \${isDone ? styles.btnLogged : ''}\`}
                  onClick={() => handleToggle(t)}
                >
                  {isDone ? 'COMPLETED' : 'LOG'}
                </button>
                <button className={styles.btnDelete} onClick={() => removeTask(t.id)}>×</button>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
    </PageWrapper>
  );
};
export default HabitsPage;\n`,

  'src/pages/Habits/Habits.module.css': `.container { padding: 2rem; max-width: 800px; margin: 0 auto; }
.headerRow { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
.header h1 { font-family: 'Outfit'; font-size: 2.5rem; color: #fff; }
.subtitle { color: var(--text-secondary); }
.btnAdd { background: transparent; color: var(--rank-alpha); border: 1px solid var(--rank-alpha); padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-family: 'Outfit'; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btnAdd:hover { background: var(--rank-alpha); color: #000; }
.list { display: flex; flex-direction: column; gap: 1rem; }
.empty { color: var(--text-secondary); font-style: italic; text-align: center; margin-top: 3rem; }
.item { background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
.itemDone { border-color: var(--rank-sigma); background: rgba(57, 255, 20, 0.05); }
.info h3 { color: #fff; margin-bottom: 0.25rem; transition: 0.3s; }
.titleDone { color: var(--text-secondary); text-decoration: line-through; }
.badge { font-size: 0.65rem; background: rgba(255, 255, 255, 0.1); color: var(--text-secondary); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; }
.actions { display: flex; gap: 0.5rem; align-items: center; }
.btnLog { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; }
.btnLog:hover { background: rgba(255,255,255,0.1); }
.btnLogged { background: var(--rank-sigma); color: #000; border-color: var(--rank-sigma); }
.btnLogged:hover { background: var(--rank-sigma); }
.btnDelete { background: transparent; border: none; color: var(--text-secondary); font-size: 1.25rem; cursor: pointer; }
.btnDelete:hover { color: var(--rank-slacking); }\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
