import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useGoalStore } from '../../store/assetStores';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { goalService } from '../../services/goalService';
import { pushChange } from '../../services/syncEngine';
import HistoryModal from '../../components/ui/HistoryModal/HistoryModal';
import { rgbVar } from '../../theme/palette';
import styles from './Goals.module.css';

const today = new Date().toISOString().split('T')[0];
const defaultTarget = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const GoalsPage = () => {
  const { goals, goalsHistory, addGoal, completeGoal, purgeGoal, deleteFromHistory, updateGoal, retryGoal } = useGoalStore();
  const { addCategoryAP, checkAndUpdateStreak, resetDailyIfNeeded } = useAuraStore();
  const { user } = useUserStore();
  const [newTitle, setNewTitle] = useState('');
  const [targetDate, setTargetDate] = useState(defaultTarget);
  const [showHistory, setShowHistory] = useState(false);
  const [retryId, setRetryId] = useState(null);
  const [retryDate, setRetryDate] = useState(defaultTarget);

  // Apply one-time overdue penalty for newly-overdue goals
  useEffect(() => {
    goals.forEach(goal => {
      if (goal.completed || goal.overdue_penalty_applied) return;
      if (!goal.target_date || goal.target_date >= today) return;
      const penalty = Math.min(Math.floor((goal.bounty_ap || 0) * 0.10), 500);
      if (penalty > 0) {
        useAuraStore.setState(state => ({
          totalAuraPoints: Math.max(0, state.totalAuraPoints - penalty),
          todayLost: state.todayLost + penalty,
          auraHistory: [...state.auraHistory, { date: today, net: -penalty, reason: `OVERDUE PENALTY: ${goal.title}` }].slice(-180),
        }));
      }
      updateGoal(goal.id, { overdue_penalty_applied: true });
      if (user?.id) pushChange('goals', 'UPSERT', { id: goal.id, user_id: user.id, overdue_penalty_applied: true });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals.length]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addGoal(newTitle.trim(), targetDate, 5000, true); // always update local store
    if (user?.id) goalService.addGoal(user.id, newTitle.trim(), targetDate, 5000, true);
    setNewTitle('');
    setTargetDate(defaultTarget);
  };

  const handleComplete = (id, title, bounty_ap) => {
    resetDailyIfNeeded();
    completeGoal(id); // always update local store
    if (user?.id) goalService.completeGoal(user.id, id);
    addCategoryAP('MISC', bounty_ap, `ACHIEVEMENT: ${title}`);
    checkAndUpdateStreak();
  };

  const handleRetry = (id) => {
    retryGoal(id, retryDate);
    if (user?.id) pushChange('goals', 'UPSERT', {
      id,
      user_id: user.id,
      target_date: retryDate,
      overdue_penalty_applied: false,
    });
    setRetryId(null);
  };

  const isOverdue = (goal) => !goal.completed && goal.target_date && goal.target_date < today;
  const daysLeft  = (target) => Math.ceil((new Date(target) - new Date()) / 86400000);

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1>STRATEGIC MILESTONES</h1>
          <p>Set long-term targets to unlock massive Aura Bounties.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className={styles.addForm}>
        <input
          type="text" value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New milestone..."
          className={styles.input}
          maxLength={120}
        />
        <input
          type="date" value={targetDate}
          onChange={e => setTargetDate(e.target.value)}
          min={today}
          className={styles.dateInput}
        />
        <button type="submit" className={styles.btnAdd}>SET TARGET</button>
        <button type="button" className={styles.btnHistory} onClick={() => setShowHistory(true)}>HISTORY</button>
      </form>

      <div className={styles.grid}>
        {goals.map(goal => {
          const overdue = isOverdue(goal);
          const left = goal.target_date ? daysLeft(goal.target_date) : null;
          return (
            <div key={goal.id} className={`${styles.card} ${goal.completed ? styles.completed : ''}`}
              style={{ borderColor: overdue ? rgbVar('--rank-slacking-rgb', 0.5) : undefined }}>
              {overdue && (
                <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--color-red)', marginBottom: '0.5rem' }}>
                  ⚠ OVERDUE {goal.overdue_penalty_applied ? `(-${Math.min(Math.floor((goal.bounty_ap||0)*0.1),500)} AP applied)` : ''}
                </div>
              )}
              <h3>{goal.title}</h3>
              <div className={styles.bounty}>{(goal.bounty_ap || 0).toLocaleString()} AP BOUNTY
                {goal.retry_count > 0 && <span style={{ fontSize:'0.55rem', color:'var(--text-secondary)', marginLeft:'0.4rem' }}>RETRY #{goal.retry_count}</span>}
              </div>
              {goal.target_date && !goal.completed && (
                <div style={{ fontSize: '0.62rem', color: overdue ? 'var(--color-red)' : 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.06em' }}>
                  {overdue ? `${Math.abs(left)} days overdue` : `${left} days left · ${goal.target_date}`}
                </div>
              )}
              {!goal.completed && (
                <button onClick={() => handleComplete(goal.id, goal.title, goal.bounty_ap)} className={styles.btnComplete}>
                  TARGET ACHIEVED
                </button>
              )}
              {overdue && retryId !== goal.id && (
                <button onClick={() => { setRetryId(goal.id); setRetryDate(defaultTarget); }}
                  style={{ display:'block', width:'100%', marginTop:'0.5rem', padding:'0.45rem', background:rgbVar('--rank-sigma-rgb', 0.1), border:`1px solid ${rgbVar('--rank-sigma-rgb', 0.3)}`, borderRadius:10, color:'var(--rank-sigma)', fontWeight:800, fontSize:'0.68rem', letterSpacing:'0.1em', cursor:'pointer' }}>
                  RETRY (BOUNTY HALVED)
                </button>
              )}
              {retryId === goal.id && (
                <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.5rem', flexWrap:'wrap' }}>
                  <input type="date" value={retryDate} onChange={e => setRetryDate(e.target.value)} min={today}
                    className={styles.dateInput} style={{ flex:1, fontSize:'0.72rem' }} />
                  <button onClick={() => handleRetry(goal.id)}
                    style={{ padding:'0.3rem 0.75rem', background:rgbVar('--rank-sigma-rgb', 0.15), border:`1px solid ${rgbVar('--rank-sigma-rgb', 0.4)}`, color:'var(--rank-sigma)', fontWeight:800, fontSize:'0.65rem', borderRadius:8, cursor:'pointer' }}>CONFIRM</button>
                  <button onClick={() => setRetryId(null)}
                    style={{ padding:'0.3rem 0.6rem', background:'transparent', border:`1px solid ${rgbVar('--fg-rgb', 0.15)}`, color:'var(--text-secondary)', fontSize:'0.65rem', borderRadius:8, cursor:'pointer' }}>✕</button>
                </div>
              )}
              <button onClick={() => {
                purgeGoal(goal.id);
                if (user?.id) goalService.deleteGoal(user.id, goal.id);
              }} className={styles.btnDelete}>PURGE</button>
            </div>
          );
        })}
      </div>

      {showHistory && (
        <HistoryModal
          title="GOALS"
          items={goalsHistory}
          type="goal"
          onClose={() => setShowHistory(false)}
          onDelete={deleteFromHistory}
        />
      )}
    </PageWrapper>
  );
};

export default GoalsPage;
