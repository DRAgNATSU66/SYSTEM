import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useGoalStore } from '../store/assetStores';

export const goalService = {
  async getGoals(userId) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  addGoal(userId, title, target_date, bounty_ap = 1000, isStagnant = true) {
    useGoalStore.getState().addGoal(title, target_date, bounty_ap, isStagnant);
    const goals = useGoalStore.getState().goals;
    const newGoal = goals[goals.length - 1];
    pushChange('goals', 'UPSERT', { ...newGoal, user_id: userId });
  },

  completeGoal(userId, id) {
    useGoalStore.getState().completeGoal(id);
    const goal = useGoalStore.getState().goalsHistory.find(g => g.id === id);
    if (goal) pushChange('goals', 'UPSERT', { ...goal, user_id: userId, completed: true });
  },

  deleteGoal(userId, id) {
    useGoalStore.getState().deleteGoal(id);
    pushChange('goals', 'UPSERT', { id, user_id: userId, archived: true });
  },
};
