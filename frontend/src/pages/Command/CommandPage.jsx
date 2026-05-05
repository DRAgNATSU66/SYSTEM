import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import PulseCore from '../../components/ui/PulseCore/PulseCore';
import { useCommandStore } from '../../store/commandStore';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { useScoreStore } from '../../store/scoreStore';
import { useTaskStore } from '../../store/taskStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { useStudyStore } from '../../store/studyStore';
import { useMetricsStore } from '../../store/metricsStore';
import { useGoalStore, useProjectStore, useHobbyStore } from '../../store/assetStores';
import { useSocialStore } from '../../store/socialStore';
import { supabase } from '../../services/supabaseClient';
import styles from './Command.module.css';

const HF_AGENT = 'https://DRAgNATSU66-system-agent.hf.space';
const KNOWN_CMDS = ['critique','status','commend','reward','redeem','complete','timer','help','clear'];

const CommandPage = () => {
  const { history, processCommand, addEntry, updateEntry } = useCommandStore();
  const { dailyScore, rankTitle } = useScoreStore();
  const { totalAuraPoints, auraHistory, penaltyLog, streakDays, multiplier, todayEarned, todayLost, dailyCategoryAP } = useAuraStore();
  const { profile, user } = useUserStore();
  const [input, setInput]         = useState('');
  const [streaming, setStreaming]  = useState(false);
  const logEndRef     = useRef(null);
  const typeQueue     = useRef([]);
  const typedSoFar    = useRef('');
  const typeInterval  = useRef(null);
  const activeEntryId = useRef(null);
  const chatHistory   = useRef([]); // multi-turn memory

  // Typewriter engine — 20ms per character
  const startTyper = (entryId) => {
    activeEntryId.current = entryId;
    if (typeInterval.current) return;
    typeInterval.current = setInterval(() => {
      const char = typeQueue.current.shift();
      if (char === undefined) return;
      typedSoFar.current += char;
      useCommandStore.getState().updateEntry(
        activeEntryId.current,
        typedSoFar.current + (typeQueue.current.length > 0 ? '▋' : '')
      );
    }, 20);
  };

  const drainAndStop = (finalText) => {
    const drain = setInterval(() => {
      if (typeQueue.current.length === 0) {
        clearInterval(drain);
        clearInterval(typeInterval.current);
        typeInterval.current = null;
        useCommandStore.getState().updateEntry(activeEntryId.current, typedSoFar.current);
        // Save to conversation history for multi-turn context
        chatHistory.current.push({ role: 'assistant', content: finalText });
        if (chatHistory.current.length > 12) chatHistory.current = chatHistory.current.slice(-12);
        setStreaming(false);
      }
    }, 20);
  };

  useEffect(() => () => { clearInterval(typeInterval.current); }, []);

  useEffect(() => {
    if (history.length <= 3) {
      const stats = [
        { type: 'permanent', label: 'USER_BIOMETRIC_AUTH:', value: 'SUCCESS', valColor: '#00FF41' },
        { type: 'permanent', label: 'PLAYER_IDENTIFIED_:', value: profile.profile_name || 'NATSU', valColor: '#D300C5' },
        { type: 'permanent', label: 'PLAYER_LVL:', value: profile.rank_tier || 'SIGMA', valColor: '#00BFFF' },
        { type: 'permanent', label: 'CURRENT_PLAYER_AP:', value: totalAuraPoints, valColor: 'var(--rank-alpha)' },
        { type: 'permanent', label: 'LIFETIME_PLAYER_AP_EARNED:', value: auraHistory.reduce((acc, h) => acc + (h.net > 0 ? h.net : 0), 0), valColor: '#FFD700' },
        { type: 'permanent', label: 'AP_SPENT:', value: Math.abs(auraHistory.reduce((acc, h) => acc + (h.net < 0 ? h.net : 0), 0)), valColor: '#FF3131' },
        { type: 'permanent', label: 'PENALTIES_COUNT:', value: penaltyLog.length, valColor: '#FF3131' },
      ];
      stats.forEach((s, i) => setTimeout(() => addEntry(s), (i + 1) * 100));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const buildUserContext = () => {
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date();

    // Pull latest state from all stores
    const taskState    = useTaskStore.getState();
    const workoutState = useWorkoutStore.getState();
    const studyState   = useStudyStore.getState();
    const metricsState = useMetricsStore.getState();
    const goalState    = useGoalStore.getState();
    const projectState = useProjectStore.getState();
    const hobbyState   = useHobbyStore.getState();
    const socialState  = useSocialStore.getState();

    const todayMetrics = metricsState.dailyMetrics[today] || {};
    const todayStudy   = studyState.sessions[today] || {};
    const todayCatAP   = dailyCategoryAP[today] || {};
    const todayTasks   = taskState.tasks.map(t => ({
      title: t.title || t.name,
      completed: !!(taskState.completions[t.id]?.[today]),
    }));

    return {
      // Identity
      ai_name:      'CORE',
      today_date:   now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      current_time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),

      // Player
      player_name:      profile.name || profile.username || 'NATSU',
      total_ap:         totalAuraPoints,
      streak_days:      streakDays,
      multiplier:       parseFloat(multiplier.toFixed(2)),
      rank:             rankTitle || profile.rank_tier || 'Normie',
      today_score:      dailyScore || 0,
      today_earned:     todayEarned,
      today_lost:       todayLost,
      today_net:        todayEarned - todayLost,
      lifetime_earned:  auraHistory.reduce((a, h) => a + (h.net > 0 ? h.net : 0), 0),

      // Today AP by category
      today_ap_breakdown: {
        WORKOUT:   todayCatAP.WORKOUT   || 0,
        STUDY:     todayCatAP.STUDY     || 0,
        SLEEP:     todayCatAP.SLEEP     || 0,
        MOOD:      todayCatAP.MOOD      || 0,
        NUTRITION: todayCatAP.NUTRITION || 0,
        MISC:      todayCatAP.MISC      || 0,
      },

      // Tasks
      tasks: todayTasks,
      tasks_completed_today: todayTasks.filter(t => t.completed).length,
      tasks_total: todayTasks.length,

      // Workout
      workout_today_logged: Object.keys(workoutState.logs[today] || {}).length > 0,
      personal_bests: Object.entries(workoutState.personalBests || {}).reduce((acc, [group, subs]) => {
        acc[group] = subs; return acc;
      }, {}),

      // Study
      study_subjects: (studyState.subjects || []).map(s => ({
        name: s.name,
        today_minutes: todayStudy[s.id] || 0,
      })),
      study_total_minutes_today: Object.values(todayStudy).reduce((a, b) => a + b, 0),

      // Sleep & Mood
      sleep_hours_today:   todayMetrics.sleep     ?? null,
      deep_sleep_today:    todayMetrics.deepSleep  ?? null,
      mood_today:          todayMetrics.mood       ?? null,
      mood_note_today:     todayMetrics.moodNote   ?? null,

      // Nutrition
      macros_logged_today: Object.keys(todayMetrics.macros || {}).length,
      micros_logged_today: Object.keys(todayMetrics.micros || {}).length,
      macro_values_today:  todayMetrics.macros || {},
      macro_targets:       metricsState.customMacros?.map(m => ({ name: m.name, target: m.minLimit, unit: m.unit })) || [],

      // Goals
      active_goals: goalState.goals.filter(g => !g.completed).map(g => ({
        title:       g.title,
        target_date: g.target_date,
        bounty_ap:   g.bounty_ap,
        overdue:     g.target_date < today,
        retry_count: g.retry_count || 0,
      })),
      completed_goals_count: goalState.goalsHistory.filter(g => g.status === 'COMPLETED').length,

      // Projects
      active_projects: projectState.projects.map(p => ({
        title:       p.title,
        type:        p.type,
        status:      p.status,
        total_hours: p.total_hours || 0,
      })),

      // Hobbies
      hobbies: hobbyState.hobbies.map(h => ({
        title:      h.title,
        type:       h.type,
        categories: h.categories,
      })),

      // Social / Duels
      friends_count:  socialState.friends.filter(f => !f.status || f.status === 'accepted').length,
      active_duels:   socialState.duels.filter(d => d.state === 'active').map(d => ({
        opponent:   d.opponent_name || d.challenger_name || 'Unknown',
        stake_ap:   d.stake_ap,
        match_type: d.match_type,
        end_at:     d.end_at,
      })),
      pending_duels: socialState.duels.filter(d => d.state === 'pending').length,

      // Recent AP history (last 7 days)
      recent_aura_history: auraHistory.slice(-15).map(h => ({
        date:   h.date,
        net:    h.net,
        reason: h.reason,
      })),
    };
  };

  const callCore = async (message) => {
    if (!user?.id) {
      addEntry({ type: 'ai', text: 'ERROR: NOT_AUTHENTICATED. SIGN IN TO USE CORE AI.' });
      return;
    }

    setStreaming(true);
    const entryId = crypto.randomUUID();
    typeQueue.current   = [];
    typedSoFar.current  = '';
    typeInterval.current && clearInterval(typeInterval.current);
    typeInterval.current = null;
    addEntry({ type: 'ai', text: 'CORE . . . ▋', id: entryId });
    startTyper(entryId);

    // Add to conversation history
    chatHistory.current.push({ role: 'user', content: message });

    const userContext = buildUserContext();

    let authToken = '';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      authToken = session?.access_token || '';
    } catch {}

    let full = '';
    try {
      const res = await fetch(`${HF_AGENT}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': authToken },
        body: JSON.stringify({
          user_id: user.id,
          user_context: userContext,
          messages: chatHistory.current.slice(-12), // last 6 turns
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        useCommandStore.getState().updateEntry(entryId, `ERROR: ${err.detail || 'REQUEST_FAILED'}`);
        setStreaming(false);
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') break;
          try {
            const chunk = JSON.parse(raw);
            if (chunk.error) {
              useCommandStore.getState().updateEntry(entryId, `ERROR: ${chunk.error}`);
              setStreaming(false);
              return;
            }
            if (chunk.content) {
              full += chunk.content;
              for (const c of chunk.content) typeQueue.current.push(c);
            }
          } catch {}
        }
      }

      if (!full) {
        useCommandStore.getState().updateEntry(entryId, 'NO_RESPONSE.');
        setStreaming(false);
      } else {
        drainAndStop(full);
      }
    } catch (err) {
      useCommandStore.getState().updateEntry(entryId, `CONNECTION_ERROR: ${err.message}`);
      setStreaming(false);
    }
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    const cmd = input.toLowerCase().trim();
    const isKnown = KNOWN_CMDS.some(c => cmd === c || cmd.startsWith(c + ' '));
    if (isKnown) {
      processCommand(input, dailyScore, rankTitle);
    } else {
      addEntry({ type: 'user', text: '> ' + input.toUpperCase() });
      callCore(input);
    }
    setInput('');
  };

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.visualStack}>
        <PulseCore />
        <div className={styles.status}>{streaming ? 'CORE ACTIVE' : 'CORE ACTIVE'}</div>
      </div>

      <div className={styles.terminal}>
        <div className={styles.log}>
          {history.map(log => (
            <div key={log.id} className={styles[log.type]}>
              {log.type === 'permanent' ? (
                <>
                  <span className={styles.label}>{log.label}</span>
                  <span style={{ color: log.valColor, marginLeft: '0.5rem' }}>{log.value}</span>
                </>
              ) : (
                log.text
              )}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        <form onSubmit={handleCommand} className={styles.commandForm}>
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={streaming ? 'CORE RESPONDING...' : 'EXECUTE COMMAND OR ASK CORE...'}
            className={styles.numInput}
            disabled={streaming}
            autoFocus
          />
        </form>
      </div>
    </PageWrapper>
  );
};

export default CommandPage;
