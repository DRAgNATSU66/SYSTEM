/**
 * dbSerializers.js
 * Maps Zustand local objects to exact DB column shapes before any Supabase write.
 * Never send raw store objects to Supabase — local-only fields cause silent write failures.
 */

export const taskToRow = (task, userId) => ({
  id: task.id,
  user_id: userId || task.user_id,
  title: task.title,
  type: task.type ?? 'PERMANENT_DAILY',
  base_weight: task.base_weight ?? task.baseWeight ?? 100,
  method: task.method ?? 'checkbox',
  target: task.target ?? null,
  subcategory: task.subcategory ?? null,
});

export const goalToRow = (goal, userId) => ({
  id: goal.id,
  user_id: userId || goal.user_id,
  title: goal.title,
  target_date: goal.target_date ?? null,
  completed: goal.completed ?? false,
  bounty_ap: goal.bounty_ap ?? 1000,
  archived: goal.archived ?? false,
  completed_at: goal.completedAt ?? goal.completed_at ?? null,
});

export const projectToRow = (project, userId) => ({
  id: project.id,
  user_id: userId || project.user_id,
  title: project.title,
  type: project.type ?? 'CS',
  status: project.status ?? 'UPCOMING',
  color: project.color ?? '#FFFFFF',
  total_hours: project.total_hours ?? 0,
  archived: project.archived ?? false,
});

export const projectSessionToRow = (session, userId) => ({
  id: session.id,
  user_id: userId || session.user_id,
  project_id: session.project_id,
  date: session.date,
  hours: session.hours ?? session.duration ?? 0,
  efficiency: session.efficiency ?? null,
});

export const hobbyToRow = (hobby, userId) => ({
  id: hobby.id,
  user_id: userId || hobby.user_id,
  name: hobby.name ?? hobby.title,
  data: hobby.data ?? { type: hobby.type, categories: hobby.categories },
  archived: hobby.archived ?? false,
});

// Reverse: DB row → store/UI shape for hobbies
export const rowToHobby = (row) => ({
  id: row.id,
  user_id: row.user_id,
  title: row.name,
  type: row.data?.type,
  categories: row.data?.categories || [],
  archived: row.archived ?? false,
  lifecycle: row.archived ? 'ARCHIVED' : 'ACTIVE',
});

// Profile update: only send columns that exist in profiles table
export const profileToRow = (userId, data) => {
  const row = { id: userId };
  if (data.username   != null) row.username    = data.username;
  if (data.avatarUrl  != null) row.avatar_url  = data.avatarUrl;
  if (data.avatar_url != null) row.avatar_url  = data.avatar_url;
  if (data.preferences != null) row.preferences = data.preferences;
  return row;
};
