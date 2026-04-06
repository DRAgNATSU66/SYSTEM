import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS } from '../constants/scoreWeights';

// Generate a unique 10-character alphanumeric Cypher ID
const generateCypherId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,  // Holds Supabase Auth User object when signed in
      profile: { name: '', rank_tier: 'Normie', username: '' },
      cypherId: null,  // Unique 10-digit alphanumeric ID
      preferences: { scoreWeights: DEFAULT_WEIGHTS },
      lastSyncedAt: null,
      authLoading: true,  // true until AuthProvider confirms session status on mount

      setAuthLoading: (val) => set({ authLoading: val }),

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
        const { authLoading, setAuthLoading, ...rest } = state;
        return rest;
      },
    }
  )
);
