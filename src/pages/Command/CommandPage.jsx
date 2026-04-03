import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import PulseCore from '../../components/ui/PulseCore/PulseCore';
import { useCommandStore } from '../../store/commandStore';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { useScoreStore } from '../../store/scoreStore';
import styles from './Command.module.css';

const CommandPage = () => {
  const { history, processCommand, addEntry } = useCommandStore();
  const { dailyScore, rankTitle } = useScoreStore();
  const { totalAuraPoints, auraHistory, penaltyLog } = useAuraStore();
  const { profile } = useUserStore();
  const [input, setInput] = useState('');
  const logEndRef = useRef(null);

  // Initialize permanent stats if history is empty or just boot
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
      
      stats.forEach((s, i) => {
        setTimeout(() => {
          addEntry(s);
        }, (i + 1) * 100);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e) => {
    e.preventDefault();
    if(!input) return;
    
    processCommand(input, dailyScore, rankTitle);
    setInput('');
  };

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.visualStack}>
         <PulseCore />
         <div className={styles.status}>CORE ACTIVE</div>
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
            placeholder="EXECUTE COMMAND..." 
            className={styles.numInput}
            autoFocus
          />
        </form>
      </div>
    </PageWrapper>
  );
};
export default CommandPage;
