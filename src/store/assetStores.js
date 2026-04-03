import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTodayStr } from '../utils/dateUtils';

// Goal Store
export const useGoalStore = create(
  persist(
    (set) => ({
      goals: [
        { id: 'sgpa-9', title: 'SCORE 9+ SGPA', target_date: '2026-06-30', completed: false, bounty_ap: 5000, isStagnant: true },
        { id: 'gate-800', title: 'SCORE 800+ GATE EXAM', target_date: '2027-02-15', completed: false, bounty_ap: 10000, isStagnant: true }
      ],
      goalsHistory: [],
      
      addGoal: (title, target_date, bounty_ap = 1000, isStagnant = true) => set((state) => ({ 
        goals: [...state.goals, { id: Date.now(), title, target_date, completed: false, bounty_ap, isStagnant }] 
      })),
      
      completeGoal: (id) => set((state) => {
        const goal = state.goals.find(g => g.id === id);
        if (!goal || goal.completed) return state;
        const updatedGoal = { ...goal, completed: true, completedAt: new Date().toISOString() };
        return {
          goals: state.goals.map(g => g.id === id ? updatedGoal : g),
          goalsHistory: [updatedGoal, ...state.goalsHistory]
        };
      }),
      
      deleteGoal: (id) => set((state) => ({ 
        goals: state.goals.filter(g => g.id !== id) 
      })),

      deleteFromHistory: (id) => set((state) => ({
        goalsHistory: state.goalsHistory.filter(g => g.id !== id)
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
      projects: [
        { id: 'cs-v4', title: 'SYSTEM V4.0 OS', type: 'CS', status: 'IN_PROGRESS', color: '#00BFFF', total_hours: 0 }
      ],
      projectsHistory: [],
      sessions: [], 
      
      addProject: (title, type = 'CS', color = '#FFFFFF', status = 'UPCOMING') => set((state) => ({
        projects: [...state.projects, { id: Date.now(), title, type, status, color, total_hours: 0 }]
      })),
      
      updateProjectStatus: (id, status) => set((state) => {
        if (status === 'COMPLETED' || status === 'ARCHIVED') {
          const project = state.projects.find(p => p.id === id);
          return {
            projects: state.projects.filter(p => p.id !== id),
            projectsHistory: [{ ...project, status, archivedAt: new Date().toISOString() }, ...state.projectsHistory]
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
        return { projects: state.projects.filter(p => p.id !== id) };
      }),
      
      logSession: (projectId, duration, efficiency) => set((state) => {
        const newSession = { id: Date.now(), project_id: projectId, duration, efficiency, date: getTodayStr() };
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
          createdAt: new Date().toISOString() 
        }]
      })),
      
      deleteHobby: (id, fromHistory = false) => set((state) => {
        if (fromHistory) {
          return { hobbiesHistory: state.hobbiesHistory.filter(h => h.id !== id) };
        }
        return { hobbies: state.hobbies.filter(h => h.id !== id) };
      }),
      
      archiveHobby: (id) => set((state) => {
        const hobby = state.hobbies.find(h => h.id === id);
        return {
          hobbies: state.hobbies.filter(h => h.id !== id),
          hobbiesHistory: [{ ...hobby, archivedAt: new Date().toISOString() }, ...state.hobbiesHistory]
        };
      }),

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-hobby-store' }
  )
);
