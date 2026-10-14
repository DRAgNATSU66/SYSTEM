import { buildDemoState } from '../utils/demoSeed';
import { useAuraStore } from '../store/auraStore';
import { useScoreStore } from '../store/scoreStore';
import { useMetricsStore } from '../store/metricsStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { markDemoSeeded } from '../utils/demoResidue';

export const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'demo@system.local',
  user_metadata: { name: 'Demo Player' },
};

const isEmpty = (v) => !v || (Array.isArray(v) ? v.length === 0 : Object.keys(v).length === 0);

// Data stores are seeded only when empty (so demo-session edits survive reloads); the demo profile name is re-applied on every boot.
export function applyDemoState(now = new Date()) {
  try { markDemoSeeded(localStorage); } catch { /* storage unavailable: never break boot */ }
  const s = buildDemoState(now);
  if (isEmpty(useAuraStore.getState().auraHistory)) useAuraStore.setState(s.aura);
  if (isEmpty(useScoreStore.getState().dailyScores)) useScoreStore.setState(s.score);
  if (isEmpty(useMetricsStore.getState().dailyMetrics)) useMetricsStore.setState({ dailyMetrics: s.dailyMetrics });
  if (isEmpty(useWorkoutStore.getState().logs)) useWorkoutStore.setState({ logs: s.workoutLogs });
  useUserStore.setState((st) => ({ profile: { ...st.profile, ...s.profile } }));
}
