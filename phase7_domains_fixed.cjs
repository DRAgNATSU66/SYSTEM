const fs = require('fs');
const path = require('path');

const files = {
  // Sleep Page
  'src/pages/Sleep/SleepPage.jsx': `import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useMetricsStore } from '../../store/metricsStore';
import { getTodayStr } from '../../utils/dateUtils';
import styles from './Sleep.module.css';

const SleepPage = () => {
  const { dailyMetrics, setMetric } = useMetricsStore();
  const today = getTodayStr();
  const sleepVal = dailyMetrics[today]?.sleep || 0;
  const qualityVal = dailyMetrics[today]?.quality || 5;

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>SLEEP ARCHITECTURE</h1>
        <p>Log circadian cycles for cognitive recovery.</p>
      </header>

      <div className={styles.card}>
        <div className={styles.inputGroup}>
          <label>TOTAL DURATION (HOURS)</label>
          <div className={styles.valDisplay}>{sleepVal}h</div>
          <input 
            type="range" min="0" max="12" step="0.5" 
            value={sleepVal} 
            onChange={(e) => setMetric(today, 'sleep', parseFloat(e.target.value))} 
            className={styles.slider}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>RECOVERY QUALITY (1-10)</label>
          <div className={styles.valDisplay}>{qualityVal}/10</div>
          <input 
            type="range" min="1" max="10" 
            value={qualityVal} 
            onChange={(e) => setMetric(today, 'quality', parseInt(e.target.value))} 
            className={styles.slider}
          />
        </div>
        
        <p className={styles.tip}>Tip: 7.5h+ duration scales the "Mood" axis on the Radar Chart.</p>
      </div>
    </PageWrapper>
  );
};
export default SleepPage;\n`,

  'src/pages/Sleep/Sleep.module.css': `.container { padding: 2rem; max-width: 600px; margin: 0 auto; }
.header { margin-bottom: 3rem; }
.header h1 { font-family: 'Outfit'; font-size: 2.5rem; color: #fff; letter-spacing: 0.1em; }
.card { background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.05); padding: 2.5rem; border-radius: var(--radius-lg); }
.inputGroup { margin-bottom: 2.5rem; }
.valDisplay { font-family: 'Outfit'; font-size: 3rem; font-weight: 900; color: var(--rank-alpha); margin-bottom: 0.5rem; }
.label { font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); letter-spacing: 0.1em; }
.slider { width: 100%; -webkit-appearance: none; background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; }
.slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: var(--rank-alpha); border-radius: 50%; cursor: pointer; border: 2px solid #000; box-shadow: 0 0 10px rgba(0,191,255,0.5); }
.tip { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2rem; font-style: italic; }\n`,

  // Mood Page
  'src/pages/Mood/MoodPage.jsx': `import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useMetricsStore } from '../../store/metricsStore';
import { getTodayStr } from '../../utils/dateUtils';
import styles from './Mood.module.css';

const MoodPage = () => {
  const { dailyMetrics, setMetric } = useMetricsStore();
  const today = getTodayStr();
  const currentMood = dailyMetrics[today]?.mood || 5;

  const faces = [
    { val: 1, label: 'LACKING', color: 'var(--rank-slacking)' },
    { val: 3, label: 'NORMIE', color: 'var(--rank-normie)' },
    { val: 5, label: 'STABLE', color: 'var(--rank-alpha)' },
    { val: 8, label: 'GRINDER', color: 'var(--rank-sigma)' },
    { val: 10, label: 'IM HIM', color: '#00BFFF' }
  ];

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>NEURAL STATE</h1>
        <p>Sync current emotional bandwidth.</p>
      </header>

      <div className={styles.grid}>
        {faces.map(f => (
          <div 
            key={f.val} 
            className={\`\${styles.face} \${currentMood === f.val ? styles.active : ''}\`}
            style={{ '--mood-color': f.color }}
            onClick={() => setMetric(today, 'mood', f.val)}
          >
            <div className={styles.val}>{f.val}</div>
            <div className={styles.label}>{f.label}</div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
export default MoodPage;\n`,

  'src/pages/Mood/Mood.module.css': `.container { padding: 2rem; max-width: 800px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 4rem; }
.header h1 { font-family: 'Outfit'; font-size: 2.5rem; color: #fff; letter-spacing: 0.1em; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; }
.face { background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.05); padding: 2rem 1rem; border-radius: var(--radius-lg); cursor: pointer; transition: 0.2s; text-align: center; }
.face:hover { transform: translateY(-5px); border-color: var(--mood-color); }
.active { border-color: var(--mood-color); background: rgba(0,0,0,0.5); box-shadow: 0 0 30px rgba(0,0,0,0.5), inset 0 0 20px var(--mood-color); }
.val { font-family: 'Outfit'; font-size: 2.5rem; font-weight: 900; color: #fff; margin-bottom: 0.5rem; }
.label { font-size: 0.6rem; font-weight: 800; color: var(--mood-color); letter-spacing: 0.1em; }\n`,

  // Nutrition Page
  'src/pages/Nutrition/NutritionPage.jsx': `import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useMetricsStore } from '../../store/metricsStore';
import { getTodayStr } from '../../utils/dateUtils';
import styles from './Nutrition.module.css';

const NutritionPage = () => {
  const { dailyMetrics, setMetric } = useMetricsStore();
  const today = getTodayStr();
  const calories = dailyMetrics[today]?.calories || 0;
  const protein = dailyMetrics[today]?.protein || 0;

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>FUEL PROTOCOL</h1>
        <p>Log caloric intake and essential macronutrients.</p>
      </header>

      <div className={styles.logGrid}>
        <div className={styles.inputCard}>
          <label>CALORIES (KCAL)</label>
          <input 
            type="number" 
            value={calories} 
            onChange={(e) => setMetric(today, 'calories', parseInt(e.target.value))} 
            className={styles.numInput}
          />
        </div>
        <div className={styles.inputCard}>
          <label>PROTEIN (G)</label>
          <input 
            type="number" 
            value={protein} 
            onChange={(e) => setMetric(today, 'protein', parseInt(e.target.value))} 
            className={styles.numInput}
          />
        </div>
      </div>
    </PageWrapper>
  );
};
export default NutritionPage;\n`,

  'src/pages/Nutrition/Nutrition.module.css': `.container { padding: 2rem; max-width: 800px; margin: 0 auto; }
.header { margin-bottom: 3rem; }
.header h1 { font-family: 'Outfit'; font-size: 2.5rem; color: #fff; }
.logGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.inputCard { background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
.numInput { background: transparent; border: none; border-bottom: 2px solid var(--rank-alpha); width: 100%; font-size: 3rem; font-weight: 900; color: #fff; text-align: center; font-family: 'Outfit'; outline: none; margin-top: 1rem; }\n`,

  // Aura History Ledger Fix
  'src/pages/History/AuraHistoryPage.jsx': `import React from 'react';
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
export default AuraHistoryPage;\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
