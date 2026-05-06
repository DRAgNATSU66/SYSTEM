import { supabase } from './supabaseClient';
import { pushChange } from './syncEngine';
import { useProjectStore } from '../store/assetStores';
import { projectToRow, projectSessionToRow } from './dbSerializers';

export const projectService = {
  async getProjects(userId) {
    const { data, error } = await supabase
      .from('projects')
      .select('id,user_id,title,type,status,color,total_hours,archived,created_at')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async getProjectSessions(userId) {
    const { data, error } = await supabase
      .from('project_sessions')
      .select('id,user_id,project_id,date,hours,efficiency,created_at')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  addProject(userId, title, type, color, status) {
    useProjectStore.getState().addProject(title, type, color, status);
    const projects = useProjectStore.getState().projects;
    const newProject = projects[projects.length - 1];
    pushChange('projects', 'UPSERT', projectToRow(newProject, userId));
  },

  updateStatus(userId, id, status) {
    useProjectStore.getState().updateProjectStatus(id, status);
    pushChange('projects', 'UPSERT', { id, user_id: userId, status, archived: status === 'ARCHIVED' || status === 'COMPLETED' });
  },

  deleteProject(userId, id, fromHistory = false) {
    useProjectStore.getState().deleteProject(id, fromHistory);
    pushChange('projects', 'DELETE', { id, user_id: userId });
  },

  logSession(userId, projectId, duration, efficiency, project_title) {
    useProjectStore.getState().logSession(projectId, duration, efficiency, project_title);
    const sessions = useProjectStore.getState().sessions;
    const newSession = sessions[sessions.length - 1];
    pushChange('project_sessions', 'UPSERT', projectSessionToRow({ ...newSession, user_id: userId }));
  },
};
