import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useStudyStore } from '../store/studyStore';

export const studyService = {
  async getSubjects(userId) {
    const { data, error } = await supabase
      .from('study_subjects')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async getSessions(userId, startDate, endDate) {
    let query = supabase.from('study_sessions').select('*').eq('user_id', userId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  addSubject(userId, name, color) {
    useStudyStore.getState().addSubject(name, color);
    const subjects = useStudyStore.getState().subjects;
    const newSubject = subjects.find(s => s.name === name);
    if (newSubject) {
      pushChange('study_subjects', 'UPSERT', { ...newSubject, user_id: userId });
    }
  },

  removeSubject(userId, id) {
    useStudyStore.getState().removeSubject(id);
    pushChange('study_subjects', 'DELETE', { id, user_id: userId });
  },

  logSession(userId, subjectId, minutes, date) {
    useStudyStore.getState().logSession(subjectId, minutes, date);
    const store = useStudyStore.getState();
    pushChange('study_sessions', 'UPSERT', {
      user_id: userId,
      date,
      data: store.sessions[date] || {},
    });
  },
};
