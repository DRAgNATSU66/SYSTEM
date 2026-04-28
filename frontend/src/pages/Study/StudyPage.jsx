import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar';
import { useStudyStore } from '../../store/studyStore';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { studyService } from '../../services/studyService';
import styles from './Study.module.css';

const StudyPage = () => {
  const { subjects, addSubject, removeSubject, sessions, logSession } = useStudyStore();
  const { addCategoryAP, checkAndUpdateStreak, resetDailyIfNeeded } = useAuraStore();
  const { user } = useUserStore();
  const [newSubject, setNewSubject] = useState('');
  const today = new Date().toISOString().split('T')[0];

  // Live timer state
  const [activeTimer, setActiveTimer] = useState(null); // { subjectId, startMs }
  const [elapsed, setElapsed] = useState(0); // seconds

  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeTimer.startMs) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleStartTimer = (subject) => {
    setActiveTimer({ subjectId: subject.id, startMs: Date.now() });
    setElapsed(0);
  };

  const handleStopTimer = (subject) => {
    if (!activeTimer || activeTimer.subjectId !== subject.id) return;
    const minutes = Math.max(1, Math.round(elapsed / 60));
    resetDailyIfNeeded();
    if (user?.id) {
      studyService.logSession(user.id, subject.id, minutes, today);
    } else {
      logSession(subject.id, minutes);
    }
    const ap = Math.min(Math.round((minutes / 120) * 200), 200);
    addCategoryAP('STUDY', ap, `STUDY TIMED: ${subject.name} ${minutes}m`);
    checkAndUpdateStreak();
    setActiveTimer(null);
    setElapsed(0);
  };

  // Calculate overall study progress
  const totalMinutes = Object.values(sessions[today] || {}).reduce((a, b) => a + b, 0);
  const progStudy = Math.min(100, (totalMinutes / 120) * 100); // 2h = 100% (PRD §5)

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>ACADEMIC DOMAIN</h1>
            <p className={styles.subtitle}>Dynamic subject management and deep work logging.</p>
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
        <button className={styles.btnAdd} onClick={() => {
          if (!newSubject) return;
          if (user?.id) {
            studyService.addSubject(user.id, newSubject);
          } else {
            addSubject(newSubject);
          }
          setNewSubject('');
        }}>ADD SUBJECT</button>
      </div>

      <div className={styles.subjectGrid}>
        {subjects.map(s => {
          const isActive = activeTimer?.subjectId === s.id;
          return (
            <div key={s.id} className={`${styles.subjectCard} ${isActive ? styles.subjectActive : ''}`}>
              <div className={styles.cardInfo}>
                <h3>{s.name.toUpperCase()}</h3>
                <div className={styles.sessionCounter}>{sessions[today]?.[s.id] || 0}m Deep Work</div>
                {isActive && (
                  <div className={styles.timerDisplay}>{formatElapsed(elapsed)}</div>
                )}
              </div>
              <div className={styles.cardActions}>
                {isActive ? (
                  <button className={styles.btnStop} onClick={() => handleStopTimer(s)}>STOP TIMER</button>
                ) : (
                  <button
                    className={styles.btnTimer}
                    onClick={() => handleStartTimer(s)}
                    disabled={!!activeTimer}
                  >
                    START TIMER
                  </button>
                )}
                <button className={styles.btnLog} onClick={() => {
                  resetDailyIfNeeded();
                  if (user?.id) {
                    studyService.logSession(user.id, s.id, 60, today);
                  } else {
                    logSession(s.id, 60);
                  }
                  addCategoryAP('STUDY', 100, `STUDY LOGGED: ${s.name} 60m`);
                  checkAndUpdateStreak();
                }}>LOG 60M</button>
                <button className={styles.btnRemove} onClick={() => {
                  if (user?.id) {
                    studyService.removeSubject(user.id, s.id);
                  } else {
                    removeSubject(s.id);
                  }
                }}>DELETE</button>
              </div>
            </div>
          );
        })}
      </div>
    </PageWrapper>
  );
};

export default StudyPage;
