import React from 'react';
import { useScoreStore } from '../../../store/scoreStore';
import { resolveRank } from '../../../utils/rankResolver';
import styles from './CalendarHeatmap.module.css';

const CalendarHeatmap = () => {
  const { dailyScores } = useScoreStore();
  
  // Last 90 days grid
  const days = [];
  const now = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // figure out col/row for a mock github grid (by weeks)
    days.push({
      dateStr,
      score: dailyScores[dateStr] || 0
    });
  }

  // Group by week to map into rows/cols properly
  // Since we just want a visual block, we'll flex-wrap them or CSS Grid them specifically

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>90-DAY HEATMAP</h3>
      <div className={styles.scrollWrapper}>
        <div className={styles.grid}>
          {days.map((d, i) => {
            const rank = resolveRank(d.score);
            const isZero = d.score === 0;
            return (
              <div 
                key={i} 
                className={styles.cell} 
                style={{ backgroundColor: isZero ? 'rgba(255,255,255,0.05)' : rank.color }}
                title={`${d.dateStr}: ${d.score}`}
              />
            )
          })}
        </div>
      </div>
      <div className={styles.legend}>
         <span style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>Less</span>
         <div className={styles.cell} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-beta)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-slacking)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-dreamer)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-sigma)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-alpha)' }} />
         <span style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>More</span>
      </div>
    </div>
  );
};
export default CalendarHeatmap;
