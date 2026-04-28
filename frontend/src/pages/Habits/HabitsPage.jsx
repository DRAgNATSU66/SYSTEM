import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useHobbyStore } from '../../store/assetStores';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { hobbyService } from '../../services/hobbyService';
import HobbyForm from './HobbyForm';
import HistoryModal from '../../components/ui/HistoryModal/HistoryModal';
import styles from './Habits.module.css';

const HabitsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { hobbies, hobbiesHistory, deleteHobby, archiveHobby } = useHobbyStore();
  const { addCategoryAP, checkAndUpdateStreak, resetDailyIfNeeded } = useAuraStore();
  const { user } = useUserStore();

  const handleLogHobby = (hobby) => {
    resetDailyIfNeeded();
    addCategoryAP('MISC', 150, `Hobby Session: ${hobby.title}`);
    checkAndUpdateStreak();
  };

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
        {hobbies.map(h => (
          <div key={h.id} className={styles.item}>
            <div className={styles.info}>
              <h3>{h.title}</h3>
              <div className={styles.tags}>
                <span className={`${styles.tag} ${styles.typeTag}`}>{h.type}</span>
                {h.categories.map(cat => (
                  <span key={cat} className={`${styles.tag} ${styles.catTag}`}>{cat}</span>
                ))}
              </div>
            </div>
            <div className={styles.actions}>
              <button 
                className={styles.btnLog}
                onClick={() => handleLogHobby(h)}
              >
                LOG SESSION
              </button>
              <button className={styles.btnArchive} onClick={() => {
                if (user?.id) hobbyService.archiveHobby(user.id, h.id);
                else archiveHobby(h.id);
              }}>ARCHIVE</button>
              <button className={styles.btnDelete} onClick={() => {
                if (user?.id) hobbyService.deleteHobby(user.id, h.id);
                else deleteHobby(h.id);
              }}>×</button>
            </div>
          </div>
        ))}
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
