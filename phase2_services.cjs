const fs = require('fs');
const path = require('path');

const files = {
  'src/services/taskService.js': `import { useTaskStore } from '../store/taskStore';

export const taskService = {
  getTasks: async () => {
    return useTaskStore.getState().tasks;
  },
  createTask: async (data) => {
    useTaskStore.getState().addTask(data);
    return true;
  },
  updateTask: async (id, data) => {
    // In local phase, if we needed to update we'd add an action in Zustand
    return true; 
  },
  deleteTask: async (id) => {
    useTaskStore.getState().removeTask(id);
    return true;
  },
  getCompletions: async (date) => {
    const comps = useTaskStore.getState().completions;
    const result = {};
    Object.keys(comps).forEach(taskId => {
      if (comps[taskId][date] !== undefined) {
        result[taskId] = comps[taskId][date];
      }
    });
    return result;
  },
  setCompletion: async (taskId, date, value) => {
    useTaskStore.getState().toggleCompletion(taskId, date, value);
    return true;
  }
};\n`,

  'src/services/scoreService.js': `import { useScoreStore } from '../store/scoreStore';

export const scoreService = {
  getScores: async (startDate, endDate) => {
    // Return all daily scores from Zustand
    return useScoreStore.getState().dailyScores;
  },
  saveScore: async (date, score) => {
    const current = useScoreStore.getState().dailyScores;
    useScoreStore.setState({ dailyScores: { ...current, [date]: score } });
    return true;
  }
};\n`,

  'src/services/auraService.js': `import { useAuraStore } from '../store/auraStore';

export const auraService = {
  getTotalAP: async () => {
    return useAuraStore.getState().totalAuraPoints;
  },
  getAuraHistory: async (startDate, endDate) => {
    return useAuraStore.getState().auraHistory;
  },
  saveDayAura: async (date, earned, lost, multiplier) => {
    // Direct manipulation for testing
    const history = useAuraStore.getState().auraHistory;
    useAuraStore.setState({
      auraHistory: [...history.filter(h => h.date !== date), { date, net: earned - lost, multiplier }]
    });
    return true;
  },
  getPenaltyLog: async () => {
    return useAuraStore.getState().penaltyLog;
  },
  getLeaderboard: async () => {
    // Currently single user leaderboard
    const ap = useAuraStore.getState().totalAuraPoints;
    const streak = useAuraStore.getState().streakDays;
    const multiplier = useAuraStore.getState().multiplier;
    const todayEarned = useAuraStore.getState().todayNet;
    
    return [
      { rank: 1, name: 'YOU 👑', totalAP: ap, streakDays: streak, multiplier, todayNet: todayEarned }
    ];
  },
  getSelfRank: async () => {
    return 1;
  }
};\n`,

  'src/services/userService.js': `import { useUserStore } from '../store/userStore';

export const userService = {
  getProfile: async () => {
    return {
      profile: useUserStore.getState().profile,
      preferences: useUserStore.getState().preferences
    };
  },
  updateProfile: async (data) => {
    useUserStore.getState().updateProfile(data);
    return true;
  }
};\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.writeFileSync(fullPath, files[file]);
  console.log('Updated: ' + file);
});
