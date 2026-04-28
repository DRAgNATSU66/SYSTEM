import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import styles from './History.module.css';

const AuraHistoryPage = () => {
  const { auraHistory = [], penaltyLog = [], todayEarned, todayLost } = useAuraStore();

  // Build unified ledger — use actual reasons from each entry
  const allEntries = [
    ...auraHistory.map(h => ({ date: h.date, net: h.net, reason: h.reason || 'Daily Activity' })),
    ...penaltyLog.map(p => ({ date: p.date, net: p.amount, reason: p.reason || 'Penalty' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group by date for the earned/lost breakdown
  const groupedByDate = allEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = { earned: 0, lost: 0, entries: [] };
    if (entry.net >= 0) acc[entry.date].earned += entry.net;
    else acc[entry.date].lost += Math.abs(entry.net);
    acc[entry.date].entries.push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <h1>TRANSACTION LEDGER</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Historical log of every AP vector.</p>
        <div className={styles.todaySummary}>
          <span className={styles.positive}>TODAY EARNED: +{todayEarned} AP</span>
          <span className={styles.negative}>TODAY LOST: -{todayLost} AP</span>
        </div>
      </div>

      <div className={styles.ledger}>
        {sortedDates.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No ledger entries found. OS initialization required.</p>
        )}
        {sortedDates.map(date => {
          const group = groupedByDate[date];
          return (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateHeader}>
                <span className={styles.date}>{date}</span>
                <div className={styles.dateSummary}>
                  {group.earned > 0 && <span className={styles.positive}>+{group.earned} AP EARNED</span>}
                  {group.lost > 0 && <span className={styles.negative}>-{group.lost} AP LOST</span>}
                </div>
              </div>
              <div className={styles.dateEntries}>
                {group.entries.map((entry, idx) => (
                  <div key={idx} className={styles.entry}>
                    <span className={styles.reason}>{entry.reason}</span>
                    <span className={entry.net >= 0 ? styles.positive : styles.negative}>
                      {entry.net >= 0 ? '+' : ''}{entry.net} AP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </PageWrapper>
  );
};
export default AuraHistoryPage;
