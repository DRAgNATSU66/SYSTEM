import React from 'react';
import { useScoreStore } from '../../../store/scoreStore';
import { getAPColorHex } from '../../../utils/apColorLogic';
import styles from './CalendarHeatmap.module.css';

const CalendarHeatmap = () => {
  const { dailyScores } = useScoreStore();

  const days = [];
  const now = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      score: dailyScores[dateStr] || 0
    });
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>90-DAY HEATMAP</h3>
      <div className={styles.scrollWrapper}>
        <div className={styles.grid}>
          {days.map((d, i) => {
            const isZero = d.score === 0;
            return (
              <div
                key={i}
                className={styles.cell}
                style={{ backgroundColor: isZero ? 'rgba(255,255,255,0.05)' : getAPColorHex(d.score) }}
                title={`${d.dateStr}: ${d.score}`}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.legend}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Less</span>
        <div className={styles.cell} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div className={styles.cell} style={{ backgroundColor: '#EF4444' }} />
        <div className={styles.cell} style={{ backgroundColor: '#EAB308' }} />
        <div className={styles.cell} style={{ backgroundColor: '#22C55E' }} />
        <div className={styles.cell} style={{ backgroundColor: '#3B82F6' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>More</span>
      </div>
    </div>
  );
};
export default CalendarHeatmap;
