import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useHobbyStore } from '../store/assetStores';

export const hobbyService = {
  async getHobbies(userId) {
    const { data, error } = await supabase
      .from('hobbies')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  addHobby(userId, hobby) {
    useHobbyStore.getState().addHobby(hobby);
    const hobbies = useHobbyStore.getState().hobbies;
    const newHobby = hobbies[hobbies.length - 1];
    pushChange('hobbies', 'UPSERT', { ...newHobby, user_id: userId });
  },

  deleteHobby(userId, id, fromHistory = false) {
    useHobbyStore.getState().deleteHobby(id, fromHistory);
    pushChange('hobbies', 'DELETE', { id, user_id: userId });
  },

  archiveHobby(userId, id) {
    useHobbyStore.getState().archiveHobby(id);
    pushChange('hobbies', 'UPSERT', { id, user_id: userId, archived: true });
  },
};
