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

  // SVG wave — smooth cubic bezier path
  const svgW = 500, svgH = 90, pad = 20;
  const innerW = svgW - pad * 2;
  const innerH = svgH - pad * 2;
  const wavePoints = waveData.length > 1
    ? waveData.map(([, d], i) => ({
        x: pad + (i / (waveData.length - 1)) * innerW,
        y: svgH - pad - ((d.mood / 10) * innerH),
      }))
    : null;

  const wavePath = wavePoints
    ? wavePoints.reduce((d, pt, i) => {
        if (i === 0) return `M ${pt.x} ${pt.y}`;
        const prev = wavePoints[i - 1];
        const cpx = (prev.x + pt.x) / 2;
        return `${d} C ${cpx} ${prev.y}, ${cpx} ${pt.y}, ${pt.x} ${pt.y}`;
      }, '')
    : null;

  const areaPath = wavePath
    ? `${wavePath} L ${wavePoints[wavePoints.length - 1].x} ${svgH} L ${wavePoints[0].x} ${svgH} Z`
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
          <div className={styles.infoCardHeader}>
            <h3 className={styles.sectionLabel}>NEURAL WAVE</h3>
          </div>
          <svg
            width="100%"
            viewBox={`0 0 ${svgW} ${svgH}`}
            className={styles.waveSvg}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00CFFF" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#00CFFF" stopOpacity="0.00" />
              </linearGradient>
              <filter id="waveGlow" x="-10%" y="-100%" width="120%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* gradient fill under curve */}
            {areaPath && <path d={areaPath} fill="url(#waveAreaFill)" />}
            {/* glowing smooth curve */}
            {wavePath && (
              <path
                d={wavePath}
                fill="none"
                stroke="#00CFFF"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#waveGlow)"
              />
            )}
            {/* Mood nodes */}
            {wavePoints && waveData.map(([, d], i) => {
              const pt = wavePoints[i];
              const nodeFace = faces.find(f => f.val === d.mood) || faces[2];
              return (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="6" fill={nodeFace.color} opacity="0.20" />
                  <circle cx={pt.x} cy={pt.y} r="3.5" fill={nodeFace.color} stroke="rgba(0,0,0,0.6)" strokeWidth="1" />
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {moodHistory.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.infoCardHeader}>
            <h3 className={styles.sectionLabel}>RECENT ENTRIES</h3>
          </div>
          <div className={styles.historyList}>
            {moodHistory.map(([date, data]) => {
              const face = faces.find(f => f.val === data.mood);
              return (
                <div key={date} className={styles.historyEntry} style={{ '--mood-color': face?.color || '#FFD700' }}>
                  <span className={styles.historyDate}>{date}</span>
                  <span
                    className={styles.historyPill}
                    style={{ background: `${face?.color || '#FFD700'}22`, border: `1px solid ${face?.color || '#FFD700'}55`, color: face?.color || '#FFD700' }}
                  >
                    {face?.label || 'STABLE'}
                  </span>
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
