import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useUserStore } from '../../store/userStore';
import { useAuraStore } from '../../store/auraStore';
import { useTaskStore } from '../../store/taskStore';
import { useScoreStore } from '../../store/scoreStore';
import { pullAllData, seedServerFromLocal } from '../../services/syncEngine';
import { userService } from '../../services/userService';

export function AuthProvider({ children }) {
  const setUser = useUserStore(state => state.setUser);
  const clearUser = useUserStore(state => state.clearUser);
  const ensureCypherId = useUserStore(state => state.ensureCypherId);

  // Ensure cypher ID is generated for all users (even local-only)
  useEffect(() => { ensureCypherId(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!supabase) return; // Supabase not configured — skip auth setup
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        handleUserLogin(session.user);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        handleUserLogin(session.user);
      }

      if (event === 'SIGNED_UP' && session?.user) {
        const username = session.user.email?.split('@')[0] || 'Grinder';
        try {
          await userService.upsertProfileOnSignUp(session.user.id, username);
        } catch (e) {
          console.warn('[AuthProvider] Profile upsert failed:', e);
        }
        setUser(session.user);
        // Seed server from any existing localStorage data
        await seedServerFromLocal(session.user.id);
      }

      if (event === 'SIGNED_OUT') {
        clearUser();
        clearAllStores();
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return children;
}

async function handleUserLogin(user) {
  if (!supabase) return;
  // Check if server has data for this user
  const { data } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .eq('id', user.id)
    .single();

  if (!data) {
    // First login — create profile then seed from localStorage
    const username = user.email?.split('@')[0] || 'Grinder';
    try {
      await userService.upsertProfileOnSignUp(user.id, username);
      await seedServerFromLocal(user.id);
    } catch (e) {
      console.warn('[AuthProvider] First login seed failed:', e);
    }
  } else {
    // Returning user — pull all data from server
    await pullAllData(user.id);
  }
}

function clearAllStores() {
  useAuraStore.setState({
    totalAuraPoints: 0, todayEarned: 0, todayLost: 0, todayNet: 0,
    multiplier: 1.0, streakDays: 0, maxStreak: 0, penaltyLog: [], auraHistory: [],
  });
  useTaskStore.setState({ tasks: [], completions: {} });
  useScoreStore.setState({ dailyScores: {}, todayScore: 0, weeklyScores: [] });
}
