import React, { useMemo } from 'react';
import AuraPointsDisplay from '../../components/gamification/AuraPointsDisplay/AuraPointsDisplay';
import StreakCounter from '../../components/gamification/StreakCounter/StreakCounter';
import MultiplierBadge from '../../components/gamification/MultiplierBadge/MultiplierBadge';
import XPBar from '../../components/gamification/XPBar/XPBar';
import RadarChart from '../../components/charts/RadarChart/RadarChart';
import CalendarHeatmap from '../../components/charts/CalendarHeatmap/CalendarHeatmap';
import WeeklyBarChart from './WeeklyBarChart';
import { useUserStore } from '../../store/userStore';
import { getGreeting } from '../../utils/greetingEngine';
import styles from './Dashboard.module.css';

const DashboardPage = () => {
  const { profile, user } = useUserStore();

  const playerName = profile?.name || profile?.username || 'Grinder';

  // New user = no lastLoginDate set yet or first day
  const isNewUser = !user?.id || user?.id === 'mock-uuid';

  const greeting = useMemo(
    () => getGreeting(playerName, isNewUser),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerName, isNewUser]
  );

  return (
    <div className={styles.dashboard}>
      <header className={styles.topHeader}>
        <div className={styles.greetingBlock}>
          <h1>DASHBOARD</h1>
          <p className={styles.subtitle}>{greeting}</p>
        </div>
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

      <div style={{ height: '4rem' }} />
    </div>
  );
};

export default DashboardPage;
