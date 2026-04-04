import React, { useMemo, useEffect } from 'react';
import AuraPointsDisplay from '../../components/gamification/AuraPointsDisplay/AuraPointsDisplay';
import StreakCounter from '../../components/gamification/StreakCounter/StreakCounter';
import MultiplierBadge from '../../components/gamification/MultiplierBadge/MultiplierBadge';
import XPBar from '../../components/gamification/XPBar/XPBar';
import RadarChart from '../../components/charts/RadarChart/RadarChart';
import CalendarHeatmap from '../../components/charts/CalendarHeatmap/CalendarHeatmap';
import WeeklyBarChart from './WeeklyBarChart';
import { useUserStore } from '../../store/userStore';
import { useAuraStore } from '../../store/auraStore';
import { useTaskStore } from '../../store/taskStore';
import { getGreeting } from '../../utils/greetingEngine';
import { getTodayStr } from '../../utils/dateUtils';
import styles from './Dashboard.module.css';

const DashboardPage = () => {
  const { profile } = useUserStore();
  const resetDailyIfNeeded = useAuraStore(state => state.resetDailyIfNeeded);
  const auraHistory = useAuraStore(state => state.auraHistory);
  const totalAuraPoints = useAuraStore(state => state.totalAuraPoints);
  const streakDays = useAuraStore(state => state.streakDays);
  const { tasks, completions, toggleCompletion } = useTaskStore();
  const today = getTodayStr();

  // Reset daily counters on dashboard mount if new day
  useEffect(() => { resetDailyIfNeeded(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playerName = profile?.name || profile?.username || 'Grinder';

  // New user = has never earned any AP or logged any history
  const isNewUser = auraHistory.length === 0 && totalAuraPoints === 0 && streakDays === 0;

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

      {/* Daily Loop */}
      <section className={styles.dailyLoopRow}>
        <h2 className={styles.loopTitle}>DAILY LOOP</h2>
        {tasks.length === 0 ? (
          <p className={styles.loopEmpty}>No permanent tasks. Add tasks in Settings → Task Manager.</p>
        ) : (
          <div className={styles.taskList}>
            {tasks.map(task => {
              const done = !!(completions[task.id]?.[today]);
              return (
                <div key={task.id} className={`${styles.taskItem} ${done ? styles.taskDone : ''}`}>
                  <span className={styles.taskTitle}>{task.title || task.name || 'Unnamed Task'}</span>
                  <button
                    className={`${styles.btnToggle} ${done ? styles.btnDone : ''}`}
                    onClick={() => toggleCompletion(task.id, today, !done)}
                  >
                    {done ? 'DONE' : 'MARK DONE'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div style={{ height: '4rem' }} />
    </div>
  );
};

export default DashboardPage;
