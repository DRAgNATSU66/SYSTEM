import React, { useState, useMemo } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import styles from './History.module.css';

const DETAIL_DAYS = 10; // Only most-recent 10 days show expandable detail

const AuraHistoryPage = () => {
  const { auraHistory = [], penaltyLog = [], todayEarned, todayLost } = useAuraStore();
  const [expanded, setExpanded] = useState({});

  const toggle = (date) => setExpanded(prev => ({ ...prev, [date]: !prev[date] }));

  // Merge all entries, sorted newest-first
  const allEntries = useMemo(() => [
    ...auraHistory.map(h => ({
      date: h.date,
      net:  h.net,
      reason: h.reason || 'Daily Activity',
    })),
    ...penaltyLog.map(p => ({
      date:   p.date,
      net:    p.amount,
      reason: p.reason || 'Penalty',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)), [auraHistory, penaltyLog]);

  // Group by date — each date gets { earned, lost, entries[] }
  const groupedByDate = useMemo(() => allEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = { earned: 0, lost: 0, entries: [] };
    if (entry.net >= 0) acc[entry.date].earned += entry.net;
    else                acc[entry.date].lost   += Math.abs(entry.net);
    acc[entry.date].entries.push(entry);
    return acc;
  }, {}), [allEntries]);

  const sortedDates = useMemo(
    () => Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)),
    [groupedByDate]
  );

  // The 10 most-recent dates are expandable with full detail
  const detailSet = new Set(sortedDates.slice(0, DETAIL_DAYS));

  const formatNet = (n) => (n >= 0 ? `+${n}` : `${n}`);

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <h1>TRANSACTION LEDGER</h1>
        <p className={styles.headerSub}>Historical log of every AP vector.</p>
        <div className={styles.todaySummary}>
          <span className={styles.positive}>TODAY EARNED: +{todayEarned} AP</span>
          <span className={styles.negative}>TODAY LOST: -{todayLost} AP</span>
        </div>
      </div>

      {/* ── Detail-limit notice ── */}
      <div className={styles.limitNotice}>
        <span className={styles.limitIcon}>ⓘ</span>
        Full breakdown shown for the <strong>last {DETAIL_DAYS} days</strong>.
        Older entries show net daily totals only (detail pruned to save storage).
      </div>

      <div className={styles.ledger}>
        {sortedDates.length === 0 && (
          <p className={styles.empty}>No ledger entries yet. Start logging activities to build your history.</p>
        )}

        {sortedDates.map((date, idx) => {
          const group      = groupedByDate[date];
          const netDay     = group.earned - group.lost;
          const isDetailable = detailSet.has(date);
          const isOpen     = expanded[date];
          const isOldEntry = !isDetailable;

          return (
            <div
              key={date}
              className={`${styles.dateGroup} ${isOldEntry ? styles.dateGroupLocked : ''}`}
            >
              {/* ── Day header ── */}
              <button
                className={`${styles.dateHeader} ${isDetailable ? styles.dateHeaderClickable : ''}`}
                onClick={() => isDetailable && toggle(date)}
                disabled={!isDetailable}
                aria-expanded={isOpen}
              >
                <div className={styles.dateLeft}>
                  <span className={styles.dateBadge}>{date}</span>
                  {isDetailable ? (
                    <span className={styles.expandHint}>
                      {isOpen ? '▲ collapse' : '▼ expand details'}
                    </span>
                  ) : (
                    <span className={styles.lockedLabel}>🔒 detail pruned</span>
                  )}
                </div>
                <div className={styles.dateSummary}>
                  {group.earned > 0 && (
                    <span className={styles.positive}>+{group.earned} AP EARNED</span>
                  )}
                  {group.lost > 0 && (
                    <span className={styles.negative}>-{group.lost} AP LOST</span>
                  )}
                  <span className={netDay >= 0 ? styles.netPositive : styles.netNegative}>
                    NET: {formatNet(netDay)} AP
                  </span>
                </div>
              </button>

              {/* ── Expandable detail rows (last 10 days only) ── */}
              {isDetailable && isOpen && (
                <div className={styles.dateEntries}>
                  {group.entries.map((entry, i) => (
                    <div key={i} className={styles.entry}>
                      <div className={styles.entryDot}
                        style={{ background: entry.net >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
                      />
                      <span className={styles.reason}>{entry.reason}</span>
                      <span className={entry.net >= 0 ? styles.positive : styles.negative}>
                        {formatNet(entry.net)} AP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageWrapper>
  );
};

export default AuraHistoryPage;
