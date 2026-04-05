import React, { useMemo } from 'react';
import { useAuraStore } from '../../../store/auraStore';
import { getAPColorHex } from '../../../utils/apColorLogic';
import styles from './CalendarHeatmap.module.css';

const CalendarHeatmap = () => {
  const { auraHistory, dailyCategoryAP, todayEarned } = useAuraStore();

  // Build a date->total AP map from all available data
  const apByDate = useMemo(() => {
    const map = {};
    const today = new Date().toISOString().split('T')[0];

    // 1. Sum AP per date from auraHistory (includes both local + server-hydrated entries)
    //    Use 'earned' field from server data when available, fallback to positive 'net'
    (auraHistory || []).forEach(entry => {
      if (!entry.date) return;
      const apValue = entry.earned != null ? entry.earned : Math.max(0, entry.net || 0);
      map[entry.date] = (map[entry.date] || 0) + apValue;
    });

    // 2. For today, use todayEarned as the most accurate live value
    //    since auraHistory entries may be incremental or already consolidated
    if (todayEarned > 0) {
      map[today] = Math.max(map[today] || 0, todayEarned);
    }

    // 3. Also cross-check dailyCategoryAP for days that may not be in auraHistory
    Object.entries(dailyCategoryAP || {}).forEach(([date, cats]) => {
      // Sum only numeric category values (skip boolean markers like NUTRITION_pro: true)
      const dayTotal = Object.entries(cats).reduce((sum, [key, val]) => {
        // Skip nutrition-specific boolean markers
        if (key.startsWith('NUTRITION_')) return sum;
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
      if (dayTotal > 0 && (!map[date] || dayTotal > map[date])) {
        map[date] = dayTotal;
      }
    });

    return map;
  }, [auraHistory, dailyCategoryAP, todayEarned]);

  const days = [];
  const now = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      score: apByDate[dateStr] || 0
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
                title={`${d.dateStr}: ${d.score} AP`}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.legend}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Less</span>
        <div className={styles.cell} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div className={styles.cell} style={{ backgroundColor: '#EF4444' }} />
        <div className={styles.cell} style={{ backgroundColor: '#EAB308' }} />
        <div className={styles.cell} style={{ backgroundColor: '#22C55E' }} />
        <div className={styles.cell} style={{ backgroundColor: '#3B82F6' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>More</span>
      </div>
    </div>
  );
};
export default CalendarHeatmap;
