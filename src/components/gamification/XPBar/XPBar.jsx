import React from 'react';
import { useScoreStore } from '../../../store/scoreStore';
import { RANKS } from '../../../constants/ranks';
import { getAPColor } from '../../../utils/apColorLogic';
import styles from './XPBar.module.css';

const XPBar = () => {
  const { todayScore } = useScoreStore();

  // Find next rank threshold
  const rankEntries = Object.values(RANKS).sort((a, b) => a.min - b.min);
  let nextRank = null;
  let currentRank = rankEntries[0];

  for (let i = 0; i < rankEntries.length; i++) {
    if (todayScore >= rankEntries[i].min) {
      currentRank = rankEntries[i];
      nextRank = rankEntries[i + 1] || rankEntries[i];
    }
  }

  const progress = Math.min(((todayScore - currentRank.min) / ((nextRank.min - currentRank.min) || 1)) * 100, 100);
  const barColor = getAPColor(todayScore);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>DAILY RANK PROG</span>
        <span className={styles.score}>{todayScore} / {nextRank.min}</span>
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
