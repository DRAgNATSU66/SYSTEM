import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTaskStore = create(
  persist(
    (set) => ({
      tasks: [],
      completions: {}, // { taskId: { "YYYY-MM-DD": boolean/numeric } }
      
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, { ...task, id: Date.now().toString(), createdAt: new Date().toISOString() }] 
      })),
      
      removeTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      })),

      updateTask: (taskId, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      })),
      
      toggleCompletion: (taskId, date, value) => set((state) => {
        const newCompletions = { ...state.completions };
        if (!newCompletions[taskId]) newCompletions[taskId] = {};
        newCompletions[taskId][date] = value;
        return { completions: newCompletions };
      }),

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-task-store' }
  )
);
