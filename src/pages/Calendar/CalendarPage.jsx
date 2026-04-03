import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useScoreStore } from '../../store/scoreStore';
import { getAPColorHex, getAPColorPale } from '../../utils/apColorLogic';
import styles from './Calendar.module.css';

const getColorForScore = (score) => {
  if (score <= 0) return 'rgba(255,255,255,0.05)';
  return getAPColorHex(score);
};

const getPaleColorForScore = (score) => {
  if (score <= 0) return 'rgba(255,255,255,0.04)';
  return getAPColorPale(score);
};

const getTierLabel = (score) => {
  if (score >= 1500) return 'PEAK';
  if (score >= 1000) return 'GOOD';
  if (score >= 500)  return 'OKAY';
  if (score > 0)     return 'LOW';
  return 'NONE';
};

const TemporalDot = ({ label, score, date }) => {
  return (
    <div className={styles.dotWrapper}>
      <div
        className={styles.dot}
        style={{ backgroundColor: score > 0 ? getColorForScore(score) : 'rgba(255,255,255,0.05)' }}
      />
      <div className={styles.dotLabel}>{label}</div>
      <div className={styles.tooltip}>
        <span className={styles.ttDate}>{date}</span>
        <span className={styles.ttScore}>{Math.floor(score)} AP</span>
        <span className={styles.ttRank} style={{ color: getColorForScore(score) }}>{getTierLabel(score)}</span>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const { dailyScores } = useScoreStore();
  const [view, setView] = useState('OVERALL');

  const today = new Date();

  const getYearData = () => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), i, 1);
    const monthStr = d.toLocaleString('default', { month: 'short' });
    const scores = Object.entries(dailyScores)
      .filter(([date]) => date.startsWith(d.toISOString().slice(0, 7)))
      .map(([, s]) => s);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { label: monthStr, score: avg, date: d.getFullYear() };
  });

  const getMonthData = () => Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(today.getFullYear(), today.getMonth(), i * 7 + 1);
    const scores = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + j);
      return dailyScores[d.toISOString().split('T')[0]] || 0;
    });
    const avg = scores.reduce((a, b) => a + b, 0) / 7;
    return { label: `W${i+1}`, score: avg, date: weekStart.toDateString() };
  });

  const getWeekData = () => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), score: dailyScores[dateStr] || 0, date: dateStr };
  });

  const getGridData = () => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDay = start.getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const blanks = Array.from({ length: startDay }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
      const ds = d.toISOString().split('T')[0];
      return { day: i + 1, date: ds, score: dailyScores[ds] || 0 };
    });

    return [...blanks, ...days];
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>TEMPORAL ARCHIVE</h1>
          <div className={styles.viewToggle}>
            <button className={view === 'YEAR' ? styles.active : ''} onClick={() => setView('YEAR')}>YEAR</button>
            <button className={view === 'MONTH' ? styles.active : ''} onClick={() => setView('MONTH')}>MONTH</button>
            <button className={view === 'WEEK' ? styles.active : ''} onClick={() => setView('WEEK')}>WEEK</button>
            <button className={view === 'OVERALL' ? styles.active : ''} onClick={() => setView('OVERALL')}>OVERALL</button>
          </div>
        </div>
        <p className={styles.subtitle}>Audit performance vectors across multiple temporal horizons.</p>
      </header>

      <div className={styles.content}>
        {view === 'YEAR' && (
          <div className={styles.dotFlex}>
            {getYearData().map(d => <TemporalDot key={d.label} {...d} />)}
          </div>
        )}
        {view === 'MONTH' && (
          <div className={styles.dotFlex}>
            {getMonthData().map(d => <TemporalDot key={d.label} {...d} />)}
          </div>
        )}
        {view === 'WEEK' && (
          <div className={styles.dotFlex}>
            {getWeekData().map(d => <TemporalDot key={d.label} {...d} />)}
          </div>
        )}
        {view === 'OVERALL' && (
          <div className={styles.traditionalGrid}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(h => <div key={h} className={styles.gridHeader}>{h}</div>)}
            {getGridData().map((d, i) => d ? (
              <div
                key={d.date}
                className={styles.gridDay}
                style={{ '--day-color': d.score > 0 ? getPaleColorForScore(d.score) : 'rgba(255,255,255,0.05)' }}
              >
                <span className={styles.dayNum}>{d.day}</span>
                <div className={styles.tooltip}>
                   <span className={styles.ttDate}>{d.date}</span>
                   <span className={styles.ttScore}>{Math.floor(d.score)} AP</span>
                </div>
              </div>
            ) : <div key={`blank-${i}`} className={styles.gridBlank} />)}
          </div>
        )}
      </div>

      {/* ── Color Key Legend ────────────────────────────────────────── */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.block} style={{ background: 'rgba(255,255,255,0.05)' }} />
          <span>No Log</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.block} style={{ background: '#EF4444' }} />
          <span>&lt; 500 AP</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.block} style={{ background: '#EAB308' }} />
          <span>500–999</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.block} style={{ background: '#22C55E' }} />
          <span>1000–1499</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.block} style={{ background: '#3B82F6' }} />
          <span>1500+</span>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CalendarPage;
