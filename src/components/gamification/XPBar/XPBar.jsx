import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import { getAPColor } from '../../../utils/apColorLogic';
import styles from './XPBar.module.css';

const XPBar = () => {
  const { todayEarned, multiplier } = useAuraStore();
  const MAX_DAILY = multiplier > 1.0 ? Math.floor(2000 * multiplier) : 2000;

  const progress = Math.min((todayEarned / MAX_DAILY) * 100, 100);
  const barColor = getAPColor(todayEarned);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>DAILY RANK PROG</span>
        <span className={styles.score}>{todayEarned} / {MAX_DAILY}</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${progress}%`, backgroundColor: barColor, transition: 'background-color 0.6s ease, width 0.3s ease' }}
        />
      </div>
    </div>
  );
};
export default XPBar;
