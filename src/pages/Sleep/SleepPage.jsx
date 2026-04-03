import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar';
import { useMetricsStore } from '../../store/metricsStore';
import { getTodayStr } from '../../utils/dateUtils';
import styles from './Sleep.module.css';

/**
 * Sleep Progress Formula (PRD §5):
 *   100% requires BOTH:
 *     – Duration  ≥ 8 hours       → weight 60%
 *     – Deep Sleep ≥ 9/10 rating  → weight 40%
 *   Each component is proportional if below threshold.
 *   Total is capped at 100%.
 */
const computeSleepProgress = (hours, deep) => {
  const durationScore  = Math.min(1, hours / 8);          // 0–1, target 8h
  const deepScore      = Math.min(1, deep / 9);           // 0–1, target 9/10
  const combined       = (durationScore * 0.6) + (deepScore * 0.4);
  return Math.min(100, Math.round(combined * 100));
};

const SleepPage = () => {
  const { logMetrics, dailyMetrics } = useMetricsStore();
  const today   = getTodayStr();
  const saved   = dailyMetrics[today] || {};

  const [hours, setHours] = useState(saved.sleep     ?? 8);
  const [deep,  setDeep]  = useState(saved.deepSleep ?? 7);
  const [saved_, setSaved_] = useState(false);

  const progress       = computeSleepProgress(hours, deep);
  const durationPct    = Math.min(100, Math.round((hours / 8) * 100));
  const deepPct        = Math.min(100, Math.round((deep / 9) * 100));
  const underSleep     = hours < 8;
  const underDeep      = deep < 9;

  const handleSync = () => {
    logMetrics({ sleep: hours, deepSleep: deep });
    setSaved_(true);
    setTimeout(() => setSaved_(false), 2500);
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>CIRCADIAN RECOVERY</h1>
            <p className={styles.subtitle}>
              100% requires ≥8h sleep <em>and</em> deep sleep rating ≥9/10.
            </p>
          </div>
          <div className={styles.overallProgress}>
            <ProgressBar value={progress} label="RECOVERY SCORE" />
          </div>
        </div>
      </header>

      <div className={styles.sleepStack}>
        {/* ── Duration ─────────────────────────────────────────────── */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <label>TOTAL HOURS</label>
            <span className={styles.metricTarget}>Target: 8h</span>
          </div>
          <div className={styles.inputRow}>
            <input
              type="number"
              step="0.25"
              value={hours}
              min="0"
              max="14"
              onChange={e => setHours(parseFloat(e.target.value) || 0)}
              className={styles.metricInput}
            />
            <span className={styles.unit}>hrs</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{
                width: `${durationPct}%`,
                background: underSleep ? 'var(--rank-slacking)' : 'var(--rank-sigma)'
              }}
            />
          </div>
          <div className={styles.metricMeta}>
            <span style={{ color: underSleep ? 'var(--rank-slacking)' : 'var(--rank-sigma)' }}>
              {durationPct}% of target
            </span>
            {underSleep && (
              <span className={styles.warning}>UNDERSLEEP — AURA PENALTY RISK</span>
            )}
          </div>
        </div>

        {/* ── Deep Sleep ───────────────────────────────────────────── */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <label>DEEP SLEEP RATING</label>
            <span className={styles.metricTarget}>Target: 9/10</span>
          </div>
          <div className={styles.inputRow}>
            <input
              type="number"
              step="0.5"
              value={deep}
              min="0"
              max="10"
              onChange={e => setDeep(parseFloat(e.target.value) || 0)}
              className={styles.metricInput}
            />
            <span className={styles.unit}>/10</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{
                width: `${deepPct}%`,
                background: underDeep ? 'var(--rank-dreamer)' : 'var(--rank-alpha)'
              }}
            />
          </div>
          <div className={styles.metricMeta}>
            <span style={{ color: underDeep ? 'var(--rank-dreamer)' : 'var(--rank-alpha)' }}>
              {deepPct}% of target
            </span>
            {underDeep && <span className={styles.hint}>Optimize sleep environment for deeper cycles</span>}
          </div>
        </div>

        {/* ── Scoring breakdown ────────────────────────────────────── */}
        <div className={styles.scoreBreakdown}>
          <div className={styles.scoreRow}>
            <span>Duration ({hours}h)</span>
            <span>×60% weight → <strong>{Math.round(Math.min(1, hours / 8) * 60)}pts</strong></span>
          </div>
          <div className={styles.scoreRow}>
            <span>Deep Sleep ({deep}/10)</span>
            <span>×40% weight → <strong>{Math.round(Math.min(1, deep / 9) * 40)}pts</strong></span>
          </div>
          <div className={styles.scoreTotal}>
            Total Recovery Score: <strong style={{ color: 'var(--rank-alpha)' }}>{progress}%</strong>
          </div>
        </div>
      </div>

      <button
        className={styles.btnSync}
        onClick={handleSync}
      >
        {saved_ ? '✓ SYNCED' : 'SYNC CIRCADIAN DATA'}
      </button>
    </PageWrapper>
  );
};

export default SleepPage;
