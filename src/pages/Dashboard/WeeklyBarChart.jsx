import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useScoreStore } from '../../store/scoreStore';
import styles from './Dashboard.module.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.chartTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        <p className={styles.tooltipValue}>Score: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const WeeklyBarChart = () => {
  const { dailyScores } = useScoreStore();
  
  // Create last 7 days mock from dict if needed, or real
  const data = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayStr = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
    data.push({
      date: displayStr,
      score: dailyScores[dateStr] || 0
    });
  }

  return (
    <div className={styles.weeklyChartCard}>
      <h3 className={styles.cardTitle}>WEEKLY TREND</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--text-secondary)" domain={[0, 1000]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="score" fill="url(#colorUv)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line type="linear" dataKey="score" stroke="var(--rank-sigma)" strokeWidth={3} dot={{ fill: 'var(--bg-surface)', stroke: 'var(--rank-sigma)', strokeWidth: 2, r: 4 }} />
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--rank-alpha)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--rank-alpha)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default WeeklyBarChart;
