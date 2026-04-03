import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS } from '../constants/scoreWeights';

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,  // Holds Supabase Auth User object when signed in
      profile: { name: '', rank_tier: 'Normie', username: '' },
      preferences: { scoreWeights: DEFAULT_WEIGHTS },
      lastSyncedAt: null,

      setUser: (user) => set({ user }),

      updateProfile: (data) => set((state) => ({
        profile: { ...state.profile, ...data }
      })),

      clearUser: () => set({
        user: null,
        profile: { name: '', rank_tier: 'Normie', username: '' }
      }),

      hydrateFromServer: (serverData) => set(serverData),
    }),
    { name: 'antigravity-user-store' }
  )
);
