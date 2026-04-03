import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useTaskStore } from '../store/taskStore';

export const taskService = {
  async getTasks(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async createTask(task) {
    // Optimistic: already in Zustand via store action before this is called
    pushChange('tasks', 'UPSERT', task);
  },

  async updateTask(id, data) {
    const tasks = useTaskStore.getState().tasks;
    const existing = tasks.find(t => t.id === id);
    if (!existing) return;
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    useTaskStore.setState({ tasks: tasks.map(t => t.id === id ? updated : t) });
    pushChange('tasks', 'UPSERT', updated);
  },

  async deleteTask(id) {
    useTaskStore.getState().removeTask(id);
    pushChange('tasks', 'DELETE', { id });
  },

  async getCompletions(userId, date) {
    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);
    if (error) throw error;
    const result = {};
    (data || []).forEach(row => { result[row.task_id] = row.value; });
    return result;
  },

  async setCompletion(taskId, userId, date, value) {
    useTaskStore.getState().toggleCompletion(taskId, date, value);
    pushChange('task_completions', 'UPSERT', { task_id: taskId, user_id: userId, date, value });
  },
};
