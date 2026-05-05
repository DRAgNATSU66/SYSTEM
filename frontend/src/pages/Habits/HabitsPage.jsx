import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useHobbyStore } from '../../store/assetStores';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { hobbyService } from '../../services/hobbyService';
import { supabase } from '../../services/supabaseClient';
import { pushChange } from '../../services/syncEngine';
import HobbyForm from './HobbyForm';
import HistoryModal from '../../components/ui/HistoryModal/HistoryModal';
import styles from './Habits.module.css';

const HabitsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { hobbies, hobbiesHistory, deleteHobby, archiveHobby } = useHobbyStore();
  const { addCategoryAP, checkAndUpdateStreak, resetDailyIfNeeded } = useAuraStore();
  const { user } = useUserStore();

  // Per-hobby timers: { [hobbyId]: startMs }
  const [activeTimers, setActiveTimers] = useState({});
  const [elapsed, setElapsed] = useState({});           // { [hobbyId]: seconds }
  const [hobbySessions, setHobbySessions] = useState({}); // { [hobbyId]: [session] }
  const timerRef = useRef(null);

  // Tick active timers every second
  useEffect(() => {
    if (!Object.keys(activeTimers).length) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const now = Date.now();
        const updated = { ...prev };
        Object.entries(activeTimers).forEach(([id, startMs]) => {
          updated[id] = Math.floor((now - startMs) / 1000);
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeTimers]);

  // Load last 5 sessions per hobby from server on mount
  useEffect(() => {
    if (!supabase || !user?.id) return;
    supabase.from('hobby_sessions').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (!data) return;
        const grouped = {};
        data.forEach(s => {
          if (!grouped[s.hobby_id]) grouped[s.hobby_id] = [];
          if (grouped[s.hobby_id].length < 5) grouped[s.hobby_id].push(s);
        });
        setHobbySessions(grouped);
      });
  }, [user?.id]);

  const handleStartTimer = (hobby) => {
    setActiveTimers(prev => ({ ...prev, [hobby.id]: Date.now() }));
    setElapsed(prev => ({ ...prev, [hobby.id]: 0 }));
  };

  const handleStopTimer = (hobby) => {
    const startMs = activeTimers[hobby.id];
    if (!startMs) return;
    const totalSecs = Math.max(60, Math.floor((Date.now() - startMs) / 1000));
    const minutes = Math.round(totalSecs / 60);
    const ap = 150 + Math.max(0, Math.floor((minutes - 30) / 30)) * 50;

    resetDailyIfNeeded();
    addCategoryAP('MISC', ap, `HOBBY SESSION: ${hobby.title} ${minutes}m`);
    checkAndUpdateStreak();

    const session = {
      id: crypto.randomUUID(),
      user_id: user?.id,
      hobby_id: hobby.id,
      hobby_name: hobby.title,
      type: hobby.type,
      categories: hobby.categories,
      duration_minutes: minutes,
      ap_earned: ap,
      date: new Date().toISOString().split('T')[0],
    };

    if (user?.id) pushChange('hobby_sessions', 'INSERT', session);

    setHobbySessions(prev => ({
      ...prev,
      [hobby.id]: [session, ...(prev[hobby.id] || [])].slice(0, 5),
    }));
    setActiveTimers(prev => { const n = { ...prev }; delete n[hobby.id]; return n; });
    setElapsed(prev => { const n = { ...prev }; delete n[hobby.id]; return n; });
  };

  const [manualMins, setManualMins] = useState({});

  const handleManualLog = (hobby) => {
    const mins = Math.min(480, Math.max(1, parseInt(manualMins[hobby.id]) || 0));
    if (!mins) return;
    const ap = 150 + Math.max(0, Math.floor((mins - 30) / 30)) * 50;
    resetDailyIfNeeded();
    addCategoryAP('MISC', ap, `HOBBY SESSION: ${hobby.title} ${mins}m`);
    checkAndUpdateStreak();
    const session = {
      id: crypto.randomUUID(), user_id: user?.id, hobby_id: hobby.id, hobby_name: hobby.title,
      type: hobby.type, categories: hobby.categories, duration_minutes: mins, ap_earned: ap,
      date: new Date().toISOString().split('T')[0],
    };
    if (user?.id) pushChange('hobby_sessions', 'INSERT', session);
    setHobbySessions(prev => ({ ...prev, [hobby.id]: [session, ...(prev[hobby.id] || [])].slice(0, 5) }));
    setManualMins(prev => ({ ...prev, [hobby.id]: '' }));
  };

  const fmtElapsed = (secs) => `${String(Math.floor(secs / 60)).padStart(2,'0')}:${String(secs % 60).padStart(2,'0')}`;

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1>NEURAL RECREATION</h1>
            <p className={styles.subtitle}>Categorized high-performance leisure vectors.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnAdd} onClick={() => setShowForm(true)}>+ NEW HOBBY</button>
            <button className={styles.btnHistory} onClick={() => setShowHistory(true)}>HISTORY</button>
          </div>
        </div>
      </div>
      
      <div className={styles.list}>
        {hobbies.length === 0 && <p className={styles.empty}>No hobbies initialized. Balance is critical.</p>}
        {hobbies.map(h => {
          const isActive = !!activeTimers[h.id];
          const secs = elapsed[h.id] || 0;
          const sessions = hobbySessions[h.id] || [];
          return (
            <div key={h.id} className={styles.item} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className={styles.info} style={{ flex: 1 }}>
                  <h3>{h.title}</h3>
                  <div className={styles.tags}>
                    <span className={`${styles.tag} ${styles.typeTag}`}>{h.type}</span>
                    {h.categories.map(cat => (
                      <span key={cat} className={`${styles.tag} ${styles.catTag}`}>{cat}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.actions}>
                  {isActive ? (
                    <>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--rank-alpha)', letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums' }}>{fmtElapsed(secs)}</span>
                      <button className={styles.btnLog} onClick={() => handleStopTimer(h)} style={{ background: 'rgba(34,197,94,0.18)', borderColor: 'rgba(34,197,94,0.4)', color: 'var(--color-green)' }}>STOP</button>
                    </>
                  ) : (
                    <>
                      <button className={styles.btnLog} onClick={() => handleStartTimer(h)}>START</button>
                      <input
                        type="number" min="1" max="480" placeholder="min"
                        value={manualMins[h.id] || ''}
                        onChange={e => setManualMins(prev => ({ ...prev, [h.id]: e.target.value }))}
                        style={{ width: 52, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: '0.75rem', padding: '0.4rem 0.4rem', textAlign: 'center', fontFamily: 'inherit', colorScheme: 'dark' }}
                      />
                      <button className={styles.btnLog} onClick={() => handleManualLog(h)} style={{ fontSize: '0.65rem' }}>LOG</button>
                    </>
                  )}
                  <button className={styles.btnArchive} onClick={() => {
                    archiveHobby(h.id);
                    if (user?.id) hobbyService.archiveHobby(user.id, h.id);
                  }}>ARCHIVE</button>
                  <button className={styles.btnDelete} onClick={() => {
                    deleteHobby(h.id);
                    if (user?.id) hobbyService.deleteHobby(user.id, h.id);
                  }}>×</button>
                </div>
              </div>
              {sessions.length > 0 && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                      <span>{s.date}</span>
                      <span>{s.duration_minutes}m</span>
                      <span style={{ color: 'var(--rank-alpha)' }}>+{s.ap_earned} AP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && <HobbyForm onClose={() => setShowForm(false)} />}
      
      {showHistory && (
        <HistoryModal 
          title="HOBBIES" 
          items={hobbiesHistory} 
          type="hobby"
          onClose={() => setShowHistory(false)} 
          onDelete={(id) => {
            if (user?.id) hobbyService.deleteHobby(user.id, id, true);
            else deleteHobby(id, true);
          }}
        />
      )}
    </PageWrapper>
  );
};

export default HabitsPage;
