import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import PulseCore from '../../components/ui/PulseCore/PulseCore';
import { useCommandStore } from '../../store/commandStore';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { useScoreStore } from '../../store/scoreStore';
import { supabase } from '../../services/supabaseClient';
import styles from './Command.module.css';

const HF_AGENT = 'https://DRAgNATSU66-system-agent.hf.space';
const KNOWN_CMDS = ['critique','status','commend','reward','redeem','complete','timer','help','clear'];

const CommandPage = () => {
  const { history, processCommand, addEntry, updateEntry } = useCommandStore();
  const { dailyScore, rankTitle } = useScoreStore();
  const { totalAuraPoints, auraHistory, penaltyLog, streakDays, multiplier, todayEarned, todayLost } = useAuraStore();
  const { profile, user } = useUserStore();
  const [input, setInput]       = useState('');
  const [streaming, setStreaming] = useState(false);
  const logEndRef = useRef(null);

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

  const callCipher = async (message) => {
    if (!user?.id) {
      addEntry({ type: 'ai', text: 'ERROR: NOT_AUTHENTICATED. SIGN IN TO USE CIPHER AI.' });
      return;
    }

    setStreaming(true);
    const entryId = crypto.randomUUID();
    addEntry({ type: 'ai', text: 'CIPHER . . . ▋', id: entryId });

    const userContext = {
      total_ap: totalAuraPoints,
      streak: streakDays,
      multiplier,
      rank: rankTitle || profile.rank_tier,
      todayEarned,
      todayLost,
      lifetime_earned: auraHistory.reduce((a, h) => a + (h.net > 0 ? h.net : 0), 0),
    };

    let authToken = '';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      authToken = session?.access_token || '';
    } catch {}

    try {
      const res = await fetch(`${HF_AGENT}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': authToken },
        body: JSON.stringify({ user_id: user.id, user_context: userContext, messages: [{ role: 'user', content: message }] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        useCommandStore.getState().updateEntry(entryId, `ERROR: ${err.detail || 'REQUEST_FAILED'}`);
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

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
            if (chunk.error) { useCommandStore.getState().updateEntry(entryId, `ERROR: ${chunk.error}`); return; }
            if (chunk.content) { full += chunk.content; useCommandStore.getState().updateEntry(entryId, full + ' ▋'); }
          } catch {}
        }
      }

      useCommandStore.getState().updateEntry(entryId, full || 'NO_RESPONSE.');
    } catch (err) {
      useCommandStore.getState().updateEntry(entryId, `CONNECTION_ERROR: ${err.message}`);
    } finally {
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
      callCipher(input);
    }
    setInput('');
  };

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.visualStack}>
        <PulseCore />
        <div className={styles.status}>{streaming ? 'CIPHER ACTIVE' : 'CORE ACTIVE'}</div>
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
            placeholder={streaming ? 'CIPHER RESPONDING...' : 'EXECUTE COMMAND OR ASK CIPHER...'}
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
