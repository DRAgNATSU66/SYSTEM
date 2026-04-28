import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeAuraPointsLegacy } from '../utils/auraCalculator';
import { resolveMultiplier, clampMultiplier } from '../utils/multiplierResolver';
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

      /**
       * Compute the effective daily earn cap.
       * Base cap: 2000 AP. Multiplier > 1.0 lifts the cap.
       * Only way to earn > 2000 AP/day is with an active multiplier.
       */
      getEffectiveDailyCap: () => {
        const { multiplier } = get();
        if (multiplier > 1.0) {
          return Math.floor(AURA_RULES.MAX_DAILY_EARN * multiplier);
        }
        return AURA_RULES.MAX_DAILY_EARN;
      },

      // Add AP with per-category daily cap enforcement
      addCategoryAP: (category, amount, reason) => set((state) => {
        if (!amount || isNaN(amount) || amount <= 0) return {};

        // Apply multiplier to the earned amount — scales AP up or down
        const effectiveAmount = state.multiplier === 0
          ? 0
          : Math.round(amount * state.multiplier);

        // Handle negative multiplier: activity causes AP loss
        if (effectiveAmount <= 0 && state.multiplier <= 0) {
          const loss = Math.abs(effectiveAmount);
          if (loss === 0) return {};
          return {
            totalAuraPoints: Math.max(0, state.totalAuraPoints - loss),
            todayLost: state.todayLost + loss,
            todayNet: state.todayEarned - (state.todayLost + loss),
            auraHistory: [...state.auraHistory, { date: getTodayStr(), net: -loss, reason: reason || 'Negative Multiplier Penalty' }]
          };
        }

        const today = getTodayStr();
        const dayData = state.dailyCategoryAP[today] || {};
        const alreadyEarned = dayData[category] || 0;

        // Determine the base cap for this category
        const caps = AURA_RULES.DAILY_CATEGORY_CAP;
        let baseCap;
        if (category === 'MISC') {
          baseCap = AURA_RULES.GOALS_POOL;
        } else {
          baseCap = caps[category] || 100;
        }

        // Scale per-category cap by multiplier so it lifts proportionally
        const scaledCap = state.multiplier > 1.0
          ? Math.floor(baseCap * state.multiplier)
          : baseCap;

        // Effective daily cap based on multiplier
        const effectiveDailyCap = state.multiplier > 1.0
          ? Math.floor(AURA_RULES.MAX_DAILY_EARN * state.multiplier)
          : AURA_RULES.MAX_DAILY_EARN;

        const remainingInCategory = Math.max(0, scaledCap - alreadyEarned);
        const remainingDaily = effectiveDailyCap - state.todayEarned;
        const actual = Math.min(effectiveAmount, remainingInCategory, remainingDaily);
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

        // Apply multiplier — can push above 2000 if multiplier > 1.0, can go negative if multiplier < 0
        const withMult      = Math.floor(baseEarned * multiplier);

        // Effective daily cap
        const effectiveDailyCap = multiplier > 1.0
          ? Math.floor(AURA_RULES.MAX_DAILY_EARN * multiplier)
          : AURA_RULES.MAX_DAILY_EARN;

        if (withMult <= 0) {
          // Negative multiplier means earning causes AP loss
          const loss = Math.abs(withMult);
          const cappedLoss = Math.min(loss, AURA_RULES.MAX_DAILY_LOSE - todayLost);
          if (cappedLoss <= 0) return;
          const today = getTodayStr();
          set({
            todayLost: todayLost + cappedLoss,
            todayNet: todayEarned - (todayLost + cappedLoss),
            totalAuraPoints: Math.max(0, totalAuraPoints - cappedLoss),
            auraHistory: [...auraHistory, { date: today, net: -(cappedLoss), multiplier }],
          });
          return;
        }

        const cappedEarned  = Math.min(withMult, effectiveDailyCap - todayEarned);
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
          const cappedLost  = Math.min(lostAbs, AURA_RULES.MAX_DAILY_LOSE - state.todayLost);
          const newTotal    = Math.max(0, state.totalAuraPoints - cappedLost);
          const newLog      = [...state.penaltyLog, { date: getTodayStr(), reason: 'Inactivity/Ignore', amount: -cappedLost }];

          // Calculate multiplier penalty based on gap
          let multPenalty = 0;
          if (gapDays === 1) multPenalty = MULTIPLIERS.PENALTY_1_DAY;
          else if (gapDays === 2) multPenalty = MULTIPLIERS.PENALTY_2_DAYS;
          else if (gapDays >= 3 && gapDays < 7) multPenalty = MULTIPLIERS.PENALTY_3_PLUS_PER_DAY * gapDays;
          else if (gapDays >= 7) multPenalty = -(state.multiplier - MULTIPLIERS.PENALTY_7_PLUS_FLOOR); // drop to -1.0

          const newMult = gapDays >= 7
            ? MULTIPLIERS.PENALTY_7_PLUS_FLOOR
            : clampMultiplier(state.multiplier + multPenalty);

          return {
            totalAuraPoints: newTotal,
            todayLost:       state.todayLost + cappedLost,
            todayNet:        state.todayEarned - (state.todayLost + cappedLost),
            penaltyLog:      newLog,
            streakDays:      gapDays >= 7 ? 0 : state.streakDays,
            multiplier:      newMult,
          };
        });
      },

      /**
       * Apply multiplier penalty for incomplete daily tasks.
       * Called when daily tasks are not fully completed by end of day.
       * @param {number} incompleteCount - number of uncompleted required daily tasks
       */
      applyIncompleteTaskPenalty: (incompleteCount) => {
        if (incompleteCount <= 0) return;
        set((state) => {
          const penalty = MULTIPLIERS.PENALTY_INCOMPLETE_DAILY * incompleteCount;
          return {
            multiplier: clampMultiplier(state.multiplier + penalty),
          };
        });
      },

      /**
       * Apply multiplier penalty for not doing CCA (hobbies, goals, content).
       */
      applyCCAPenalty: () => {
        set((state) => ({
          multiplier: clampMultiplier(state.multiplier + MULTIPLIERS.PENALTY_NO_CCA),
        }));
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
        let newMult;
        if (lastStreakDate === yesterdayStr) {
          // Consecutive day — increment streak and multiplier
          newStreak = streakDays + 1;
          newMult = resolveMultiplier(newStreak);
        } else if (!lastStreakDate) {
          // First time — start at 1
          newStreak = 1;
          newMult = resolveMultiplier(1);
        } else {
          // Gap — streak broken, multiplier resets
          newStreak = 1;
          newMult = MULTIPLIERS.BASE; // Reset on streak break
        }

        const newMax = newStreak > maxStreak ? newStreak : maxStreak;

        set({
          streakDays: newStreak,
          maxStreak: newMax,
          multiplier: clampMultiplier(newMult),
          lastStreakDate: today,
        });
      },

      incrementStreak: () => set((state) => {
        const newStreak = state.streakDays + 1;
        const newMax    = newStreak > state.maxStreak ? newStreak : state.maxStreak;
        const newMult   = resolveMultiplier(newStreak);
        return { streakDays: newStreak, multiplier: clampMultiplier(newMult), maxStreak: newMax };
      }),

      // Streak lost — multiplier resets to base
      breakStreak: () => set(() => ({
        streakDays: 0,
        multiplier: MULTIPLIERS.BASE,
      })),

      // Duel win — +0.5x multiplier boost
      applyDuelWinBonus: () => set((state) => ({
        multiplier: clampMultiplier(state.multiplier + MULTIPLIERS.DUEL_WIN_BONUS)
      })),

      // Duel loss — multiplier resets to base
      applyDuelLossReset: () => set(() => ({
        multiplier: MULTIPLIERS.BASE,
      })),

      // Legacy addAuraPoints — still used for misc/non-categorized AP
      addAuraPoints: (amount, reason) => set((state) => {
        const effectiveDailyCap = state.multiplier > 1.0
          ? Math.floor(AURA_RULES.MAX_DAILY_EARN * state.multiplier)
          : AURA_RULES.MAX_DAILY_EARN;
        const remaining = effectiveDailyCap - state.todayEarned;
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
