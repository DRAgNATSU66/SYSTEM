import React, { useState, useMemo } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import { rgbVar } from '../../theme/palette';
import styles from './Calendar.module.css';

const THRESHOLDS = {
  DAILY:   [500,  1000, 1500],
  MONTHLY: [3500, 7000, 10500],
  YEARLY:  [105000, 210000, 315000],
};
const COLORS = {
  hex:  { red: 'var(--color-red)', yellow: 'var(--color-yellow)', green: 'var(--color-green)', blue: 'var(--color-blue)' },
  pale: { red: rgbVar('--tier-red-rgb', 0.55), yellow: rgbVar('--tier-yellow-rgb', 0.55), green: rgbVar('--tier-green-rgb', 0.55), blue: rgbVar('--tier-blue-rgb', 0.55) },
};
const LEGEND_LABELS = {
  DAILY:   ['< 500 AP', '500–999', '1,000–1,499', '1,500+'],
  MONTHLY: ['< 3,500 AP', '3,501–7,000', '7,001–10,500', '10,500+'],
  YEARLY:  ['< 1,05,000', '1,05,001–2,10,000', '2,10,001–3,15,000', '3,15,001+'],
};
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function getTierKey(score, thresholds) {
  if (score <= 0) return null;
  if (score < thresholds[0]) return 'red';
  if (score < thresholds[1]) return 'yellow';
  if (score < thresholds[2]) return 'green';
  return 'blue';
}
function getHex(score, thresholds) {
  const key = getTierKey(score, thresholds);
  return key ? COLORS.hex[key] : rgbVar('--fg-rgb', 0.05);
}
function getPale(score, thresholds) {
  const key = getTierKey(score, thresholds);
  return key ? COLORS.pale[key] : rgbVar('--fg-rgb', 0.05);
}
function getTierLabel(score, thresholds) {
  const key = getTierKey(score, thresholds);
  if (!key) return 'NONE';
  return { red: 'LOW', yellow: 'OKAY', green: 'GOOD', blue: 'PEAK' }[key];
}
function fmtDaily(isoStr) {
  if (!isoStr || !isoStr.includes('-')) return String(isoStr);
  const [y, m, d] = isoStr.split('-');
  return `${d}-${m}-${y}`;
}
function fmtWeekly(dateObj) {
  const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${day}-${dd}-${mm}-${dateObj.getFullYear()}`;
}

const TemporalDot = ({ label, score, displayDate, thresholds }) => {
  const hexColor = getHex(score, thresholds);
  return (
    <div className={styles.dotWrapper}>
      <div className={styles.dot} style={{ backgroundColor: hexColor }} />
      <div className={styles.dotLabel}>{label}</div>
      <div className={styles.tooltip}>
        <span className={styles.ttDate}>{displayDate}</span>
        <span className={styles.ttScore}>{Math.floor(score)} AP</span>
        <span className={styles.ttRank} style={{ color: hexColor }}>{getTierLabel(score, thresholds)}</span>
      </div>
    </div>
  );
};

const Legend = ({ thresholdKey }) => {
  const labels = LEGEND_LABELS[thresholdKey];
  return (
    <div className={styles.legend}>
      <div className={styles.legendItem}><div className={styles.block} style={{ background: rgbVar('--fg-rgb', 0.05) }} /><span>None</span></div>
      {['red','yellow','green','blue'].map((ck, idx) => (
        <div key={ck} className={styles.legendItem}>
          <div className={styles.block} style={{ background: COLORS.hex[ck] }} />
          <span>{labels[idx]}</span>
        </div>
      ))}
    </div>
  );
};

const CalendarPage = () => {
  const { dailyCategoryAP } = useAuraStore();
  const [view, setView] = useState('OVERALL');
  const today = new Date();

  // Month navigation state — defaults to current month
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const dailyScores = useMemo(() => {
    const map = {};
    Object.entries(dailyCategoryAP || {}).forEach(([date, cats]) => {
      map[date] = Object.values(cats).filter(v => typeof v === 'number').reduce((s, v) => s + v, 0);
    });
    return map;
  }, [dailyCategoryAP]);

  // ── Navigation helpers ──
  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const prevMonthLabel = viewMonth === 0 ? MONTH_SHORT[11] : MONTH_SHORT[viewMonth - 1];
  const nextMonthLabel = viewMonth === 11 ? MONTH_SHORT[0]  : MONTH_SHORT[viewMonth + 1];

  // ── Monthly stats ──
  const monthStats = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const monthEntries = Object.entries(dailyScores).filter(([d]) => d.startsWith(prefix));
    const totalAP = monthEntries.reduce((s, [, v]) => s + v, 0);
    const activeDays = monthEntries.filter(([, v]) => v > 0).length;
    const bestDay = monthEntries.reduce((max, [, v]) => Math.max(max, v), 0);
    const avgDay = activeDays > 0 ? Math.round(totalAP / activeDays) : 0;
    return { totalAP, activeDays, bestDay, avgDay };
  }, [dailyScores, viewYear, viewMonth]);

  // ── Dot views ──
  const getYearData = () => Array.from({ length: 12 }, (_, i) => {
    const prefix = `${today.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
    const total = Object.entries(dailyScores).filter(([d]) => d.startsWith(prefix)).reduce((s, [, v]) => s + v, 0);
    const d = new Date(today.getFullYear(), i, 1);
    return { label: MONTH_SHORT[i], score: total, displayDate: `${MONTH_NAMES[i]} ${today.getFullYear()}` };
  });
  const getMonthData = () => Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(today.getFullYear(), today.getMonth(), i * 7 + 1);
    const total = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(weekStart); d.setDate(d.getDate() + j);
      return dailyScores[d.toISOString().split('T')[0]] || 0;
    }).reduce((a, b) => a + b, 0);
    return { label: `W${i + 1}`, score: total, displayDate: fmtWeekly(weekStart) };
  });
  const getWeekData = () => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), score: dailyScores[dateStr] || 0, displayDate: fmtDaily(dateStr) };
  });

  // ── Month grid (uses viewYear/viewMonth) ──
  const getGridData = () => {
    const start = new Date(viewYear, viewMonth, 1);
    const startDay = start.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const blanks = Array.from({ length: startDay }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(viewYear, viewMonth, i + 1);
      const ds = d.toISOString().split('T')[0];
      const isToday = ds === today.toISOString().split('T')[0];
      return { day: i + 1, date: ds, displayDate: fmtDaily(ds), score: dailyScores[ds] || 0, isToday };
    });
    return [...blanks, ...days];
  };

  const thresholdKey = view === 'YEAR' ? 'YEARLY' : view === 'MONTH' ? 'MONTHLY' : 'DAILY';
  const thresholds = THRESHOLDS[thresholdKey];

  const formatAP = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>CALENDAR</h1>
          {view === 'OVERALL' ? (
            <div className={styles.monthNav}>
              <button className={styles.monthNavBtn} onClick={goToPrevMonth}>‹ {prevMonthLabel}</button>
              <div className={styles.monthNavCurrent}>{MONTH_NAMES[viewMonth].toUpperCase()} {viewYear}</div>
              <button className={styles.monthNavBtn} onClick={goToNextMonth}>{nextMonthLabel} ›</button>
            </div>
          ) : (
            <div className={styles.viewToggle}>
              {['YEAR','MONTH','WEEK','OVERALL'].map(v => (
                <button key={v} className={view === v ? styles.active : ''} onClick={() => setView(v)}>{v}</button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.viewToggleRow}>
          {['YEAR','MONTH','WEEK','OVERALL'].map(v => (
            <button key={v} className={`${styles.miniTab} ${view === v ? styles.miniTabActive : ''}`} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
        <p className={styles.subtitle}>Audit performance vectors across multiple temporal horizons.</p>
      </div>

      <div className={styles.content}>
        {view === 'YEAR' && (
          <div className={styles.dotFlex}>
            {getYearData().map(d => <TemporalDot key={d.label} {...d} thresholds={thresholds} />)}
          </div>
        )}
        {view === 'MONTH' && (
          <div className={styles.dotFlex}>
            {getMonthData().map(d => <TemporalDot key={d.label} {...d} thresholds={thresholds} />)}
          </div>
        )}
        {view === 'WEEK' && (
          <div className={styles.dotFlex}>
            {getWeekData().map(d => <TemporalDot key={d.label} {...d} thresholds={thresholds} />)}
          </div>
        )}
        {view === 'OVERALL' && (
          <>
            <div className={styles.traditionalGrid}>
              {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(h => (
                <div key={h} className={styles.gridHeader}>{h}</div>
              ))}
              {getGridData().map((d, i) => d ? (
                <div
                  key={d.date}
                  className={`${styles.gridDay} ${d.isToday ? styles.gridDayToday : ''}`}
                  style={{ '--day-color': d.isToday ? 'var(--rank-alpha)' : d.score > 0 ? getPale(d.score, thresholds) : rgbVar('--fg-rgb', 0.05) }}
                >
                  <span className={styles.dayNum}>{d.day}</span>
                  {d.score > 0 && <span className={styles.dayScore}>+{formatAP(d.score)}</span>}
                  <div className={styles.tooltip}>
                    <span className={styles.ttDate}>{d.displayDate}</span>
                    <span className={styles.ttScore}>{Math.floor(d.score)} AP</span>
                    <span className={styles.ttRank} style={{ color: d.isToday ? 'var(--rank-alpha)' : getHex(d.score, thresholds) }}>
                      {d.isToday ? 'TODAY' : getTierLabel(d.score, thresholds)}
                    </span>
                  </div>
                </div>
              ) : <div key={`blank-${i}`} className={styles.gridBlank} />)}
            </div>

            {/* ── Monthly Stats Row ── */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>TOTAL AP</span>
                <span className={styles.statValue}>{monthStats.totalAP >= 1000 ? `${(monthStats.totalAP / 1000).toFixed(1)}k` : monthStats.totalAP}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>AVG / DAY</span>
                <span className={styles.statValue}>{monthStats.avgDay}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>BEST DAY</span>
                <span className={styles.statValue}>+{formatAP(monthStats.bestDay)}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>DAYS ACTIVE</span>
                <span className={styles.statValue}>{monthStats.activeDays} <span className={styles.statSub}>/ {new Date(viewYear, viewMonth + 1, 0).getDate()}</span></span>
              </div>
            </div>
          </>
        )}
      </div>

      <Legend thresholdKey={thresholdKey} />
    </PageWrapper>
  );
};

export default CalendarPage;
