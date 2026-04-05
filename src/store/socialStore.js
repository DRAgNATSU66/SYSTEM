import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuraStore } from './auraStore';

export const useSocialStore = create(
  persist(
    (set) => ({
      friends: [], // { id, name, rank, avatar }
      duels: [], // { id, opponent_id, opponent_name, state: 'pending'|'active'|'resolved', stake_ap: 500, winner_id: null }

      addFriend: (friend) => set((state) => ({
        friends: [...state.friends, friend]
      })),

      initiateDuel: (opponentId, opponentName, stake = 500) => set((state) => ({
        duels: [...state.duels, {
          id: Date.now(),
          opponent_id: opponentId,
          opponent_name: opponentName,
          state: 'active',
          stake_ap: stake,
          start_date: new Date().toISOString()
        }]
      })),

      resolveDuel: (duelId, winnerId, currentUserId) => {
        set((state) => ({
          duels: state.duels.map(d => d.id === duelId ? { ...d, state: 'resolved', winner_id: winnerId } : d)
        }));

        // Apply multiplier effect based on win/loss
        if (winnerId === currentUserId) {
          useAuraStore.getState().applyDuelWinBonus();
        } else {
          // Duel loss — multiplier resets
          useAuraStore.getState().applyDuelLossReset();
        }
      },

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-social-store' }
  )
);
