import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar';
import { useMetricsStore } from '../../store/metricsStore';
import { getTodayStr } from '../../utils/dateUtils';
import styles from './Mood.module.css';

const MoodPage = () => {
  const { dailyMetrics, logMetrics } = useMetricsStore();
  const today = getTodayStr();
  const currentMood = dailyMetrics[today]?.mood || 5;

  const faces = [
    { val: 1, display: '-10', label: 'LACKING', color: 'var(--rank-lacking)' },
    { val: 3, display: '-5', label: 'NORMIE', color: 'var(--rank-beta)' },
    { val: 5, display: '0', label: 'STABLE', color: '#FFD700' }, 
    { val: 8, display: '+5', label: 'GRINDER', color: 'var(--rank-sigma)' },
    { val: 10, display: '+10', label: 'IM HIM', color: 'var(--rank-alpha)' }
  ];

  const progMood = (currentMood / 10) * 100;

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>NEURAL STATE</h1>
            <p className={styles.subtitle}>Sync current emotional bandwidth.</p>
          </div>
          <div className={styles.overallProgress}>
             <ProgressBar value={progMood} label="BANDWIDTH" color={faces.find(f => f.val === currentMood)?.color} />
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        {faces.map(f => (
          <div 
            key={f.val} 
            className={`${styles.face} ${currentMood === f.val ? styles.active : ''}`}
            style={{ '--mood-color': f.color }}
            onClick={() => logMetrics({ mood: f.val })}
          >
            <div className={styles.val}>{f.display}</div>
            <div className={styles.label}>{f.label}</div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
export default MoodPage;
