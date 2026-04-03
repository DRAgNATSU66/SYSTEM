import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import DomainPieChart from '../../components/charts/DomainPieChart/DomainPieChart';
import { useMetricsStore } from '../../store/metricsStore';
import { getTodayStr } from '../../utils/dateUtils';
import styles from './Nutrition.module.css';

// ─── Overall nutrition progress (macros + micros) ─────────────────────────────
const computeNutritionProgress = (macros, micros, todayMacros, todayMicros) => {
  const macroProgs = macros.map(m => Math.min(1, (todayMacros[m.id] || 0) / (m.minLimit || 1)));
  const microProgs = micros.map(m => Math.min(1, (todayMicros[m.id] || 0) / (m.minLimit || 1)));
  const all = [...macroProgs, ...microProgs];
  if (!all.length) return 0;
  return Math.min(100, Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 100));
};

// ─── Nutrient row ─────────────────────────────────────────────────────────────
const NutrientRow = ({ macro, value, onChange, isEditing, onLimitChange, onDelete }) => {
  const prog = Math.min(100, Math.round(((value || 0) / (macro.minLimit || 1)) * 100));
  return (
    <div className={styles.macroCard}>
      <div className={styles.macroInfo}>
        <label>{macro.name.toUpperCase()}</label>
        <div className={styles.inputRow}>
          <input
            type="number"
            step="any"
            value={value || ''}
            placeholder="0"
            onChange={e => onChange(macro.id, e.target.value)}
          />
          <span className={styles.unit}>{macro.unit}</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width: `${prog}%`,
              background: prog >= 100 ? 'var(--rank-sigma)' : 'var(--rank-alpha)'
            }}
          />
        </div>
        <span className={styles.progLabel}>{prog}% of target ({macro.minLimit}{macro.unit})</span>
        {isEditing && (
          <div className={styles.editRow}>
            <input
              type="number"
              step="any"
              value={macro.minLimit}
              onChange={e => onLimitChange(macro.id, e.target.value)}
              className={styles.limitInput}
            />
            <button className={styles.btnDelete} onClick={() => onDelete(macro.id)}>✕</button>
          </div>
        )}
      </div>
      <div className={styles.pieSlot}>
        <DomainPieChart value={prog} label="" />
      </div>
    </div>
  );
};

// ─── Main NutritionPage ───────────────────────────────────────────────────────
const NutritionPage = () => {
  const {
    customMacros, customMicros,
    dailyMetrics,
    logMacroValue, logMicroValue,
    addMacro, deleteMacro, setMacroLimit, setMicroLimit,
    logBaselineToday
  } = useMetricsStore();

  const today       = getTodayStr();
  const todayData   = dailyMetrics[today] || {};
  const todayMacros = todayData.macros || {};
  const todayMicros = todayData.micros || {};

  const [isEditing, setIsEditing] = useState(false);
  const [newName,   setNewName]   = useState('');
  const [newLimit,  setNewLimit]  = useState(100);
  const [newUnit,   setNewUnit]   = useState('g');
  const [tab,       setTab]       = useState('macros'); // 'macros' | 'micros'
  const [flash,     setFlash]     = useState('');

  const overallProgress = computeNutritionProgress(customMacros, customMicros, todayMacros, todayMicros);

  const handleAddMacro = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addMacro(newName.trim(), parseFloat(newLimit) || 0, newUnit);
    setNewName('');
    setNewLimit(100);
  };

  const handleBaselineLog = () => {
    logBaselineToday();
    setFlash('Baseline logged!');
    setTimeout(() => setFlash(''), 2000);
  };


  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>METABOLIC ENGINE</h1>
            <p className={styles.subtitle}>
              Track macros & 16 micronutrients. Overall: {overallProgress}%
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnBaseline} onClick={handleBaselineLog} title="Log current threshold values to today">
              ONE-CLICK LOG BASELINE
            </button>
            <button className={styles.btnConfig} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'LOCK CONFIG' : 'EDIT THRESHOLDS'}
            </button>
          </div>
        </div>
        {flash && <div className={styles.flash}>{flash}</div>}
      </header>

      {/* ── Config Section ──────────────────────────────────────────── */}
      {isEditing && (
        <section className={styles.configSection}>
          <h2 className={styles.sectionTitle}>ADD CUSTOM MACRO</h2>
          <form className={styles.addForm} onSubmit={handleAddMacro}>
            <input type="text" placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} />
            <input type="number" placeholder="Target" value={newLimit} onChange={e => setNewLimit(e.target.value)} />
            <input type="text" placeholder="Unit" value={newUnit} onChange={e => setNewUnit(e.target.value)} style={{ width: 60 }} />
            <button type="submit">ADD</button>
          </form>
          <p className={styles.configHint}>Edit limits directly on each card below while in edit mode.</p>
        </section>
      )}

      {/* ── Tab Toggle ──────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'macros' ? styles.tabActive : ''}`}
          onClick={() => setTab('macros')}
        >
          MACROS ({customMacros.length})
        </button>
        <button
          className={`${styles.tab} ${tab === 'micros' ? styles.tabActive : ''}`}
          onClick={() => setTab('micros')}
        >
          MICRONUTRIENTS ({customMicros.length})
        </button>
      </div>

      {/* ── Macros Grid ─────────────────────────────────────────────── */}
      {tab === 'macros' && (
        <div className={styles.macroGrid}>
          {customMacros.map(m => (
            <NutrientRow
              key={m.id}
              macro={m}
              value={todayMacros[m.id]}
              onChange={(id, val) => logMacroValue(id, val)}
              isEditing={isEditing}
              onLimitChange={(id, val) => setMacroLimit(id, val)}
              onDelete={deleteMacro}
            />
          ))}
        </div>
      )}

      {/* ── Micros Grid ─────────────────────────────────────────────── */}
      {tab === 'micros' && (
        <div className={styles.macroGrid}>
          {customMicros.map(m => (
            <NutrientRow
              key={m.id}
              macro={m}
              value={todayMicros[m.id]}
              onChange={(id, val) => logMicroValue(id, val)}
              isEditing={isEditing}
              onLimitChange={(id, val) => setMicroLimit(id, val)}
              onDelete={() => {}} // micros are not deletable (PRD requirement)
            />
          ))}
        </div>
      )}

      <div className={styles.biologicalCues}>
        <h3>METABOLIC STRATEGY</h3>
        <p>• <b>Baseline</b>: Save your current targets, then one-click log the defaults each day.</p>
        <p>• <b>100%</b>: All macros AND micros must hit their targets for full nutrition completion.</p>
        <p>• <b>Protein</b>: Minimum {customMacros.find(m => m.id === 'pro')?.minLimit || 180}g for MPS optimization.</p>
      </div>
    </PageWrapper>
  );
};

export default NutritionPage;
