import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useUserStore } from '../store/userStore';

export const userService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId, data) {
    useUserStore.getState().updateProfile(data);
    pushChange('profiles', 'UPSERT', { id: userId, ...data });
  },

  async upsertProfileOnSignUp(userId, username) {
    const { error } = await supabase.from('profiles').upsert(
      { id: userId, username, total_aura_points: 0, current_streak: 0, max_streak: 0, multiplier: 1.0, rank_tier: 'Normie' },
      { onConflict: 'id' }
    );
    if (error) throw error;
  },
};
