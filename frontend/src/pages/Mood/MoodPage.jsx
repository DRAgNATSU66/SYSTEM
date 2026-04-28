import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar';
import { useMetricsStore } from '../../store/metricsStore';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { metricsService } from '../../services/metricsService';
import { getTodayStr } from '../../utils/dateUtils';
import styles from './Mood.module.css';

const MoodPage = () => {
  const { dailyMetrics, logMetrics } = useMetricsStore();
  const { addCategoryAP, checkAndUpdateStreak, resetDailyIfNeeded } = useAuraStore();
  const { user } = useUserStore();
  const today = getTodayStr();
  const currentMood = dailyMetrics[today]?.mood || 5;

  const [pendingMood, setPendingMood] = useState(null);
  const [noteText, setNoteText] = useState('');

  const faces = [
    { val: 1, display: '-10', label: 'LACKING', color: 'var(--rank-lacking)' },
    { val: 3, display: '-5', label: 'NORMIE', color: 'var(--rank-beta)' },
    { val: 5, display: '0', label: 'STABLE', color: '#FFD700' },
    { val: 8, display: '+5', label: 'GRINDER', color: 'var(--rank-sigma)' },
    { val: 10, display: '+10', label: 'IM HIM', color: 'var(--rank-alpha)' }
  ];

  const activeMood = pendingMood ?? currentMood;
  const activeFace = faces.find(f => f.val === activeMood) || faces[2];
  const progMood = (currentMood / 10) * 100;

  const handleLogMood = () => {
    if (!pendingMood) return;
    const face = faces.find(f => f.val === pendingMood);
    resetDailyIfNeeded();
    const metricsData = { mood: pendingMood, moodNote: noteText };
    if (user?.id) {
      metricsService.logMetrics(user.id, metricsData, today);
    } else {
      logMetrics(metricsData);
    }
    const moodAP = Math.round(Math.min(1, pendingMood / 5) * 100);
    addCategoryAP('MOOD', moodAP, `MOOD LOGGED: ${face.label}`);
    checkAndUpdateStreak();
    setPendingMood(null);
    setNoteText('');
  };

  // Mood history from dailyMetrics — sorted descending, last 14 days
  const moodHistory = Object.entries(dailyMetrics)
    .filter(([, data]) => data?.mood != null)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 14);

  // Chronological for the wave
  const waveData = [...moodHistory].reverse();

  // SVG wave
  const svgW = 400, svgH = 80, pad = 14;
  const innerW = svgW - pad * 2;
  const innerH = svgH - pad * 2;
  const wavePoints = waveData.length > 1
    ? waveData.map(([, d], i) => {
        const x = pad + (i / (waveData.length - 1)) * innerW;
        const y = svgH - pad - ((d.mood / 10) * innerH);
        return `${x},${y}`;
      }).join(' ')
    : null;

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>NEURAL STATE</h1>
            <p className={styles.subtitle}>Sync current emotional bandwidth.</p>
          </div>
          <div className={styles.overallProgress}>
            <ProgressBar value={progMood} label="BANDWIDTH" color={activeFace.color} />
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {faces.map(f => (
          <div
            key={f.val}
            className={`${styles.face} ${activeMood === f.val ? styles.active : ''}`}
            style={{ '--mood-color': f.color }}
            onClick={() => {
              setPendingMood(f.val);
              setNoteText('');
            }}
          >
            <div className={styles.val}>{f.display}</div>
            <div className={styles.label}>{f.label}</div>
          </div>
        ))}
      </div>

      {pendingMood && (
        <div className={styles.noteForm} style={{ '--mood-color': activeFace.color }}>
          <h3 className={styles.noteFormTitle}>{activeFace.label} — ADD NOTE</h3>
          <textarea
            className={styles.noteInput}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Optional notes about your current state..."
            rows={3}
          />
          <div className={styles.noteActions}>
            <button className={styles.btnLogMood} onClick={handleLogMood}>LOG MOOD</button>
            <button className={styles.btnCancel} onClick={() => setPendingMood(null)}>CANCEL</button>
          </div>
        </div>
      )}

      {waveData.length > 1 && (
        <div className={styles.waveSection}>
          <h3 className={styles.sectionLabel}>NEURAL WAVE</h3>
          <svg
            width="100%"
            viewBox={`0 0 ${svgW} ${svgH}`}
            className={styles.waveSvg}
            preserveAspectRatio="none"
          >
            <polyline
              points={wavePoints}
              fill="none"
              stroke="var(--rank-alpha)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {waveData.map(([, d], i) => {
              const x = pad + (i / (waveData.length - 1)) * innerW;
              const y = svgH - pad - ((d.mood / 10) * innerH);
              const nodeFace = faces.find(f => f.val === d.mood) || faces[2];
              return <circle key={i} cx={x} cy={y} r="4" fill={nodeFace.color} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />;
            })}
          </svg>
        </div>
      )}

      {moodHistory.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.sectionLabel}>RECENT ENTRIES</h3>
          <div className={styles.historyList}>
            {moodHistory.map(([date, data]) => {
              const face = faces.find(f => f.val === data.mood);
              return (
                <div key={date} className={styles.historyEntry} style={{ '--mood-color': face?.color || '#FFD700' }}>
                  <span className={styles.historyDate}>{date}</span>
                  <span className={styles.historyLabel}>{face?.label || 'STABLE'}</span>
                  {data.moodNote && <span className={styles.historyNote}>{data.moodNote}</span>}
                  <span className={styles.historyScore}>{face?.display || '0'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
export default MoodPage;
