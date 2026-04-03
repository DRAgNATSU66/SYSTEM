/**
 * useCloudSync — Bidirectional sync orchestrator
 * - Debounces Aura/Score pushes (300ms) to prevent spam on rapid task toggling
 * - Pushes profile state to Supabase on meaningful change
 * - Flushes offline queue on mount
 */
import { useEffect, useRef } from 'react';
import { useUserStore } from '../store/userStore';
import { useAuraStore } from '../store/auraStore';
import { useScoreStore } from '../store/scoreStore';
import { pushChange, flushQueue } from '../services/syncEngine';

export const useCloudSync = () => {
  const user = useUserStore(state => state.user);
  const totalAuraPoints = useAuraStore(state => state.totalAuraPoints);
  const streakDays = useAuraStore(state => state.streakDays);
  const maxStreak = useAuraStore(state => state.maxStreak);
  const multiplier = useAuraStore(state => state.multiplier);
  const todayEarned = useAuraStore(state => state.todayEarned);
  const todayLost = useAuraStore(state => state.todayLost);
  const todayScore = useScoreStore(state => state.todayScore);

  const auraDebounceRef = useRef(null);

  // Flush offline queue on mount
  useEffect(() => {
    if (user?.id) flushQueue();
  }, [user?.id]);

  // Debounced Aura + Score sync
  useEffect(() => {
    if (!user?.id) return;

    if (auraDebounceRef.current) clearTimeout(auraDebounceRef.current);

    auraDebounceRef.current = setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];

      // Push profile state
      pushChange('profiles', 'UPSERT', {
        id: user.id,
        total_aura_points: totalAuraPoints,
        current_streak: streakDays,
        max_streak: maxStreak,
        multiplier,
        last_login_date: today,
      });

      // Push today's aura log
      if (todayEarned > 0 || todayLost > 0) {
        pushChange('aura_logs', 'UPSERT', {
          user_id: user.id,
          date: today,
          earned: todayEarned,
          lost: todayLost,
          multiplier,
        });
      }

      // Push today's score
      if (todayScore > 0) {
        pushChange('daily_scores', 'UPSERT', {
          user_id: user.id,
          date: today,
          score: todayScore,
        });
      }
    }, 300);

    return () => {
      if (auraDebounceRef.current) clearTimeout(auraDebounceRef.current);
    };
  }, [user?.id, totalAuraPoints, streakDays, maxStreak, multiplier, todayEarned, todayLost, todayScore]);
};
