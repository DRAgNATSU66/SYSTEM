import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useGoalStore } from '../../store/assetStores';
import { useAuraStore } from '../../store/auraStore';
import HistoryModal from '../../components/ui/HistoryModal/HistoryModal';
import styles from './Goals.module.css';

const GoalsPage = () => {
  const { goals, goalsHistory, addGoal, completeGoal, deleteGoal, deleteFromHistory } = useGoalStore();
  const addAuraPoints = useAuraStore(state => state.addAuraPoints);
  const [newTitle, setNewTitle] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if(!newTitle) return;
    addGoal(newTitle, '2026-12-31', 5000, true); 
    setNewTitle('');
  };

  const handleComplete = (id, title, bounty_ap) => {
    completeGoal(id);
    addAuraPoints(bounty_ap, `Achievement: ${title}`);
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1>STRATEGIC MILESTONES</h1>
          <p>Set long-term targets to unlock massive Aura Bounties.</p>
        </div>
      </header>

      <form onSubmit={handleAdd} className={styles.addForm}>
        <input 
          type="text" value={newTitle} 
          onChange={e => setNewTitle(e.target.value)} 
          placeholder="New milestone..." 
          className={styles.input}
        />
        <button type="submit" className={styles.btnAdd}>SET TARGET</button>
        <button type="button" className={styles.btnHistory} onClick={() => setShowHistory(true)}>HISTORY</button>
      </form>

      <div className={styles.grid}>
        {goals.map(goal => (
          <div key={goal.id} className={`${styles.card} ${goal.completed ? styles.completed : ''}`}>
            <h3>{goal.title}</h3>
            <div className={styles.bounty}>{goal.bounty} AP BOUNTY</div>
            {!goal.completed && (
              <button 
                onClick={() => handleComplete(goal.id, goal.title, goal.bounty)} 
                className={styles.btnComplete}
              >
                TARGET ACHIEVED
              </button>
            )}
            <button onClick={() => deleteGoal(goal.id)} className={styles.btnDelete}>PURGE</button>
          </div>
        ))}
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
