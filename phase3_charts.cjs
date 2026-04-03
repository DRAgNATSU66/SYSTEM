const fs = require('fs');
const path = require('path');

const files = {
  // RadarChart
  'src/components/charts/RadarChart/RadarChart.jsx': `import React from 'react';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './RadarChart.module.css';

const mockData = [
  { subject: 'Muscle', A: 85, fullMark: 100 },
  { subject: 'IQ', A: 90, fullMark: 100 },
  { subject: 'Mobility', A: 70, fullMark: 100 },
  { subject: 'Mood', A: 85, fullMark: 100 },
  { subject: 'Intelligence', A: 95, fullMark: 100 },
  { subject: 'Discipline', A: 65, fullMark: 100 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{payload[0].payload.subject}</p>
        <p className={styles.tooltipValue}>{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const RadarChart = () => {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>STATS PENTAGRAM</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={mockData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontFamily: 'Outfit' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Radar name="You" dataKey="A" stroke="var(--rank-alpha)" fill="var(--rank-alpha)" fillOpacity={0.4} />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default RadarChart;\n`,

  'src/components/charts/RadarChart/RadarChart.module.css': `.container {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 400px;
}

.title {
  font-family: 'Outfit', sans-serif;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.chartWrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.tooltip {
  background: rgba(20, 20, 23, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
}
.tooltipLabel {
  font-family: 'Outfit', sans-serif;
  color: var(--text-secondary);
  font-size: 0.8rem;
}
.tooltipValue {
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
}\n`,

  // WeeklyBarChart
  'src/pages/Dashboard/WeeklyBarChart.jsx': `import React from 'react';
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
            <Line type="monotone" dataKey="score" stroke="var(--rank-sigma)" strokeWidth={3} dot={{ fill: 'var(--bg-surface)', stroke: 'var(--rank-sigma)', strokeWidth: 2, r: 4 }} />
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
export default WeeklyBarChart;\n`,

  // Calendar Heatmap
  'src/components/charts/CalendarHeatmap/CalendarHeatmap.jsx': `import React from 'react';
import { useScoreStore } from '../../../store/scoreStore';
import { resolveRank } from '../../../utils/rankResolver';
import styles from './CalendarHeatmap.module.css';

const CalendarHeatmap = () => {
  const { dailyScores } = useScoreStore();
  
  // Last 90 days grid
  const days = [];
  const now = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // figure out col/row for a mock github grid (by weeks)
    days.push({
      dateStr,
      score: dailyScores[dateStr] || 0
    });
  }

  // Group by week to map into rows/cols properly
  // Since we just want a visual block, we'll flex-wrap them or CSS Grid them specifically

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>90-DAY HEATMAP</h3>
      <div className={styles.scrollWrapper}>
        <div className={styles.grid}>
          {days.map((d, i) => {
            const rank = resolveRank(d.score);
            const isZero = d.score === 0;
            return (
              <div 
                key={i} 
                className={styles.cell} 
                style={{ backgroundColor: isZero ? 'rgba(255,255,255,0.05)' : rank.color }}
                title={\`\${d.dateStr}: \${d.score}\`}
              />
            )
          })}
        </div>
      </div>
      <div className={styles.legend}>
         <span style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>Less</span>
         <div className={styles.cell} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-beta)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-slacking)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-dreamer)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-sigma)' }} />
         <div className={styles.cell} style={{ backgroundColor: 'var(--rank-alpha)' }} />
         <span style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>More</span>
      </div>
    </div>
  );
};
export default CalendarHeatmap;\n`,

  'src/components/charts/CalendarHeatmap/CalendarHeatmap.module.css': `.container {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.title {
  font-family: 'Outfit', sans-serif;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.scrollWrapper {
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.grid {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: 98px; /* 7 cells * (12px + 2px gap) = ~98px */
  gap: 3px;
  align-content: flex-start;
}

.cell {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  transition: transform var(--transition-fast);
  cursor: crosshair;
}

.cell:hover {
  transform: scale(1.2);
  outline: 1px solid rgba(255,255,255,0.5);
  z-index: 2;
}

.legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
