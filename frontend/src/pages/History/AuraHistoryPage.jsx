import React, { useState, useMemo } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import styles from './History.module.css';

const DETAIL_DAYS = 10; // Only most-recent 10 days show expandable detail

// Map category keywords → display names
const CATEGORY_MAP = {
  WORKOUT:   { label: '💪 HYPERTROPHY',   color: 'var(--rank-alpha)'   },
  SLEEP:     { label: '🌙 SLEEP',          color: '#a78bfa'             },
  NUTRITION: { label: '🥗 NUTRITION',      color: 'var(--color-green)'  },
  MOOD:      { label: '💫 MOOD',           color: '#fbbf24'             },
  STUDY:     { label: '📚 STUDY',          color: '#60a5fa'             },
  MISC:      { label: '⚡ SIDE HUSTLE',    color: 'var(--rank-sigma)'   },
  HABIT:     { label: '✅ HABIT',          color: 'var(--rank-omega)'   },
  GOAL:      { label: '🎯 GOAL',           color: 'var(--color-green)'  },
  STREAK:    { label: '🔥 STREAK BONUS',   color: '#f97316'             },
  PENALTY:   { label: '⚠️ PENALTY',       color: 'var(--color-red)'    },
};

/**
 * Parses a reason string like "SLEEP LOGGED: 8h, Deep 9/10" into
 * { category: '🌙 SLEEP', detail: '8h, Deep 9/10' }
 */
function formatEntryLabel(reason = '') {
  if (!reason || reason === 'Daily Activity' || reason === 'Bonus') {
    return { category: 'Daily Activity', detail: null };
  }
  if (reason === 'Multiplier Penalty' || reason.includes('Penalty') || reason.includes('penalty')) {
    return { category: '⚠️ PENALTY', detail: reason };
  }
  if (reason.includes('Inactivity')) return { category: '⚠️ INACTIVITY', detail: null };

  // Pattern: "CATEGORY VERB: detail" → e.g. "SLEEP LOGGED: 8h"
  // or "Deep Work: ProjectName (8/10 focus)"
  const upperReason = reason.toUpperCase();

  if (upperReason.includes('VOLUME') || upperReason.includes('PERSONAL BEST') || upperReason.includes('WORKOUT') || upperReason.includes('CARDIO') || upperReason.includes('VO2') || upperReason.includes('MOBILITY')) {
    const detail = reason.replace(/^(WORKOUT\s+)?/i, '').replace(/^VOLUME LOGGED:\s*/i, '').replace(/^NEW PERSONAL BEST:\s*/i, 'PB: ');
    return { category: '💪 WORKOUT', detail };
  }
  if (upperReason.includes('SLEEP')) {
    const detail = reason.replace(/^SLEEP LOGGED:\s*/i, '');
    return { category: '🌙 SLEEP', detail };
  }
  if (upperReason.includes('NUTRITION')) {
    const detail = reason.replace(/^NUTRITION (LOGGED|MET):\s*/i, '');
    return { category: '🥗 NUTRITION', detail };
  }
  if (upperReason.includes('MOOD')) {
    const detail = reason.replace(/^MOOD LOGGED:\s*/i, '');
    return { category: '💫 MOOD', detail };
  }
  if (upperReason.includes('STUDY') || upperReason.includes('KNOWLEDGE') || upperReason.includes('IQ')) {
    const detail = reason.replace(/^STUDY\s+/i, '').replace(/^KNOWLEDGE\s+/i, '');
    return { category: '📚 STUDY / IQ', detail };
  }
  if (upperReason.includes('DEEP WORK') || upperReason.includes('FOCUS') || upperReason.includes('PROJECT') || upperReason.includes('HUSTLE')) {
    const detail = reason.replace(/^Deep Work:\s*/i, '');
    return { category: '⚡ SIDE HUSTLE', detail };
  }
  if (upperReason.includes('STREAK') || upperReason.includes('BONUS')) {
    return { category: '🔥 STREAK BONUS', detail: reason };
  }
  if (upperReason.includes('GOAL')) return { category: '🎯 GOAL', detail: reason };
  if (upperReason.includes('HABIT') || upperReason.includes('HOBBY')) return { category: '✅ HABIT', detail: reason };

  // Fallback — show as-is
  return { category: reason, detail: null };
}

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
                  {group.entries.length === 1 && group.entries[0].reason === 'Daily Activity' ? (
                    /* Legacy consolidated entry — show helpful message */
                    <div className={styles.legacyNote}>
                      <span className={styles.legacyIcon}>ℹ</span>
                      This day was recorded before detailed tracking was enabled.
                      Only the net total is available. Future activity will show full breakdowns.
                    </div>
                  ) : (
                    /* Detailed per-activity breakdown */
                    group.entries
                      .filter(e => e.reason !== 'Daily Activity' || group.entries.length === 1)
                      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net)) // biggest first
                      .map((entry, i) => {
                        const label  = formatEntryLabel(entry.reason);
                        const isGain = entry.net >= 0;
                        return (
                          <div key={i} className={styles.entry}>
                            <div
                              className={styles.entryDot}
                              style={{ background: isGain ? 'var(--color-green)' : 'var(--color-red)' }}
                            />
                            <span className={styles.entryCategory}>{label.category}</span>
                            {label.detail && <span className={styles.entryDetail}>{label.detail}</span>}
                            <span className={isGain ? styles.positive : styles.negative}>
                              {formatNet(entry.net)} AP
                            </span>
                          </div>
                        );
                      })
                  )}
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
