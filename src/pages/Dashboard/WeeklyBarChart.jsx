import React, { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { useAuraStore } from '../../store/auraStore';
import { AURA_RULES } from '../../constants/auraPoints';
import styles from './Dashboard.module.css';

const MAX_DAILY = AURA_RULES.MAX_DAILY_EARN; // 2000

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const pct = Math.round((val / MAX_DAILY) * 100);
    return (
      <div className={styles.chartTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        <p className={styles.tooltipValue}>{val} AP</p>
        <p className={styles.tooltipLabel}>{pct}% of daily cap</p>
      </div>
    );
  }
  return null;
};

const WeeklyBarChart = () => {
  const { auraHistory, dailyCategoryAP } = useAuraStore();

  const apByDate = useMemo(() => {
    const map = {};

    // Primary source: dailyCategoryAP — most accurate, already cap-enforced per category.
    // Filter out boolean nutrition flags (NUTRITION_cal: true etc.) before summing.
    Object.entries(dailyCategoryAP || {}).forEach(([date, cats]) => {
      const dayTotal = Object.entries(cats)
        .filter(([, val]) => typeof val === 'number')
        .reduce((acc, [, val]) => acc + val, 0);
      if (dayTotal > 0) map[date] = Math.min(dayTotal, MAX_DAILY);
    });

    // Fallback: auraHistory for dates not covered by dailyCategoryAP.
    // Sum per-date and cap at 2000 to handle legacy entries safely.
    const histByDate = {};
    (auraHistory || []).forEach(entry => {
      if (!entry.date) return;
      histByDate[entry.date] = (histByDate[entry.date] || 0) + Math.max(0, entry.net || 0);
    });
    Object.entries(histByDate).forEach(([date, total]) => {
      if (map[date] === undefined) {
        map[date] = Math.min(total, MAX_DAILY);
      }
    });

    return map;
  }, [auraHistory, dailyCategoryAP]);

  const data = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayStr = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
    const rawScore = apByDate[dateStr] || 0;
    data.push({
      date: displayStr,
      score: Math.min(rawScore, MAX_DAILY) // hard cap — never display > 2000
    });
  }

  return (
    <div className={styles.weeklyChartCard}>
      <h3 className={styles.cardTitle}>WEEKLY TREND — MAX {MAX_DAILY} AP / DAY</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--text-secondary)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="var(--text-secondary)"
              domain={[0, MAX_DAILY]}
              ticks={[0, 500, 1000, 1500, 2000]}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <ReferenceLine
              y={MAX_DAILY}
              stroke="rgba(0,191,255,0.25)"
              strokeDasharray="4 4"
              label={{ value: 'MAX', fill: 'rgba(0,191,255,0.5)', fontSize: 10, position: 'right' }}
            />
            <Bar dataKey="score" fill="url(#colorUv)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line
              type="linear"
              dataKey="score"
              stroke="var(--color-green)"
              strokeWidth={3}
              dot={{ fill: 'var(--bg-surface)', stroke: 'var(--color-green)', strokeWidth: 2, r: 4 }}
            />
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--rank-alpha)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--rank-alpha)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyBarChart;
