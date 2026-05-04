import { useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useUserStore } from '../../store/userStore';
import { useAuraStore } from '../../store/auraStore';
import { useTaskStore } from '../../store/taskStore';
import { useScoreStore } from '../../store/scoreStore';
import { pullAllData } from '../../services/syncEngine';
import { userService } from '../../services/userService';
import { useGoalStore, useProjectStore, useHobbyStore } from '../../store/assetStores';
import { useMetricsStore } from '../../store/metricsStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { useStudyStore } from '../../store/studyStore';
import { useSocialStore } from '../../store/socialStore';
import { useCommandStore } from '../../store/commandStore';
import { useSyncQueue } from '../../services/syncEngine';

export function AuthProvider({ children }) {
  const setUser = useUserStore(state => state.setUser);
  const clearUser = useUserStore(state => state.clearUser);
  const ensureCypherId = useUserStore(state => state.ensureCypherId);
  const setAuthLoading = useUserStore(state => state.setAuthLoading);

  // Guard against duplicate auth processing (StrictMode double-mount + overlapping events)
  const processingRef = useRef(false);
  const lastProcessedUserId = useRef(null);

  // Ensure cypher ID is generated for all users (even local-only)
  useEffect(() => { ensureCypherId(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!supabase) return; // Supabase not configured — skip auth setup
    let cancelled = false;

    // Restore session on mount — setAuthLoading(false) always fires so
    // ProtectedRoute waits for this check before redirecting to /auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        setUser(session.user);
        handleUserLogin(session.user);
      }
      setAuthLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        handleUserLogin(session.user);
      }

      // SIGNED_UP: only set the user — AuthPage handles profile creation
      // and seeding via handlePlayerNameConfirm to avoid duplicate calls
      if (event === 'SIGNED_UP' && session?.user) {
        setUser(session.user);
      }

      if (event === 'SIGNED_OUT') {
        lastProcessedUserId.current = null;
        clearUser();
        clearAllStores();
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUserLogin(user) {
    if (!supabase) return;
    // Prevent duplicate processing (StrictMode, overlapping getSession + onAuthStateChange)
    if (processingRef.current && lastProcessedUserId.current === user.id) return;
    if (lastProcessedUserId.current === user.id) return; // already processed this user
    processingRef.current = true;
    lastProcessedUserId.current = user.id;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, updated_at')
        .eq('id', user.id)
        .single();

      if (!data) {
        // First login — create profile
        const username = user.email?.split('@')[0] || 'Grinder';
        try {
          await userService.upsertProfileOnSignUp(user.id, username);
        } catch (e) {
          console.warn('[AuthProvider] First login seed failed:', e);
        }
      } else {
        // Returning user — pull all data from server
        await pullAllData(user.id);
      }
    } finally {
      processingRef.current = false;
    }
  }

  return children;
}

function clearAllStores() {
  const today = new Date().toISOString().split('T')[0];
  const existingCategoryAP = useAuraStore.getState().dailyCategoryAP || {};

  // Preserve today's per-category AP tracking across same-day logout→login.
  // The daily counter resets naturally at midnight (new date key), so there
  // is no security risk in keeping today's entry across a same-device re-login.
  const preservedToday = existingCategoryAP[today]
    ? { [today]: existingCategoryAP[today] }
    : {};

  useAuraStore.setState({
    totalAuraPoints: 0, todayEarned: 0, todayLost: 0, todayNet: 0,
    multiplier: 1.0, streakDays: 0, maxStreak: 0,
    penaltyLog: [], auraHistory: [],
    dailyCategoryAP: preservedToday,
  });
  useTaskStore.setState({ tasks: [], completions: {} });
  useScoreStore.setState({ dailyScores: {}, todayScore: 0, weeklyScores: [] });
  useGoalStore.setState({ goals: [], goalsHistory: [] });
  useProjectStore.setState({ projects: [], projectsHistory: [], sessions: [] });
  useHobbyStore.setState({ hobbies: [], hobbiesHistory: [] });
  useMetricsStore.setState({ dailyMetrics: {} });
  useWorkoutStore.setState({ logs: {}, personalBests: {} });
  useStudyStore.setState({ sessions: {}, accumulatedIQ: 0, accumulatedKnowledge: 0 });
  useSocialStore.setState({ friends: [], duels: [], lastSyncedAt: null });
  useCommandStore.setState({
    history: [
      { id: 'boot-1', type: 'system', text: 'SYSTEM_BOOT . . . [V9.0.1 ALPHA]' },
      { id: 'boot-2', type: 'system', text: 'SCANNING_ENVIRONMENT . . . [SECURE_ENCLAVE]' },
      { id: 'boot-3', type: 'update', text: 'SYNCING_USER_BIOMETRICS . . . [SUCCESS]' },
    ],
    timerStart: null,
  });
  useSyncQueue.getState().clearQueue();
}
