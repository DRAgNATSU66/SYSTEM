import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useGoalStore } from '../store/assetStores';
import { goalToRow } from './dbSerializers';

export const goalService = {
  async getGoals(userId) {
    const { data, error } = await supabase
      .from('goals')
      .select('id,user_id,title,target_date,completed,bounty_ap,archived,completed_at,created_at')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  addGoal(userId, title, target_date, bounty_ap = 1000, isStagnant = true) {
    useGoalStore.getState().addGoal(title, target_date, bounty_ap, isStagnant);
    const goals = useGoalStore.getState().goals;
    const newGoal = goals[goals.length - 1];
    pushChange('goals', 'UPSERT', goalToRow(newGoal, userId));
  },

  completeGoal(userId, id) {
    useGoalStore.getState().completeGoal(id);
    const goal = useGoalStore.getState().goalsHistory.find(g => g.id === id);
    if (goal) pushChange('goals', 'UPSERT', goalToRow({ ...goal, completed: true }, userId));
  },

  deleteGoal(userId, id) {
    useGoalStore.getState().deleteGoal(id);
    pushChange('goals', 'UPSERT', { id, user_id: userId, archived: true });
  },
};
