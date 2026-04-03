import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import styles from './History.module.css';

const AuraHistoryPage = () => {
  const { auraHistory = [], penaltyLog = [] } = useAuraStore();
  
  // Combine auraHistory and penaltyLog for the unified ledger
  const unifiedLedger = [
    ...auraHistory.map(h => ({ date: h.date, net: h.net, reason: 'Daily Activity' })),
    ...penaltyLog.map(p => ({ date: p.date, net: p.amount, reason: p.reason }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>TRANSACTION LEDGER</h1>
        <p>Historical log of every AP vector.</p>
      </header>
      
      <div className={styles.ledger}>
        {unifiedLedger.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No ledger entries found. OS initialization required.</p>}
        {unifiedLedger.map((log, idx) => (
          <div key={idx} className={styles.entry}>
            <div className={styles.date}>{log.date}</div>
            <div className={styles.reason}>{log.reason}</div>
            <div className={log.net >= 0 ? styles.positive : styles.negative}>
               {log.net >= 0 ? '+' : ''}{log.net} AP
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
export default AuraHistoryPage;
