import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS } from '../constants/scoreWeights';

const generateCypherId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
};

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,  // Holds Supabase Auth User object when signed in
      profile: { name: '', rank_tier: 'Normie', username: '' },
      cypherId: null,  // Unique 10-digit alphanumeric ID
      preferences: {
        scoreWeights: DEFAULT_WEIGHTS,
        workoutSplit: { 0: 'hypertrophy', 1: 'cardio', 2: 'cardio', 3: 'cardio', 4: 'hypertrophy', 5: 'hypertrophy', 6: 'hypertrophy' },
      },
      lastSyncedAt: null,
      authLoading: true,
      syncing: false,

      setAuthLoading: (val) => set({ authLoading: val }),
      setSyncing: (val) => set({ syncing: val }),

      updatePreferences: (data) => set((state) => ({
        preferences: { ...state.preferences, ...data }
      })),

      setUser: (user) => {
        const state = get();
        const updates = { user };
        // Auto-assign cypher ID on first login if not already set
        if (!state.cypherId) {
          updates.cypherId = generateCypherId();
        }
        set(updates);
      },

      // Ensure cypher ID exists (for users who never sign in with Supabase)
      ensureCypherId: () => {
        const { cypherId } = get();
        if (!cypherId) {
          set({ cypherId: generateCypherId() });
        }
      },

      updateProfile: (data) => set((state) => ({
        profile: { ...state.profile, ...data }
      })),

      setAvatarUrl: (url) => set((state) => ({
        profile: { ...state.profile, avatarUrl: url }
      })),

      clearUser: () => set({
        user: null,
        profile: { name: '', rank_tier: 'Normie', username: '' }
      }),

      hydrateFromServer: (serverData) => set(serverData),
    }),
    {
      name: 'antigravity-user-store',
      partialize: (state) => {
        // eslint-disable-next-line no-unused-vars
        const { authLoading, setAuthLoading, syncing, setSyncing, ...rest } = state;
        return rest;
      },
    }
  )
);
