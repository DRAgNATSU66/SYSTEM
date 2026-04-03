import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar';
import { useStudyStore } from '../../store/studyStore';
import styles from './Study.module.css';

const StudyPage = () => {
  const { subjects, addSubject, removeSubject, sessions, logSession } = useStudyStore();
  const [newSubject, setNewSubject] = useState('');
  const today = new Date().toISOString().split('T')[0];

  // Calculate overall study progress
  const totalMinutes = Object.values(sessions[today] || {}).reduce((a, b) => a + b, 0);
  const progStudy = Math.min(100, (totalMinutes / 120) * 100); // 2h = 100% (PRD §5)

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>ACADEMIC DOMAIN</h1>
            <p className={styles.subtitle}>Dynamic semester subject management and deep work logging.</p>
          </div>
          <div className={styles.overallProgress}>
            <ProgressBar value={progStudy} label="STUDY LOAD" />
          </div>
        </div>
      </header>

      <div className={styles.addSubjectRow}>
        <input 
          type="text" value={newSubject} 
          onChange={e => setNewSubject(e.target.value)} 
          placeholder="ENTER NEW SUBJECT..." 
        />
        <button className={styles.btnAdd} onClick={() => { addSubject(newSubject); setNewSubject(''); }}>ADD SUBJECT</button>
      </div>

      <div className={styles.subjectGrid}>
        {subjects.map(s => (
          <div key={s.id} className={styles.subjectCard}>
             <div className={styles.cardInfo}>
                <h3>{s.name.toUpperCase()}</h3>
                <div className={styles.sessionCounter}>{sessions[today]?.[s.id] || 0}m Deep Work</div>
             </div>
             <div className={styles.cardActions}>
                <button className={styles.btnLog} onClick={() => logSession(s.id, 60)}>LOG 60M</button>
                <button className={styles.btnRemove} onClick={() => removeSubject(s.id)}>DELETE</button>
             </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};

export default StudyPage;
