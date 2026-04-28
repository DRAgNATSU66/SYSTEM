import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import styles from './StreakCounter.module.css';

const StreakCounter = () => {
  const { streakDays } = useAuraStore();
  
  return (
    <div className={styles.container}>
      <h3 className={styles.label}>STREAK</h3>
      <div className={styles.value}>
        <span className={streakDays > 0 ? styles.fireActive : styles.fireInactive}>🔥</span>
        {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
      </div>
    </div>
  );
};
export default StreakCounter;
