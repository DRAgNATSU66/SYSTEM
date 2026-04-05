import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeIQGain, computeKnowledgeGain, IQ_SUBJECT_TIERS } from '../constants/neuralStats';

// Subjects that increase IQ in neural pentagram — hard/analytical/application-based
const IQ_CONTRIBUTING_SUBJECTS = [
  'mathematics', 'maths', 'math',
  'physics',
  'logic', 'reasoning',
  'aptitude', 'quantitative aptitude',
  'gk', 'general knowledge',
  'data structures', 'algorithms', 'dsa',
  'discrete mathematics', 'discrete math',
  'statistics', 'probability',
  'calculus',
  'linear algebra',
  'computer science',
  'competitive programming',
  'problem solving',
  'machine learning',
  'artificial intelligence',
  'chemistry',
  'engineering',
];

export const isIQSubject = (subjectName) => {
  const lower = (subjectName || '').toLowerCase().trim();
  return IQ_CONTRIBUTING_SUBJECTS.some(s => lower.includes(s) || s.includes(lower));
};

export const useStudyStore = create(
  persist(
    (set, get) => ({
      subjects: [
        { id: 'math-1', name: 'Mathematics', color: '#00BFFF' },
        { id: 'cs-1', name: 'Computer Science', color: '#39FF14' }
      ],
      sessions: {}, // { date: { subjectId: totalMinutes } }

      // Accumulated neural stats — persisted and synced to backend
      accumulatedIQ: 0,         // Total IQ points gained from all study sessions
      accumulatedKnowledge: 0,  // Total Knowledge points gained from all study sessions

      addSubject: (name, color = '#FFFFFF') => set((state) => ({
        subjects: [...state.subjects, { id: Date.now().toString(), name, color }]
      })),

      removeSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id)
      })),

      logSession: (subjectId, minutes, date = new Date().toISOString().split('T')[0]) => set((state) => {
        const dateLogs = state.sessions[date] || {};

        // Find subject name for IQ calculation
        const subject = state.subjects.find(s => s.id === subjectId);
        const subjectName = subject?.name || '';

        // Compute IQ and Knowledge gains
        const iqGain = computeIQGain(subjectName, minutes);
        const knowledgeGain = computeKnowledgeGain(minutes);

        return {
          sessions: {
            ...state.sessions,
            [date]: { ...dateLogs, [subjectId]: (dateLogs[subjectId] || 0) + minutes }
          },
          accumulatedIQ: Math.round((state.accumulatedIQ + iqGain) * 100) / 100,
          accumulatedKnowledge: Math.round((state.accumulatedKnowledge + knowledgeGain) * 100) / 100,
        };
      }),

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-study-store' }
  )
);
