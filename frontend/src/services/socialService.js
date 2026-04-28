import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useSocialStore } from '../store/socialStore';

export const socialService = {
  async getFriends(userId) {
    const { data, error } = await supabase
      .from('friends')
      .select('*, friend:friend_id(id, username, rank_tier, total_aura_points)')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async getDuels(userId) {
    const { data, error } = await supabase
      .from('duels')
      .select('*')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  addFriend(userId, friend) {
    useSocialStore.getState().addFriend(friend);
    pushChange('friends', 'UPSERT', { user_id: userId, friend_id: friend.id, status: 'accepted' });
  },

  initiateDuel(userId, opponentId, opponentName, stake = 500) {
    useSocialStore.getState().initiateDuel(opponentId, opponentName, stake);
    const duels = useSocialStore.getState().duels;
    const newDuel = duels[duels.length - 1];
    pushChange('duels', 'UPSERT', {
      ...newDuel,
      challenger_id: userId,
      opponent_id: opponentId,
    });
  },

  resolveDuel(duelId, winnerId, currentUserId) {
    useSocialStore.getState().resolveDuel(duelId, winnerId, currentUserId);
    pushChange('duels', 'UPSERT', { id: duelId, state: 'resolved', winner_id: winnerId });
  },
};
