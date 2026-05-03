import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { useAuraStore } from '../../store/auraStore';
import styles from './APTrend.module.css';

const RANGES = [
  { label: '7D',  days: 7  },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: 'ALL', days: 90 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className={styles.tooltip}>
        <p className={styles.ttLabel}>{label}</p>
        <p className={styles.ttValue}>{val > 0 ? '+' : ''}{val.toLocaleString()} AP</p>
      </div>
    );
  }
  return null;
};

const APTrendChart = () => {
  const { auraHistory, dailyCategoryAP } = useAuraStore();
  const [range, setRange] = useState(14);

  const apByDate = useMemo(() => {
    const map = {};
    Object.entries(dailyCategoryAP || {}).forEach(([date, cats]) => {
      const dayTotal = Object.entries(cats)
        .filter(([, val]) => typeof val === 'number')
        .reduce((acc, [, val]) => acc + val, 0);
      if (dayTotal > 0) map[date] = dayTotal;
    });
    (auraHistory || []).forEach(entry => {
      if (!entry.date) return;
      const v = entry.earned != null ? entry.earned : Math.max(0, entry.net || 0);
      if (!map[entry.date]) map[entry.date] = v;
    });
    return map;
  }, [auraHistory, dailyCategoryAP]);

  const data = useMemo(() => {
    const pts = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
      pts.push({ date: label, score: apByDate[dateStr] || 0 });
    }
    return pts;
  }, [apByDate, range]);

  // Stats
  const total = data.reduce((s, d) => s + d.score, 0);
  const prevData = useMemo(() => {
    const pts = [];
    const now = new Date();
    for (let i = range * 2 - 1; i >= range; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      pts.push(apByDate[dateStr] || 0);
    }
    return pts;
  }, [apByDate, range]);
  const prevTotal = prevData.reduce((s, v) => s + v, 0);
  const changePct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;
  const isUp = changePct >= 0;

  const tickCount = range <= 7 ? range : range <= 14 ? 7 : 10;
  const step = Math.max(1, Math.floor(data.length / tickCount));
  const ticks = data.filter((_, i) => i % step === 0).map(d => d.date);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.metaLabel}>AP TREND · LAST {range} DAYS</span>
          <div className={styles.stats}>
            <span className={styles.totalAP}>{total >= 1000 ? `+${(total / 1000).toFixed(1)}k` : `+${total}`}</span>
            <span className={`${styles.pct} ${isUp ? styles.up : styles.down}`}>
              {isUp ? '▲' : '▼'} {Math.abs(changePct)}%
            </span>
          </div>
        </div>
        <div className={styles.segBar}>
          {RANGES.map(r => (
            <button
              key={r.label}
              className={`${styles.seg} ${range === r.days ? styles.segActive : ''}`}
              onClick={() => setRange(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00CFFF" stopOpacity="0.30" />
                <stop offset="60%"  stopColor="#00CFFF" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#00CFFF" stopOpacity="0.00" />
              </linearGradient>
              <filter id="lineGlow" x="-20%" y="-100%" width="140%" height="300%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tick={{ fill: 'rgba(255,255,255,0.40)', fontSize: 11, fontFamily: 'Outfit' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 11, fontFamily: 'Outfit' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,207,255,0.2)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#00CFFF"
              strokeWidth={2}
              fill="url(#trendFill)"
              dot={false}
              activeDot={{ r: 5, fill: '#00CFFF', stroke: 'rgba(0,207,255,0.5)', strokeWidth: 6 }}
              filter="url(#lineGlow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default APTrendChart;
