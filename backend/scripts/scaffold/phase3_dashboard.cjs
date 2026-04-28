const fs = require('fs');
const path = require('path');

const files = {
  // DashboardPage
  'src/pages/Dashboard/DashboardPage.jsx': `import React from 'react';
import AuraPointsDisplay from '../../components/gamification/AuraPointsDisplay/AuraPointsDisplay';
import StreakCounter from '../../components/gamification/StreakCounter/StreakCounter';
import MultiplierBadge from '../../components/gamification/MultiplierBadge/MultiplierBadge';
import XPBar from '../../components/gamification/XPBar/XPBar';
import RadarChart from '../../components/charts/RadarChart/RadarChart';
import CalendarHeatmap from '../../components/charts/CalendarHeatmap/CalendarHeatmap';
import WeeklyBarChart from './WeeklyBarChart';
import styles from './Dashboard.module.css';

const DashboardPage = () => {
  return (
    <div className={styles.dashboard}>
      <header className={styles.topHeader}>
        <h1>O S . C O M M A N D</h1>
        <p className={styles.subtitle}>Welcome back, Grinder.</p>
      </header>

      {/* Top Stats Row */}
      <section className={styles.statsRow}>
        <AuraPointsDisplay />
        <StreakCounter />
        <MultiplierBadge />
        <XPBar />
      </section>

      {/* Metrics Row: Radar (left), Heatmap (right) */}
      <section className={styles.metricsRow}>
        <div className={styles.radarSlot}>
          <RadarChart />
        </div>
        <div className={styles.heatmapSlot}>
          <CalendarHeatmap />
        </div>
      </section>

      {/* Weekly Trend Row */}
      <section className={styles.trendRow}>
        <WeeklyBarChart />
      </section>
      
      {/* Spacer for bottom */}
      <div style={{ height: '4rem' }} />
    </div>
  );
};
export default DashboardPage;\n`,

  'src/pages/Dashboard/Dashboard.module.css': `.dashboard {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.topHeader {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.topHeader h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #fff;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* Row 1: 4 equal cards */
.statsRow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

/* Row 2: Radar + Heatmap */
.metricsRow {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .metricsRow {
    grid-template-columns: 1fr;
  }
}

.radarSlot, .heatmapSlot {
  display: flex;
  flex-direction: column;
}

/* Row 3: Full Width Line Chart */
.trendRow {
  height: 350px;
}

.weeklyChartCard {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cardTitle {
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

/* Tooltips */
.chartTooltip {
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
}\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
