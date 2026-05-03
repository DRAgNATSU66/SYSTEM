/**
 * SYSTEM Wrapped Recap Generator
 * Compiles a year's worth of Aura history into a downloadable summary.
 * Call generateWrapped(year, stores) then downloadWrapped(data).
 */

export function generateWrapped(year, { auraHistory, penaltyLog, dailyCategoryAP, profile }) {
  const prefix = `${year}-`;

  // ── Filter to target year ──
  const yearHistory = (auraHistory || []).filter(h => h.date?.startsWith(prefix));
  const yearPenalties = (penaltyLog || []).filter(p => p.date?.startsWith(prefix));

  // ── Daily AP totals ──
  const apByDate = {};
  yearHistory.forEach(h => {
    apByDate[h.date] = (apByDate[h.date] || 0) + Math.max(0, h.net || 0);
  });
  yearPenalties.forEach(p => {
    if (p.amount < 0) {
      apByDate[p.date] = (apByDate[p.date] || 0) + p.amount;
    }
  });

  const activeDates = Object.keys(apByDate).filter(d => apByDate[d] > 0);
  const allNetValues = Object.values(apByDate);

  // ── Category totals ──
  const categoryTotals = {};
  Object.entries(dailyCategoryAP || {}).forEach(([date, cats]) => {
    if (!date.startsWith(prefix)) return;
    Object.entries(cats).forEach(([cat, val]) => {
      if (typeof val !== 'number' || cat.startsWith('NUTRITION_')) return;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
    });
  });
  const topCategory = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)[0];

  // ── Reason breakdown ──
  const reasonCounts = {};
  yearHistory.forEach(h => {
    if (h.reason) reasonCounts[h.reason] = (reasonCounts[h.reason] || 0) + 1;
  });
  const topReason = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)[0];

  // ── Streak calculation ──
  const sortedDates = activeDates.sort();
  let maxStreak = 0, curStreak = 0, prevDate = null;
  sortedDates.forEach(d => {
    if (prevDate) {
      const diff = (new Date(d) - new Date(prevDate)) / 86400000;
      curStreak = diff === 1 ? curStreak + 1 : 1;
    } else {
      curStreak = 1;
    }
    maxStreak = Math.max(maxStreak, curStreak);
    prevDate = d;
  });

  // ── Best / worst day ──
  const bestDate  = Object.entries(apByDate).sort(([, a], [, b]) => b - a)[0];
  const worstDate = Object.entries(apByDate).sort(([, a], [, b]) => a - b)[0];
  const totalEarned = yearHistory.reduce((s, h) => s + Math.max(0, h.net || 0), 0);
  const totalLost   = yearPenalties.reduce((s, p) => s + Math.abs(p.amount || 0), 0) +
                      yearHistory.reduce((s, h) => s + Math.abs(Math.min(0, h.net || 0)), 0);

  return {
    meta: {
      player: profile?.name || profile?.username || 'PLAYER',
      year,
      generatedAt: new Date().toISOString(),
      version: '1.0',
    },
    summary: {
      totalEarned,
      totalLost,
      netAP: totalEarned - totalLost,
      daysActive: activeDates.length,
      longestStreak: maxStreak,
      avgApPerActiveDay: activeDates.length
        ? Math.round(totalEarned / activeDates.length)
        : 0,
    },
    highlights: {
      bestDay:  bestDate  ? { date: bestDate[0],  ap: bestDate[1]  } : null,
      worstDay: worstDate ? { date: worstDate[0], ap: worstDate[1] } : null,
      topCategory: topCategory  ? { name: topCategory[0],  total: topCategory[1]  } : null,
      topActivity: topReason    ? { name: topReason[0],    count: topReason[1]    } : null,
    },
    categoryBreakdown: categoryTotals,
    // Include per-day AP totals (no minute detail) for safe long-term storage
    dailySummary: apByDate,
  };
}

/** Download the wrapped data as a formatted JSON file */
export function downloadWrapped(data) {
  const filename = `SYSTEM_Wrapped_${data.meta.year}_${data.meta.player}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Check if wrapped is available for a given year (data must exist) */
export function isWrappedAvailable(year, auraHistory) {
  const prefix = `${year}-`;
  return (auraHistory || []).some(h => h.date?.startsWith(prefix));
}

/**
 * Prune history entries older than the current year (client-side).
 * Returns: { pruned: auraHistory[], kept: auraHistory[] }
 * Call only AFTER user has confirmed download. Pass to auraStore to persist.
 */
export function pruneHistoryAfterDownload(auraHistory, yearToPrune) {
  const prefix = `${yearToPrune}-`;
  return {
    pruned: (auraHistory || []).filter(h => h.date?.startsWith(prefix)),
    kept:   (auraHistory || []).filter(h => !h.date?.startsWith(prefix)),
  };
}
