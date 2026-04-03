import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeAuraPointsLegacy } from '../utils/auraCalculator';
import { resolveMultiplier } from '../utils/multiplierResolver';
import { computePenalties } from '../utils/penaltyEngine';
import { getTodayStr } from '../utils/dateUtils';
import { AURA_RULES } from '../constants/auraPoints';
import { MULTIPLIERS } from '../constants/multipliers';

export const useAuraStore = create(
  persist(
    (set, get) => ({
      totalAuraPoints: 0,
      todayEarned: 0,
      todayLost: 0,
      todayNet: 0,
      multiplier: 1.0,
      streakDays: 0,
      maxStreak: 0,
      penaltyLog: [],
      auraHistory: [],
      lastLoginDate: getTodayStr(),
      lastSyncedAt: null,

      computeTodayAura: (dailyScore, hasAllPermanent, peakMood, overperformedCount) => {
        const { multiplier, totalAuraPoints, todayLost, todayEarned, auraHistory } = get();

        const baseEarned    = computeAuraPointsLegacy(dailyScore, hasAllPermanent, peakMood, overperformedCount);
        const withMult      = Math.floor(baseEarned * multiplier);

        // PRD §6: cap daily earned at 2000
        const cappedEarned  = Math.min(withMult, AURA_RULES.MAX_DAILY_EARN - todayEarned);
        if (cappedEarned <= 0) return; // already at daily earn cap

        const newTotal = Math.max(0, totalAuraPoints + cappedEarned);
        const today    = getTodayStr();

        let newHistory = [...auraHistory];
        const todayIdx = newHistory.findIndex(h => h.date === today);
        const net      = (todayEarned + cappedEarned) - todayLost;
        if (todayIdx >= 0) {
          newHistory[todayIdx] = { date: today, net, multiplier };
        } else {
          newHistory.push({ date: today, net, multiplier });
        }

        set({
          todayEarned:      todayEarned + cappedEarned,
          todayNet:         net,
          totalAuraPoints:  newTotal,
          auraHistory:      newHistory,
        });
      },

      applyPenalties: (gapDays, ignoredTasks) => {
        if (gapDays <= 0) return;
        const penalty = computePenalties(gapDays, ignoredTasks);
        if (penalty === 0) return;

        set((state) => {
          const lostAbs     = Math.abs(penalty);
          // PRD §6: cap daily lost at 2000
          const cappedLost  = Math.min(lostAbs, AURA_RULES.MAX_DAILY_LOSE - state.todayLost);
          const newTotal    = Math.max(0, state.totalAuraPoints - cappedLost);
          const newLog      = [...state.penaltyLog, { date: getTodayStr(), reason: 'Inactivity/Ignore', amount: -cappedLost }];

          return {
            totalAuraPoints: newTotal,
            todayLost:       state.todayLost + cappedLost,
            todayNet:        state.todayEarned - (state.todayLost + cappedLost),
            penaltyLog:      newLog,
            streakDays:      gapDays >= 7 ? 0 : state.streakDays,
            multiplier:      gapDays >= 7 ? 1.0 : state.multiplier,
          };
        });
      },

      incrementStreak: () => set((state) => {
        const newStreak = state.streakDays + 1;
        const newMax    = newStreak > state.maxStreak ? newStreak : state.maxStreak;
        const newMult   = Math.min(resolveMultiplier(newStreak), MULTIPLIERS.MAX_MULT);
        return { streakDays: newStreak, multiplier: newMult, maxStreak: newMax };
      }),

      // PRD §6: When streak breaks, apply +0.5x compensation multiplier (min 1.0)
      breakStreak: () => set((state) => {
        const compensation = Math.min(
          state.multiplier + MULTIPLIERS.STREAK_BREAK_COMPENSATION,
          MULTIPLIERS.MAX_MULT
        );
        return { streakDays: 0, multiplier: Math.max(1.0, compensation) };
      }),

      // Add AP earned from a duel win (+0.5x mult boost)
      applyDuelWinBonus: () => set((state) => ({
        multiplier: Math.min(
          Math.round((state.multiplier + MULTIPLIERS.DUEL_WIN_BONUS) * 10) / 10,
          MULTIPLIERS.MAX_MULT
        )
      })),

      addAuraPoints: (amount, reason) => set((state) => {
        // Cap daily earn
        const remaining = AURA_RULES.MAX_DAILY_EARN - state.todayEarned;
        const actual    = Math.min(amount, remaining);
        if (actual <= 0) return {};
        return {
          totalAuraPoints: Math.max(0, state.totalAuraPoints + actual),
          todayEarned:     state.todayEarned + actual,
          todayNet:        (state.todayEarned + actual) - state.todayLost,
          auraHistory: [...state.auraHistory, { date: getTodayStr(), net: actual, reason: reason || 'Bonus' }]
        };
      }),

      redeemPoints: (amount, rewardName) => {
        const { totalAuraPoints, auraHistory } = get();
        if (totalAuraPoints >= amount) {
          const today = getTodayStr();
          set({
            totalAuraPoints: totalAuraPoints - amount,
            auraHistory: [...auraHistory, { date: today, net: -amount, reason: `Redeemed: ${rewardName}` }]
          });
          return true;
        }
        return false;
      },

      setLastLoginDate: (dateStr) => set({ lastLoginDate: dateStr }),

      hydrateFromServer: (serverData) => set(serverData),
    }),
    { name: 'antigravity-aura-store' }
  )
);
