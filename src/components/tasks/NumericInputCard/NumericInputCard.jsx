import React, { useState } from 'react';
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
export default NumericInputCard;
