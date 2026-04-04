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
      lastStreakDate: null,
      lastSyncedAt: null,

      // Per-category daily AP tracking to enforce caps
      dailyCategoryAP: {},  // { "YYYY-MM-DD": { WORKOUT: n, STUDY: n, NUTRITION: n, SLEEP: n, MOOD: n, MISC: n } }

      // Get how much AP has been earned in a category today
      getCategoryEarned: (category) => {
        const today = getTodayStr();
        const dayData = get().dailyCategoryAP[today] || {};
        return dayData[category] || 0;
      },

      // Add AP with per-category daily cap enforcement
      addCategoryAP: (category, amount, reason) => set((state) => {
        if (!amount || isNaN(amount) || amount <= 0) return {};
        const today = getTodayStr();
        const dayData = state.dailyCategoryAP[today] || {};
        const alreadyEarned = dayData[category] || 0;

        // Determine the cap for this category
        const caps = AURA_RULES.DAILY_CATEGORY_CAP;
        let cap;
        if (category === 'MISC') {
          cap = AURA_RULES.GOALS_POOL;
        } else {
          cap = caps[category] || 100;
        }

        const remainingInCategory = Math.max(0, cap - alreadyEarned);
        const remainingDaily = AURA_RULES.MAX_DAILY_EARN - state.todayEarned;
        const actual = Math.min(amount, remainingInCategory, remainingDaily);
        if (actual <= 0) return {};

        const newDayData = { ...dayData, [category]: alreadyEarned + actual };

        return {
          totalAuraPoints: Math.max(0, state.totalAuraPoints + actual),
          todayEarned: state.todayEarned + actual,
          todayNet: (state.todayEarned + actual) - state.todayLost,
          dailyCategoryAP: { ...state.dailyCategoryAP, [today]: newDayData },
          auraHistory: [...state.auraHistory, { date: today, net: actual, reason: reason || 'Bonus' }]
        };
      }),

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

      // Called once per day when user logs any activity — checks if streak should increment
      checkAndUpdateStreak: () => {
        const { lastStreakDate, streakDays, maxStreak } = get();
        const today = getTodayStr();

        if (lastStreakDate === today) return; // already counted today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak;
        if (lastStreakDate === yesterdayStr) {
          // Consecutive day — increment
          newStreak = streakDays + 1;
        } else if (!lastStreakDate) {
          // First time — start at 1
          newStreak = 1;
        } else {
          // Gap — streak broken, restart at 1
          newStreak = 1;
        }

        const newMax = newStreak > maxStreak ? newStreak : maxStreak;
        const newMult = Math.min(resolveMultiplier(newStreak), MULTIPLIERS.MAX_MULT);

        set({
          streakDays: newStreak,
          maxStreak: newMax,
          multiplier: newMult,
          lastStreakDate: today,
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

      // Legacy addAuraPoints — still used for misc/non-categorized AP
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

      // Reset daily counters when a new day starts
      resetDailyIfNeeded: () => {
        const { lastLoginDate } = get();
        const today = getTodayStr();
        if (lastLoginDate !== today) {
          set({
            todayEarned: 0,
            todayLost: 0,
            todayNet: 0,
            lastLoginDate: today,
          });
        }
      },

      setLastLoginDate: (dateStr) => set({ lastLoginDate: dateStr }),

      hydrateFromServer: (serverData) => set(serverData),
    }),
    { name: 'antigravity-aura-store' }
  )
);
