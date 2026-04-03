import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useSocialStore } from '../../store/socialStore';
import styles from './Duels.module.css';

const DuelPage = () => {
  const { duels, initiateDuel } = useSocialStore();

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>AURA DUELS</h1>
        <p>1v1 competitive sprints. 24h cycle. Winner takes all.</p>
      </header>

      <div className={styles.activeDuels}>
        {duels.map(duel => (
          <div key={duel.id} className={styles.duelCard}>
             <div className={styles.duelInfo}>
                <div className={styles.versus}>VS</div>
                <h3>{duel.opponent_name.replace(/_/g, ' ')}</h3>
                <div className={styles.stake}>{duel.stake_ap} AP STAKED</div>
             </div>
             <div className={styles.progressRow}>
                <div className={styles.progressLabel}>YOU</div>
                <div className={styles.bar}><div className={styles.fill} style={{ width: '45%' }} /></div>
             </div>
             <div className={styles.progressRow}>
                <div className={styles.progressLabel}>OPPONENT</div>
                <div className={styles.bar}><div className={styles.fill} style={{ width: '32%', background: 'var(--rank-slacking)' }} /></div>
             </div>
          </div>
        ))}
        {duels.length === 0 && <p className={styles.empty}>No active duels detected. Initiate a challenge via the Social Hub.</p>}
      </div>

      <button className={styles.btnNewDuel} onClick={() => initiateDuel('001', 'GOGGINS CLONE')}>
        SEARCH FOR OPPONENT
      </button>
    </PageWrapper>
  );
};
export default DuelPage;
