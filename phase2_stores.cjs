const fs = require('fs');
const path = require('path');

const files = {
  'src/store/taskStore.js': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      completions: {}, // { taskId: { "YYYY-MM-DD": boolean/numeric } }
      
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, { ...task, id: Date.now().toString(), createdAt: new Date().toISOString() }] 
      })),
      
      removeTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      })),
      
      toggleCompletion: (taskId, date, value) => set((state) => {
        const newCompletions = { ...state.completions };
        if (!newCompletions[taskId]) newCompletions[taskId] = {};
        newCompletions[taskId][date] = value;
        return { completions: newCompletions };
      }),
    }),
    { name: 'antigravity-task-store' }
  )
);\n`,

  'src/store/auraStore.js': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeAuraPoints } from '../utils/auraCalculator';
import { resolveMultiplier } from '../utils/multiplierResolver';
import { computePenalties } from '../utils/penaltyEngine';
import { getTodayStr } from '../utils/dateUtils';

export const useAuraStore = create(
  persist(
    (set, get) => ({
      totalAuraPoints: 0,
      todayEarned: 0,
      todayLost: 0,
      todayNet: 0,
      multiplier: 1.0,
      streakDays: 0,
      penaltyLog: [],
      auraHistory: [],
      lastLoginDate: getTodayStr(),

      computeTodayAura: (dailyScore, hasAllPermanent, peakMood, overperformedCount) => {
        const { multiplier, totalAuraPoints, todayLost, auraHistory } = get();
        const earned = computeAuraPoints(dailyScore, hasAllPermanent, peakMood, overperformedCount);
        const earnedWithMult = Math.floor(earned * multiplier);
        
        const newTotal = Math.max(0, totalAuraPoints + earnedWithMult);
        const today = getTodayStr();
        
        let newHistory = [...auraHistory];
        const todayIdx = newHistory.findIndex(h => h.date === today);
        if (todayIdx >= 0) {
          newHistory[todayIdx] = { date: today, net: earnedWithMult - todayLost, multiplier };
        } else {
          newHistory.push({ date: today, net: earnedWithMult - todayLost, multiplier });
        }

        set({
          todayEarned: earnedWithMult,
          todayNet: earnedWithMult - todayLost,
          totalAuraPoints: newTotal,
          auraHistory: newHistory
        });
      },

      applyPenalties: (gapDays, ignoredTasks) => {
        if (gapDays <= 0) return;
        const penalty = computePenalties(gapDays, ignoredTasks);
        if (penalty === 0) return;

        set((state) => {
          const newTotal = Math.max(0, state.totalAuraPoints + penalty);
          const newLog = [...state.penaltyLog, { date: getTodayStr(), reason: 'Inactivity/Ignore', amount: penalty }];
          const lostAbs = Math.abs(penalty);
          
          return {
            totalAuraPoints: newTotal,
            todayLost: state.todayLost + lostAbs,
            todayNet: state.todayEarned - (state.todayLost + lostAbs),
            penaltyLog: newLog,
            streakDays: gapDays >= 7 ? 0 : state.streakDays,
            multiplier: gapDays >= 7 ? 1.0 : state.multiplier
          };
        });
      },

      incrementStreak: () => set((state) => {
        const newStreak = state.streakDays + 1;
        return { streakDays: newStreak, multiplier: resolveMultiplier(newStreak) };
      }),

      breakStreak: () => set({ streakDays: 0, multiplier: 1.0 }),
      
      setLastLoginDate: (dateStr) => set({ lastLoginDate: dateStr })
    }),
    { name: 'antigravity-aura-store' }
  )
);\n`,

  'src/store/scoreStore.js': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeDailyScore } from '../utils/scoreCalculator';

export const useScoreStore = create(
  persist(
    (set, get) => ({
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
      }
    }),
    { name: 'antigravity-score-store' }
  )
);\n`,

  'src/store/userStore.js': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS } from '../constants/scoreWeights';

export const useUserStore = create(
  persist(
    (set) => ({
      profile: { name: 'Grinder', avatar: '' },
      preferences: { scoreWeights: DEFAULT_WEIGHTS },
      updateProfile: (data) => set((state) => ({ profile: { ...state.profile, ...data } })),
      updatePreferences: (data) => set((state) => ({ preferences: { ...state.preferences, ...data } }))
    }),
    { name: 'antigravity-user-store' }
  )
);\n`,

  'src/store/uiStore.js': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeModal: null,
      theme: 'dark',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setModal: (modal) => set({ activeModal: modal }),
      setTheme: (theme) => set({ theme })
    }),
    { name: 'antigravity-ui-store' }
  )
);\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.writeFileSync(fullPath, files[file]);
  console.log('Updated: ' + file);
});
