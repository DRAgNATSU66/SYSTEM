import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useMetricsStore } from '../store/metricsStore';

export const metricsService = {
  async getDailyMetrics(userId, startDate, endDate) {
    let query = supabase.from('daily_metrics').select('*').eq('user_id', userId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getMacroConfig(userId) {
    const { data } = await supabase
      .from('macro_configs')
      .select('macros')
      .eq('user_id', userId)
      .single();
    return data?.macros || [];
  },

  logMetrics(userId, data, date) {
    useMetricsStore.getState().logMetrics(data, date);
    const store = useMetricsStore.getState();
    const day = store.dailyMetrics[date] || {};
    pushChange('daily_metrics', 'UPSERT', {
      user_id: userId,
      date,
      sleep: day.sleep,
      deep_sleep: day.deepSleep,
      mood: day.mood,
      macros: day.macros || {},
    });
  },

  logMacroValue(userId, id, value, date) {
    useMetricsStore.getState().logMacroValue(id, value, date);
    const store = useMetricsStore.getState();
    const day = store.dailyMetrics[date] || {};
    pushChange('daily_metrics', 'UPSERT', {
      user_id: userId,
      date,
      sleep: day.sleep,
      deep_sleep: day.deepSleep,
      mood: day.mood,
      macros: day.macros || {},
    });
  },

  saveMacroConfig(userId, macros) {
    pushChange('macro_configs', 'UPSERT', { user_id: userId, macros });
  },
};
