import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useAuraStore } from '../store/auraStore';

export const auraService = {
  async getTotalAP(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_aura_points')
      .eq('id', userId)
      .single();
    if (error) return useAuraStore.getState().totalAuraPoints;
    return data.total_aura_points;
  },

  async getAuraHistory(userId, startDate, endDate) {
    let query = supabase.from('aura_logs').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    const { data, error } = await query;
    if (error) return useAuraStore.getState().auraHistory;
    return (data || []).map(row => ({ date: row.date, net: row.net, multiplier: row.multiplier }));
  },

  async saveDayAura(userId, date, earned, lost, multiplier) {
    // Optimistic local
    const aura = useAuraStore.getState();
    const existing = aura.auraHistory.findIndex(h => h.date === date);
    const entry = { date, net: earned - lost, multiplier };
    const newHistory = [...aura.auraHistory];
    if (existing >= 0) newHistory[existing] = entry; else newHistory.push(entry);
    useAuraStore.setState({ auraHistory: newHistory });

    pushChange('aura_logs', 'UPSERT', { user_id: userId, date, earned, lost, multiplier });
    pushChange('profiles', 'UPSERT', {
      id: userId,
      total_aura_points: aura.totalAuraPoints,
      current_streak: aura.streakDays,
      max_streak: aura.maxStreak,
      multiplier: aura.multiplier,
    });
  },

  async getPenaltyLog(userId) {
    const { data } = await supabase
      .from('aura_logs')
      .select('*')
      .eq('user_id', userId)
      .ilike('reason', '%penalty%')
      .order('date', { ascending: false });
    return data || useAuraStore.getState().penaltyLog;
  },

  async getLeaderboard() {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(50);
    if (error || !data?.length) {
      // Fallback to local single-user
      const s = useAuraStore.getState();
      return [{ rank: 1, name: 'YOU 👑', totalAP: s.totalAuraPoints, streakDays: s.streakDays, multiplier: s.multiplier, todayNet: s.todayNet }];
    }
    return data.map(row => ({
      rank: row.rank,
      name: row.username || 'YOU 👑',
      totalAP: row.total_aura_points,
      streakDays: row.current_streak,
      multiplier: row.multiplier,
      todayNet: row.today_score,
    }));
  },

  async getSelfRank(userId) {
    const { data } = await supabase
      .from('leaderboard')
      .select('rank')
      .eq('id', userId)
      .single();
    return data?.rank || 1;
  },
};
