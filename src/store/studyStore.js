import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStudyStore = create(
  persist(
    (set) => ({
      subjects: [
        { id: 'math-1', name: 'Mathematics', color: '#00BFFF' },
        { id: 'cs-1', name: 'Computer Science', color: '#39FF14' }
      ],
      sessions: {}, // { date: { subjectId: totalMinutes } }
      
      addSubject: (name, color = '#FFFFFF') => set((state) => ({
        subjects: [...state.subjects, { id: Date.now().toString(), name, color }]
      })),
      
      removeSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id)
      })),
      
      logSession: (subjectId, minutes, date = new Date().toISOString().split('T')[0]) => set((state) => {
        const dateLogs = state.sessions[date] || {};
        return {
          sessions: {
            ...state.sessions,
            [date]: { ...dateLogs, [subjectId]: (dateLogs[subjectId] || 0) + minutes }
          }
        };
      }),

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-study-store' }
  )
);
