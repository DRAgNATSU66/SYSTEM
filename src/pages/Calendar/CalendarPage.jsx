import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import styles from './Calendar.module.css';

// ── Threshold slabs per view ──────────────────────────────────────────────────
// DAILY / OVERALL / WEEK: per-day AP
// MONTH: sum of 7 days per week  (daily thresholds × 7)
// YEAR:  sum of ~30 days per month (weekly thresholds × 30)
const THRESHOLDS = {
  DAILY:   [500,     1000,    1500],
  MONTHLY: [3500,    7000,    10500],
  YEARLY:  [105000,  210000,  315000],
};

const COLORS = {
  hex:  { red: '#EF4444', yellow: '#EAB308', green: '#22C55E', blue: '#3B82F6' },
  pale: {
    red:    'rgba(239,68,68,0.6)',
    yellow: 'rgba(234,179,8,0.6)',
    green:  'rgba(34,197,94,0.6)',
    blue:   'rgba(59,130,246,0.6)',
  },
};

const LEGEND_LABELS = {
  DAILY:   ['< 500 AP', '500 – 999', '1,000 – 1,499', '1,500+'],
  MONTHLY: ['< 3,500 AP', '3,501 – 7,000', '7,001 – 10,500', '10,500+'],
  YEARLY:  ['< 1,05,000 AP', '1,05,001 – 2,10,000', '2,10,001 – 3,15,000', '3,15,001+'],
};

function getTierKey(score, thresholds) {
  if (score <= 0)              return null;
  if (score < thresholds[0])   return 'red';
  if (score < thresholds[1])   return 'yellow';
  if (score < thresholds[2])   return 'green';
  return 'blue';
}

function getHex(score, thresholds) {
  const key = getTierKey(score, thresholds);
  return key ? COLORS.hex[key] : 'rgba(255,255,255,0.05)';
}

function getPale(score, thresholds) {
  const key = getTierKey(score, thresholds);
  return key ? COLORS.pale[key] : 'rgba(255,255,255,0.05)';
}

function getTierLabel(score, thresholds) {
  const key = getTierKey(score, thresholds);
  if (!key) return 'NONE';
  return { red: 'LOW', yellow: 'OKAY', green: 'GOOD', blue: 'PEAK' }[key];
}

// ── Date formatting helpers ───────────────────────────────────────────────────
// "YYYY-MM-DD" → "DD-MM-YYYY"
function fmtDaily(isoStr) {
  if (!isoStr || typeof isoStr !== 'string' || !isoStr.includes('-')) return String(isoStr);
  const [y, m, d] = isoStr.split('-');
  return `${d}-${m}-${y}`;
}

// Date object → "Weekday-DD-MM-YYYY"
function fmtWeekly(dateObj) {
  const day  = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dd   = String(dateObj.getDate()).padStart(2, '0');
  const mm   = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${day}-${dd}-${mm}-${yyyy}`;
}

// ── TemporalDot ───────────────────────────────────────────────────────────────
const TemporalDot = ({ label, score, displayDate, thresholds }) => {
  const hexColor = getHex(score, thresholds);
  return (
    <div className={styles.dotWrapper}>
      <div
        className={styles.dot}
        style={{ backgroundColor: hexColor }}
      />
      <div className={styles.dotLabel}>{label}</div>
      <div className={styles.tooltip}>
        <span className={styles.ttDate}>{displayDate}</span>
        <span className={styles.ttScore}>{Math.floor(score)} AP</span>
        <span className={styles.ttRank} style={{ color: hexColor }}>{getTierLabel(score, thresholds)}</span>
      </div>
    </div>
  );
};

// ── Legend ────────────────────────────────────────────────────────────────────
const Legend = ({ thresholdKey }) => {
  const labels = LEGEND_LABELS[thresholdKey];
  const colorKeys = ['red', 'yellow', 'green', 'blue'];
  return (
    <div className={styles.legend}>
      <div className={styles.legendItem}>
        <div className={styles.block} style={{ background: 'rgba(255,255,255,0.05)' }} />
        <span>No Log</span>
      </div>
      {colorKeys.map((ck, idx) => (
        <div key={ck} className={styles.legendItem}>
          <div className={styles.block} style={{ background: COLORS.hex[ck] }} />
          <span>{labels[idx]}</span>
        </div>
      ))}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const CalendarPage = () => {
  const { dailyCategoryAP } = useAuraStore();
  const [view, setView] = useState('OVERALL');

  // Build daily AP map: { "YYYY-MM-DD": totalAP }
  const dailyScores = React.useMemo(() => {
    const map = {};
    Object.entries(dailyCategoryAP || {}).forEach(([date, cats]) => {
      map[date] = Object.values(cats)
        .filter(v => typeof v === 'number')
        .reduce((sum, v) => sum + v, 0);
    });
    return map;
  }, [dailyCategoryAP]);

  const today = new Date();

  // YEAR view: one dot per month, score = sum of all days in that month
  const getYearData = () => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), i, 1);
    const prefix = `${today.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
    const total = Object.entries(dailyScores)
      .filter(([date]) => date.startsWith(prefix))
      .reduce((sum, [, s]) => sum + s, 0);
    const monthStr = d.toLocaleString('default', { month: 'short' });
    return { label: monthStr, score: total, displayDate: `${monthStr} ${today.getFullYear()}` };
  });

  // MONTH view: one dot per week (W1–W4), score = sum of 7 days
  const getMonthData = () => Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(today.getFullYear(), today.getMonth(), i * 7 + 1);
    const total = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + j);
      return dailyScores[d.toISOString().split('T')[0]] || 0;
    }).reduce((a, b) => a + b, 0);
    return { label: `W${i + 1}`, score: total, displayDate: fmtWeekly(weekStart) };
  });

  // WEEK view: one dot per day in the last 7 days
  const getWeekData = () => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      score: dailyScores[dateStr] || 0,
      displayDate: fmtDaily(dateStr),
    };
  });

  // OVERALL view: calendar grid for the current month
  const getGridData = () => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDay = start.getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const blanks = Array.from({ length: startDay }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
      const ds = d.toISOString().split('T')[0];
      return { day: i + 1, date: ds, displayDate: fmtDaily(ds), score: dailyScores[ds] || 0 };
    });
    return [...blanks, ...days];
  };

  // Which threshold set and legend to use for the current view
  const thresholdKey = view === 'YEAR' ? 'YEARLY' : view === 'MONTH' ? 'MONTHLY' : 'DAILY';
  const thresholds = THRESHOLDS[thresholdKey];

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>TEMPORAL ARCHIVE</h1>
          <div className={styles.viewToggle}>
            <button className={view === 'YEAR'    ? styles.active : ''} onClick={() => setView('YEAR')}>YEAR</button>
            <button className={view === 'MONTH'   ? styles.active : ''} onClick={() => setView('MONTH')}>MONTH</button>
            <button className={view === 'WEEK'    ? styles.active : ''} onClick={() => setView('WEEK')}>WEEK</button>
            <button className={view === 'OVERALL' ? styles.active : ''} onClick={() => setView('OVERALL')}>OVERALL</button>
          </div>
        </div>
        <p className={styles.subtitle}>Audit performance vectors across multiple temporal horizons.</p>
      </header>

      <div className={styles.content}>
        {view === 'YEAR' && (
          <div className={styles.dotFlex}>
            {getYearData().map(d => (
              <TemporalDot key={d.label} label={d.label} score={d.score} displayDate={d.displayDate} thresholds={thresholds} />
            ))}
          </div>
        )}
        {view === 'MONTH' && (
          <div className={styles.dotFlex}>
            {getMonthData().map(d => (
              <TemporalDot key={d.label} label={d.label} score={d.score} displayDate={d.displayDate} thresholds={thresholds} />
            ))}
          </div>
        )}
        {view === 'WEEK' && (
          <div className={styles.dotFlex}>
            {getWeekData().map(d => (
              <TemporalDot key={d.label} label={d.label} score={d.score} displayDate={d.displayDate} thresholds={thresholds} />
            ))}
          </div>
        )}
        {view === 'OVERALL' && (
          <div className={styles.traditionalGrid}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(h => (
              <div key={h} className={styles.gridHeader}>{h}</div>
            ))}
            {getGridData().map((d, i) => d ? (
              <div
                key={d.date}
                className={styles.gridDay}
                style={{ '--day-color': d.score > 0 ? getPale(d.score, thresholds) : 'rgba(255,255,255,0.05)' }}
              >
                <span className={styles.dayNum}>{d.day}</span>
                <div className={styles.tooltip}>
                  <span className={styles.ttDate}>{d.displayDate}</span>
                  <span className={styles.ttScore}>{Math.floor(d.score)} AP</span>
                  <span className={styles.ttRank} style={{ color: getHex(d.score, thresholds) }}>{getTierLabel(d.score, thresholds)}</span>
                </div>
              </div>
            ) : <div key={`blank-${i}`} className={styles.gridBlank} />)}
          </div>
        )}
      </div>

      <Legend thresholdKey={thresholdKey} />
    </PageWrapper>
  );
};

export default CalendarPage;
