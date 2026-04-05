import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTodayStr } from '../utils/dateUtils';

// Goal Store
export const useGoalStore = create(
  persist(
    (set) => ({
      goals: [],
      goalsHistory: [],
      
      addGoal: (title, target_date, bounty_ap = 1000, isStagnant = true) => set((state) => ({
        goals: [...state.goals, {
          id: Date.now().toString(),
          title, target_date, completed: false, bounty_ap, isStagnant,
          status: 'CREATED',
          createdAt: new Date().toISOString(),
        }]
      })),
      
      completeGoal: (id) => set((state) => {
        const goal = state.goals.find(g => g.id === id);
        if (!goal || goal.completed) return state;
        const updatedGoal = { ...goal, completed: true, status: 'COMPLETED', completedAt: new Date().toISOString() };
        return {
          goals: state.goals.map(g => g.id === id ? updatedGoal : g),
          goalsHistory: [updatedGoal, ...state.goalsHistory]
        };
      }),

      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter(g => g.id !== id)
      })),

      purgeGoal: (id) => set((state) => {
        const goal = state.goals.find(g => g.id === id);
        if (goal) {
          return {
            goals: state.goals.filter(g => g.id !== id),
            goalsHistory: [{ ...goal, status: 'PURGED', purgedAt: new Date().toISOString() }, ...state.goalsHistory]
          };
        }
        return { goals: state.goals.filter(g => g.id !== id) };
      }),

      deleteFromHistory: (id) => set((state) => ({
        goalsHistory: state.goalsHistory.map(g =>
          g.id === id ? { ...g, status: 'HISTORY_PURGED', historyPurgedAt: new Date().toISOString() } : g
        ).filter(g => g.id !== id)
      })),

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-goal-store' }
  )
);

// Project Store
export const useProjectStore = create(
  persist(
    (set) => ({
      projects: [],
      projectsHistory: [],
      sessions: [], 
      
      addProject: (title, type = 'CS', color = '#FFFFFF', status = 'UPCOMING') => set((state) => ({
        projects: [...state.projects, {
          id: Date.now().toString(), title, type, status, color, total_hours: 0,
          lifecycle: 'CREATED',
          createdAt: new Date().toISOString(),
        }]
      })),
      
      updateProjectStatus: (id, status) => set((state) => {
        if (status === 'COMPLETED' || status === 'ARCHIVED') {
          const project = state.projects.find(p => p.id === id);
          return {
            projects: state.projects.filter(p => p.id !== id),
            projectsHistory: [{
              ...project, status,
              lifecycle: status === 'COMPLETED' ? 'COMPLETED' : 'ARCHIVED',
              archivedAt: new Date().toISOString()
            }, ...state.projectsHistory]
          };
        }
        return {
          projects: state.projects.map(p => p.id === id ? { ...p, status } : p)
        };
      }),

      deleteProject: (id, fromHistory = false) => set((state) => {
        if (fromHistory) {
          return { projectsHistory: state.projectsHistory.filter(p => p.id !== id) };
        }
        const project = state.projects.find(p => p.id === id);
        if (project) {
          return {
            projects: state.projects.filter(p => p.id !== id),
            projectsHistory: [{ ...project, lifecycle: 'PURGED', purgedAt: new Date().toISOString() }, ...state.projectsHistory]
          };
        }
        return { projects: state.projects.filter(p => p.id !== id) };
      }),
      
      logSession: (projectId, duration, efficiency, project_title) => set((state) => {
        const newSession = { id: Date.now(), project_id: projectId, project_title: project_title || '', duration, efficiency, date: getTodayStr() };
        return {
          sessions: [...state.sessions, newSession],
          projects: state.projects.map(p => p.id === projectId ? { ...p, total_hours: (p.total_hours || 0) + duration } : p)
        };
      }),

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-project-store' }
  )
);

// Hobby Store
export const useHobbyStore = create(
  persist(
    (set) => ({
      hobbies: [],
      hobbiesHistory: [],
      
      addHobby: (hobby) => set((state) => ({
        hobbies: [...state.hobbies, {
          id: Date.now().toString(),
          ...hobby,
          lifecycle: 'CREATED',
          createdAt: new Date().toISOString()
        }]
      })),

      deleteHobby: (id, fromHistory = false) => set((state) => {
        if (fromHistory) {
          return { hobbiesHistory: state.hobbiesHistory.filter(h => h.id !== id) };
        }
        const hobby = state.hobbies.find(h => h.id === id);
        if (hobby) {
          return {
            hobbies: state.hobbies.filter(h => h.id !== id),
            hobbiesHistory: [{ ...hobby, lifecycle: 'PURGED', purgedAt: new Date().toISOString() }, ...state.hobbiesHistory]
          };
        }
        return { hobbies: state.hobbies.filter(h => h.id !== id) };
      }),

      archiveHobby: (id) => set((state) => {
        const hobby = state.hobbies.find(h => h.id === id);
        return {
          hobbies: state.hobbies.filter(h => h.id !== id),
          hobbiesHistory: [{ ...hobby, lifecycle: 'ARCHIVED', archivedAt: new Date().toISOString() }, ...state.hobbiesHistory]
        };
      }),

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-hobby-store' }
  )
);
