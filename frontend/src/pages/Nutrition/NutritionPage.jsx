import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import DomainPieChart from '../../components/charts/DomainPieChart/DomainPieChart';
import { useMetricsStore } from '../../store/metricsStore';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { metricsService } from '../../services/metricsService';
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
const NutrientRow = ({ macro, value, onChange, isEditing, onLimitChange, onDelete, onLogItem }) => {
  const [inputVal, setInputVal] = React.useState(value != null ? String(value) : '');
  React.useEffect(() => {
    setInputVal(value != null ? String(value) : '');
  }, [value]);

  const numVal = parseFloat(inputVal) || 0;
  const prog = Math.min(100, Math.round((numVal / (macro.minLimit || 1)) * 100));
  return (
    <div className={styles.macroCard}>
      <div className={styles.macroInfo}>
        <label>{macro.name.toUpperCase()}</label>
        <div className={styles.inputRow}>
          <input
            type="number"
            step="any"
            value={inputVal}
            placeholder="0"
            onChange={e => {
              setInputVal(e.target.value);
              onChange(macro.id, e.target.value);
            }}
          />
          <span className={styles.unit}>{macro.unit}</span>
          <button
            className={styles.btnLogItem}
            onClick={() => onLogItem(macro, inputVal)}
          >
            LOG
          </button>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width: `${prog}%`,
              background: prog >= 100 ? 'var(--color-green)' : 'var(--rank-alpha)'
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
  const { user } = useUserStore();

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

  const { addCategoryAP, checkAndUpdateStreak, resetDailyIfNeeded, getCategoryEarned, dailyCategoryAP } = useAuraStore();
  const overallProgress = computeNutritionProgress(customMacros, customMicros, todayMacros, todayMicros);

  // Per-nutrient AP: total NUTRITION cap (200) divided among all nutrients, each can only award once per day
  const totalNutrients = customMacros.length + customMicros.length;
  const apPerNutrient = totalNutrients > 0 ? Math.floor(200 / totalNutrients) : 5;

  const handleLogItem = (macro, rawValue) => {
    resetDailyIfNeeded();

    // Always persist the entered value to the store + sync to backend
    const valueToLog = parseFloat(rawValue) || 0;
    if (tab === 'macros') {
      if (user?.id) {
        metricsService.logMacroValue(user.id, macro.id, valueToLog, today);
      } else {
        logMacroValue(macro.id, valueToLog);
      }
    } else {
      if (user?.id) {
        metricsService.logMicroValue(user.id, macro.id, valueToLog, today);
      } else {
        logMicroValue(macro.id, valueToLog);
      }
    }

    // Check if this specific nutrient already awarded AP today
    const todayKey = today;
    const dayData = dailyCategoryAP[todayKey] || {};
    const nutrientKey = `NUTRITION_${macro.id}`;
    if (dayData[nutrientKey]) {
      setFlash(`${macro.name} already logged for AP today.`);
      setTimeout(() => setFlash(''), 2000);
      return;
    }

    // Check if the nutrient's value meets its minimum target
    if (valueToLog < macro.minLimit) {
      setFlash(`${macro.name}: value must meet target (${macro.minLimit}${macro.unit}) for AP.`);
      setTimeout(() => setFlash(''), 2000);
      return;
    }

    // Award AP and mark this nutrient as awarded
    addCategoryAP('NUTRITION', apPerNutrient, `NUTRITION MET: ${macro.name}`);
    // Mark this specific nutrient as awarded today
    useAuraStore.setState((state) => ({
      dailyCategoryAP: {
        ...state.dailyCategoryAP,
        [todayKey]: { ...(state.dailyCategoryAP[todayKey] || {}), [nutrientKey]: true }
      }
    }));
    checkAndUpdateStreak();
    setFlash(`${macro.name} target met! +${apPerNutrient} AP`);
    setTimeout(() => setFlash(''), 2000);
  };

  const handleAddMacro = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addMacro(newName.trim(), parseFloat(newLimit) || 0, newUnit);
    setNewName('');
    setNewLimit(100);
  };

  const handleBaselineLog = () => {
    if (user?.id) {
      metricsService.logBaselineToday(user.id, today);
    } else {
      logBaselineToday();
    }
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
              Track macros & {customMicros.length} micronutrients. Overall: {overallProgress}%
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
              onLogItem={handleLogItem}
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
              onDelete={() => {}}
              onLogItem={handleLogItem}
            />
          ))}
        </div>
      )}

      <div className={styles.biologicalCues}>
        <h3>METABOLIC STRATEGY</h3>
        <p>• <b>Baseline</b>: Save your current targets, then one-click log the defaults each day.</p>
        <p>• <b>100%</b>: All macros AND micros must hit their targets for full nutrition completion.</p>
      </div>
    </PageWrapper>
  );
};

export default NutritionPage;
