/**
 * syncEngine.js — Offline-first sync orchestrator
 * Pattern: optimistic local update → async Supabase upsert → offline queue fallback
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabaseClient';
import { useTaskStore } from '../store/taskStore';
import { useAuraStore } from '../store/auraStore';
import { useScoreStore } from '../store/scoreStore';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useMetricsStore } from '../store/metricsStore';
import { useStudyStore } from '../store/studyStore';
import { useSocialStore } from '../store/socialStore';
import { useGoalStore, useProjectStore, useHobbyStore } from '../store/assetStores';

// ─────────────────────────────────────────────
// Offline Queue Store (persisted to localStorage)
// ─────────────────────────────────────────────
export const useSyncQueue = create(
  persist(
    (set) => ({
      queue: [], // [{ id, table, op, payload, timestamp }]
      lastSyncedAt: null,

      enqueue: (table, op, payload) => {
        const item = {
          id: `${table}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          table,
          op,
          payload,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ queue: [...state.queue, item] }));
      },

      dequeue: (id) => set((state) => ({
        queue: state.queue.filter(item => item.id !== id),
      })),

      clearQueue: () => set({ queue: [] }),

      setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
    }),
    { name: 'system-sync-queue' }
  )
);

// ─────────────────────────────────────────────
// pushChange — online: upsert immediately; offline: enqueue
// ─────────────────────────────────────────────
export async function pushChange(table, op, payload) {
  const isOnline = navigator.onLine;

  if (!isOnline) {
    useSyncQueue.getState().enqueue(table, op, payload);
    return;
  }

  try {
    if (op === 'DELETE') {
      await supabase.from(table).delete().eq('id', payload.id);
    } else {
      await supabase.from(table).upsert(payload, { onConflict: getConflictKey(table) });
    }
  } catch (err) {
    console.warn(`[syncEngine] pushChange failed for ${table}, queuing.`, err);
    useSyncQueue.getState().enqueue(table, op, payload);
  }
}

function getConflictKey(table) {
  const keys = {
    profiles: 'id',
    aura_logs: 'user_id,date',
    daily_scores: 'user_id,date',
    tasks: 'id',
    task_completions: 'task_id,date',
    workout_logs: 'user_id,date',
    personal_bests: 'user_id',
    study_sessions: 'user_id,date',
    daily_metrics: 'user_id,date',
    macro_configs: 'user_id',
    goals: 'user_id,id',
    projects: 'user_id,id',
    project_sessions: 'user_id,id',
    hobbies: 'user_id,id',
    friends: 'user_id,friend_id',
    duels: 'id',
  };
  return keys[table] || 'id';
}

// ─────────────────────────────────────────────
// flushQueue — process all queued mutations
// ─────────────────────────────────────────────
export async function flushQueue() {
  const { queue, dequeue } = useSyncQueue.getState();
  if (!queue.length || !navigator.onLine) return;

  // Deduplicate: keep last write per (table + primary key identifier)
  const seen = new Map();
  const deduped = [];
  for (const item of [...queue].reverse()) {
    const key = `${item.table}__${item.payload.id || JSON.stringify(item.payload)}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      deduped.unshift(item);
    }
  }

  for (const item of deduped) {
    try {
      if (item.op === 'DELETE') {
        await supabase.from(item.table).delete().eq('id', item.payload.id);
      } else {
        await supabase.from(item.table).upsert(item.payload, {
          onConflict: getConflictKey(item.table),
        });
      }
      dequeue(item.id);
    } catch (err) {
      console.warn(`[syncEngine] flush failed for item ${item.id}`, err);
    }
  }

  useSyncQueue.getState().setLastSyncedAt(new Date().toISOString());
}

// Flush on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushQueue);
}

// ─────────────────────────────────────────────
// pullAllData — hydrate all stores from Supabase
// ─────────────────────────────────────────────
export async function pullAllData(userId) {
  if (!userId || !supabase) return;

  try {
    const [
      profileRes,
      tasksRes,
      completionsRes,
      scoresRes,
      auraLogsRes,
      workoutRes,
      pbRes,
      studySubjectsRes,
      studySessionsRes,
      metricsRes,
      macroConfigRes,
      goalsRes,
      projectsRes,
      projectSessionsRes,
      hobbiesRes,
      friendsRes,
      duelsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('task_completions').select('*').eq('user_id', userId),
      supabase.from('daily_scores').select('*').eq('user_id', userId),
      supabase.from('aura_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(90),
      supabase.from('workout_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(90),
      supabase.from('personal_bests').select('*').eq('user_id', userId).single(),
      supabase.from('study_subjects').select('*').eq('user_id', userId),
      supabase.from('study_sessions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(90),
      supabase.from('daily_metrics').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(90),
      supabase.from('macro_configs').select('*').eq('user_id', userId).single(),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('projects').select('*').eq('user_id', userId),
      supabase.from('project_sessions').select('*').eq('user_id', userId),
      supabase.from('hobbies').select('*').eq('user_id', userId),
      supabase.from('friends').select('*').eq('user_id', userId),
      supabase.from('duels').select('*').or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`),
    ]);

    const now = new Date().toISOString();

    // — Hydrate userStore
    if (profileRes.data) {
      const p = profileRes.data;
      useUserStore.getState().hydrateFromServer({
        profile: {
          name: p.username || 'Grinder',
          rank_tier: p.rank_tier || 'Normie',
          username: p.username,
        },
        lastSyncedAt: now,
      });
    }

    // — Hydrate auraStore
    if (profileRes.data) {
      const p = profileRes.data;
      const auraHistory = (auraLogsRes.data || []).map(row => ({
        date: row.date,
        net: row.net,
        earned: row.earned || 0,
        lost: row.lost || 0,
        multiplier: row.multiplier,
      }));

      const localAura = useAuraStore.getState();
      const serverNewer = !localAura.lastSyncedAt || new Date(p.updated_at) > new Date(localAura.lastSyncedAt);

      if (serverNewer) {
        useAuraStore.getState().hydrateFromServer({
          totalAuraPoints: p.total_aura_points,
          streakDays: p.current_streak,
          maxStreak: p.max_streak,
          multiplier: p.multiplier,
          auraHistory,
          lastSyncedAt: now,
        });
      }

      // Hydrate accumulated IQ/Knowledge from profile if available
      if (p.accumulated_iq != null || p.accumulated_knowledge != null) {
        const localStudy = useStudyStore.getState();
        useStudyStore.getState().hydrateFromServer({
          accumulatedIQ: Math.max(localStudy.accumulatedIQ || 0, p.accumulated_iq || 0),
          accumulatedKnowledge: Math.max(localStudy.accumulatedKnowledge || 0, p.accumulated_knowledge || 0),
        });
      }
    }

    // — Hydrate scoreStore
    if (scoresRes.data?.length) {
      const dailyScores = {};
      scoresRes.data.forEach(row => { dailyScores[row.date] = row.score; });
      const today = new Date().toISOString().split('T')[0];
      useScoreStore.getState().hydrateFromServer({
        dailyScores,
        todayScore: dailyScores[today] || 0,
        lastSyncedAt: now,
      });
    }

    // — Hydrate taskStore
    if (tasksRes.data) {
      const completions = {};
      (completionsRes.data || []).forEach(row => {
        if (!completions[row.task_id]) completions[row.task_id] = {};
        completions[row.task_id][row.date] = row.value;
      });

      const localTask = useTaskStore.getState();
      const serverHasTasks = tasksRes.data.length > 0;
      const localHasTasks = localTask.tasks.length > 0;

      if (serverHasTasks || !localHasTasks) {
        useTaskStore.getState().hydrateFromServer({
          tasks: tasksRes.data,
          completions,
          lastSyncedAt: now,
        });
      }
    }

    // — Hydrate workoutStore
    if (workoutRes.data?.length || pbRes.data) {
      const logs = {};
      (workoutRes.data || []).forEach(row => {
        logs[row.date] = { cardio: row.cardio || {}, ...(row.volume || {}) };
      });
      useWorkoutStore.getState().hydrateFromServer({
        logs,
        personalBests: pbRes.data?.data || {},
        lastSyncedAt: now,
      });
    }

    // — Hydrate studyStore
    // Only hydrate if server actually has data (empty array is NOT enough to trigger a wipe)
    if (studySubjectsRes.data?.length || studySessionsRes.data?.length) {
      const serverSessions = {};
      (studySessionsRes.data || []).forEach(row => {
        serverSessions[row.date] = row.data || {};
      });

      // Merge: preserve locally-logged sessions not yet on the server.
      // For dates present on both, keep the maximum minutes per subject
      // so a refresh never loses progress logged since the last sync.
      const localSessions = useStudyStore.getState().sessions;
      const mergedSessions = { ...serverSessions };
      Object.entries(localSessions).forEach(([date, localData]) => {
        if (!mergedSessions[date]) {
          mergedSessions[date] = localData;
        } else {
          const merged = { ...mergedSessions[date] };
          Object.entries(localData).forEach(([subId, mins]) => {
            merged[subId] = Math.max(merged[subId] || 0, mins);
          });
          mergedSessions[date] = merged;
        }
      });

      // Preserve accumulated IQ/Knowledge — take max of local vs server
      const localStudy = useStudyStore.getState();
      const serverIQ = studySessionsRes.data?.[0]?.accumulated_iq ?? 0;
      const serverKnowledge = studySessionsRes.data?.[0]?.accumulated_knowledge ?? 0;

      useStudyStore.getState().hydrateFromServer({
        subjects: studySubjectsRes.data?.length ? studySubjectsRes.data : localStudy.subjects,
        sessions: mergedSessions,
        accumulatedIQ: Math.max(localStudy.accumulatedIQ || 0, serverIQ),
        accumulatedKnowledge: Math.max(localStudy.accumulatedKnowledge || 0, serverKnowledge),
        lastSyncedAt: now,
      });
    }

    // — Hydrate metricsStore
    if (metricsRes.data?.length || macroConfigRes.data) {
      const localMetrics = useMetricsStore.getState().dailyMetrics;
      const dailyMetrics = {};
      (metricsRes.data || []).forEach(row => {
        // If server has no micros for this date, preserve whatever is stored locally
        // so that a background pullAllData never wipes locally-entered micro values.
        const serverMicros = row.micros && Object.keys(row.micros).length > 0
          ? row.micros
          : (localMetrics[row.date]?.micros || {});
        dailyMetrics[row.date] = {
          sleep: row.sleep,
          deepSleep: row.deep_sleep,
          mood: row.mood,
          moodNote: row.mood_note || undefined,
          macros: row.macros || {},
          micros: serverMicros,
        };
      });
      // Preserve local-only dates (not yet on server) so they are not wiped
      Object.keys(localMetrics).forEach(date => {
        if (!dailyMetrics[date]) {
          dailyMetrics[date] = localMetrics[date];
        }
      });
      useMetricsStore.getState().hydrateFromServer({
        dailyMetrics,
        customMacros: macroConfigRes.data?.macros || useMetricsStore.getState().customMacros,
        lastSyncedAt: now,
      });
    }

    // — Hydrate assetStores (goals, projects, hobbies)
    // Merge strategy: combine server + local data, deduplicate by ID,
    // prefer server version when both exist (server is source of truth).
    // Local-only items (not yet synced) are preserved.

    // Helper: merge arrays by id, server takes precedence on conflicts
    const mergeById = (serverArr, localArr) => {
      const serverIds = new Set((serverArr || []).map(item => item.id));
      const localOnly = (localArr || []).filter(item => !serverIds.has(item.id));
      return [...(serverArr || []), ...localOnly];
    };

    {
      const serverGoals = goalsRes.data || [];
      const localGoalState = useGoalStore.getState();
      const serverActive = serverGoals.filter(g => !g.completed && !g.archived);
      const serverHistory = serverGoals.filter(g => g.completed || g.archived);
      useGoalStore.getState().hydrateFromServer({
        goals: mergeById(serverActive, localGoalState.goals),
        goalsHistory: mergeById(serverHistory, localGoalState.goalsHistory),
        lastSyncedAt: now,
      });
    }

    {
      const serverProjects = projectsRes.data || [];
      const localProjectState = useProjectStore.getState();
      const serverActive = serverProjects.filter(p => !p.archived);
      const serverHistory = serverProjects.filter(p => p.archived);
      useProjectStore.getState().hydrateFromServer({
        projects: mergeById(serverActive, localProjectState.projects),
        projectsHistory: mergeById(serverHistory, localProjectState.projectsHistory),
        sessions: mergeById(projectSessionsRes.data || [], localProjectState.sessions),
        lastSyncedAt: now,
      });
    }

    {
      const serverHobbies = hobbiesRes.data || [];
      const localHobbyState = useHobbyStore.getState();
      const serverActive = serverHobbies.filter(h => !h.archived);
      const serverHistory = serverHobbies.filter(h => h.archived);
      useHobbyStore.getState().hydrateFromServer({
        hobbies: mergeById(serverActive, localHobbyState.hobbies),
        hobbiesHistory: mergeById(serverHistory, localHobbyState.hobbiesHistory),
        lastSyncedAt: now,
      });
    }

    // — Hydrate socialStore
    useSocialStore.getState().hydrateFromServer({
      friends: friendsRes.data || [],
      duels: duelsRes.data || [],
      lastSyncedAt: now,
    });

    // Flush any queued offline mutations after hydration
    flushQueue();

  } catch (err) {
    console.error('[syncEngine] pullAllData error:', err);
  }
}

// ─────────────────────────────────────────────
// seedServerFromLocal — first-login migration
// Push all existing localStorage data to Supabase
// ─────────────────────────────────────────────
export async function seedServerFromLocal(userId) {
  if (!userId || !supabase) return;

  const taskState = useTaskStore.getState();
  const auraState = useAuraStore.getState();
  const scoreState = useScoreStore.getState();
  const goalState = useGoalStore.getState();
  const projectState = useProjectStore.getState();
  const hobbyState = useHobbyStore.getState();
  const studyState = useStudyStore.getState();

  const ops = [];

  // Push profile with multiplier, streak, and neural stats
  ops.push(supabase.from('profiles').upsert({
    id: userId,
    total_aura_points: auraState.totalAuraPoints,
    current_streak: auraState.streakDays,
    max_streak: auraState.maxStreak,
    multiplier: auraState.multiplier,
    accumulated_iq: studyState.accumulatedIQ || 0,
    accumulated_knowledge: studyState.accumulatedKnowledge || 0,
  }, { onConflict: 'id' }));

  // Push tasks
  taskState.tasks.forEach(task => {
    ops.push(supabase.from('tasks').upsert({ ...task, user_id: userId }, { onConflict: 'id' }));
  });

  // Push completions
  Object.entries(taskState.completions).forEach(([taskId, dates]) => {
    Object.entries(dates).forEach(([date, value]) => {
      ops.push(supabase.from('task_completions').upsert(
        { task_id: taskId, user_id: userId, date, value },
        { onConflict: 'task_id,date' }
      ));
    });
  });

  // Push daily scores
  Object.entries(scoreState.dailyScores).forEach(([date, score]) => {
    ops.push(supabase.from('daily_scores').upsert(
      { user_id: userId, date, score },
      { onConflict: 'user_id,date' }
    ));
  });

  // Push aura history
  auraState.auraHistory.forEach(entry => {
    ops.push(supabase.from('aura_logs').upsert(
      { user_id: userId, date: entry.date, earned: Math.max(0, entry.net), lost: Math.max(0, -entry.net), multiplier: entry.multiplier || 1.0 },
      { onConflict: 'user_id,date' }
    ));
  });

  // Push goals
  goalState.goals.forEach(g => {
    ops.push(supabase.from('goals').upsert({ ...g, user_id: userId }, { onConflict: 'user_id,id' }));
  });

  // Push projects
  projectState.projects.forEach(p => {
    ops.push(supabase.from('projects').upsert({ ...p, user_id: userId }, { onConflict: 'user_id,id' }));
  });

  // Push hobbies
  hobbyState.hobbies.forEach(h => {
    ops.push(supabase.from('hobbies').upsert({ ...h, user_id: userId }, { onConflict: 'user_id,id' }));
  });

  await Promise.allSettled(ops);
}
