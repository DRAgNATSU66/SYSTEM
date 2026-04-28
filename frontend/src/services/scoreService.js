import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useScoreStore } from '../store/scoreStore';

export const scoreService = {
  async getScores(userId, startDate, endDate) {
    let query = supabase.from('daily_scores').select('*').eq('user_id', userId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    const { data, error } = await query;
    if (error) throw error;
    const result = {};
    (data || []).forEach(row => { result[row.date] = row.score; });
    return result;
  },

  async saveScore(userId, date, score) {
    // Optimistic local update
    const current = useScoreStore.getState().dailyScores;
    useScoreStore.setState({
      dailyScores: { ...current, [date]: score },
      todayScore: score,
    });
    pushChange('daily_scores', 'UPSERT', { user_id: userId, date, score });
  },
};
