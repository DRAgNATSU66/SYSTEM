import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeDailyScore } from '../utils/scoreCalculator';

export const useScoreStore = create(
  persist(
    (set) => ({
      dailyScores: {}, // { "YYYY-MM-DD": number }
      todayScore: 0,
      weeklyScores: [],

      computeAndSaveDayScore: (date, tasks, defaultWeights) => {
        const score = computeDailyScore(tasks, defaultWeights);
        set((state) => {
          const newDaily = { ...state.dailyScores, [date]: score };
          return {
            dailyScores: newDaily,
            todayScore: score
          };
        });
      },

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-score-store' }
  )
);
