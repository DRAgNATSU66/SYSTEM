import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useScoreStore } from '../../store/scoreStore';
import { resolveRank } from '../../utils/rankResolver';
import styles from './Calendar.module.css';

const TemporalDot = ({ label, score, date }) => {
  const rank = resolveRank(score);
  return (
    <div className={styles.dotWrapper}>
      <div 
        className={styles.dot} 
        style={{ backgroundColor: score > 0 ? rank.color : 'rgba(255,255,255,0.05)' }} 
      />
      <div className={styles.dotLabel}>{label}</div>
      <div className={styles.tooltip}>
        <span className={styles.ttDate}>{date}</span>
        <span className={styles.ttScore}>{Math.floor(score)} AP</span>
        <span className={styles.ttRank}>{rank.title}</span>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const { dailyScores } = useScoreStore();
  const [view, setView] = useState('OVERALL'); // YEAR, MONTH, WEEK, OVERALL
  
  const today = new Date();
  
  // YEAR VIEW (12 Months)
  const getYearData = () => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), i, 1);
    const monthStr = d.toLocaleString('default', { month: 'short' });
    // Avg score for month
    const scores = Object.entries(dailyScores)
      .filter(([date]) => date.startsWith(d.toISOString().slice(0, 7)))
      .map(([, s]) => s);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { label: monthStr, score: avg, date: d.getFullYear() };
  });

  // MONTH VIEW (4-5 Weeks)
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

  // WEEK VIEW (7 Days)
  const getWeekData = () => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), score: dailyScores[dateStr] || 0, date: dateStr };
  });

  // OVERALL VIEW (Traditional Grid)
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
              <div key={d.date} className={styles.gridDay} style={{ '--day-color': d.score > 0 ? resolveRank(d.score).color : 'rgba(255,255,255,0.05)' }}>
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

      <div className={styles.legend}>
        <span>STAGNANT</span>
        <div className={styles.block} style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className={styles.block} style={{ background: 'var(--rank-normie)' }} />
        <div className={styles.block} style={{ background: 'var(--rank-slacking)' }} />
        <div className={styles.block} style={{ background: 'var(--rank-dreamer)' }} />
        <div className={styles.block} style={{ background: 'var(--rank-sigma)' }} />
        <div className={styles.block} style={{ background: 'var(--rank-alpha)' }} />
        <span>FLOW</span>
      </div>
    </PageWrapper>
  );
};

export default CalendarPage;
