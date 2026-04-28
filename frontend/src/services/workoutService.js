import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useWorkoutStore } from '../store/workoutStore';

export const workoutService = {
  async getWorkoutLogs(userId, startDate, endDate) {
    let query = supabase.from('workout_logs').select('*').eq('user_id', userId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async saveWorkoutLog(userId, date, cardio, volume) {
    // Optimistic via store
    pushChange('workout_logs', 'UPSERT', { user_id: userId, date, cardio, volume });
  },

  async getPersonalBests(userId) {
    const { data } = await supabase
      .from('personal_bests')
      .select('data')
      .eq('user_id', userId)
      .single();
    return data?.data || {};
  },

  async savePersonalBests(userId, pbs) {
    useWorkoutStore.setState({ personalBests: pbs });
    pushChange('personal_bests', 'UPSERT', { user_id: userId, data: pbs });
  },

  logCardio(userId, type, data, date) {
    useWorkoutStore.getState().logCardio(type, data, date);
    const store = useWorkoutStore.getState();
    pushChange('workout_logs', 'UPSERT', {
      user_id: userId,
      date,
      cardio: store.cardio,
      volume: store.logs[date] || {},
    });
  },

  logVolume(userId, muscleGroup, subGroup, sets, reps, weight, date) {
    useWorkoutStore.getState().logVolume(muscleGroup, subGroup, sets, reps, weight, date);
    const store = useWorkoutStore.getState();
    pushChange('workout_logs', 'UPSERT', {
      user_id: userId,
      date,
      cardio: store.cardio,
      volume: store.logs[date] || {},
    });
    pushChange('personal_bests', 'UPSERT', { user_id: userId, data: store.personalBests });
  },
};
