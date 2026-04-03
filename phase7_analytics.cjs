const fs = require('fs');
const path = require('path');

const files = {
  // Settings Page
  'src/pages/Settings/SettingsPage.jsx': `import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useUserStore } from '../../store/userStore';
import { DEFAULT_WEIGHTS } from '../../constants/scoreWeights';
import styles from './Settings.module.css';

const SettingsPage = () => {
  const { user, profile, updateProfile, preferences } = useUserStore();
  const [name, setName] = useState(profile.name);
  const [saved, setSaved] = useState(false);

  const handleUpdate = (e) => {
    e.preventDefault();
    updateProfile({ name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>OS . CONFIG</h1>
        <p>System parameters and user preferences.</p>
      </header>
      
      <section className={styles.section}>
        <h2>CORE IDENTITY</h2>
        <form onSubmit={handleUpdate} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>DISPLAY NAME</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className={styles.input} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>CIPHER ID</label>
            <input 
              type="text" 
              value={user?.id || 'LOCAL_SNAPSHOT'} 
              readOnly 
              className={styles.inputReadOnly} 
            />
          </div>
          <button type="submit" className={styles.btnSave}>
            {saved ? 'PARAMETERS UPDATED' : 'UPDATE IDENTITY'}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2>AURA WEIGHTS</h2>
        <p className={styles.desc}>Calibrate the importance of specific performance vectors.</p>
        <div className={styles.weightList}>
          {Object.entries(DEFAULT_WEIGHTS).map(([key, value]) => (
            <div key={key} className={styles.weightItem}>
              <span className={styles.weightLabel}>{key.toUpperCase()}</span>
              <span className={styles.weightValue}>{value}x</span>
            </div>
          ))}
        </div>
      </section>
      
      <section className={styles.section}>
        <h2>SYSTEM</h2>
        <div className={styles.dangerZone}>
          <p>Danger zone: wipe local state caches.</p>
          <button className={styles.btnDelete} onClick={() => {
            if(window.confirm('Wipe local OS state?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}>PURGE LOCAL CACHE</button>
        </div>
      </section>
    </PageWrapper>
  );
};
export default SettingsPage;\n`,

  'src/pages/Settings/Settings.module.css': `.container { padding: 2rem; max-width: 800px; margin: 0 auto; }
.header { margin-bottom: 2rem; }
.header h1 { font-family: 'Outfit'; font-size: 2.5rem; color: #fff; letter-spacing: 0.1em; }
.section { margin-bottom: 3rem; background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: var(--radius-lg); }
.section h2 { font-family: 'Outfit'; font-size: 1.1rem; color: var(--rank-alpha); margin-bottom: 1.5rem; letter-spacing: 0.1em; }
.desc { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; }
.form { display: flex; flex-direction: column; gap: 1.5rem; }
.inputGroup { display: flex; flex-direction: column; gap: 0.5rem; }
.inputGroup label { font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); letter-spacing: 0.05em; }
.input { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 0.8rem; border-radius: var(--radius-sm); color: #fff; font-family: inherit; }
.input:focus { outline: none; border-color: var(--rank-alpha); }
.inputReadOnly { background: rgba(0,0,0,0.1); border: 1px solid transparent; padding: 0.8rem; border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 0.8rem; pointer-events: none; }
.btnSave { background: var(--rank-alpha); color: #000; padding: 1rem; border: none; border-radius: var(--radius-sm); font-family: 'Outfit'; font-weight: 900; cursor: pointer; transition: 0.2s; }
.btnSave:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,191,255,0.3); }
.weightList { display: flex; flex-direction: column; gap: 1rem; }
.weightItem { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; }
.weightLabel { font-size: 0.8rem; color: var(--text-secondary); }
.weightValue { font-family: 'Outfit'; color: #fff; font-weight: 800; }
.dangerZone { color: var(--rank-slacking); border: 1px solid rgba(255,49,49,0.1); padding: 1.5rem; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; }
.btnDelete { background: transparent; border: 1px solid var(--rank-slacking); color: var(--rank-slacking); padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-weight: 800; cursor: pointer; }
.btnDelete:hover { background: var(--rank-slacking); color: #000; }\n`,

  // Aura History Ledger
  'src/pages/History/AuraHistoryPage.jsx': `import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import styles from './History.module.css';

const AuraHistoryPage = () => {
  const { auraLogs = [] } = useAuraStore();

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>TRANSACTION LEDGER</h1>
        <p>Historical log of every AP vector.</p>
      </header>
      
      <div className={styles.ledger}>
        {auraLogs.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No ledger entries found. OS initialization required.</p>}
        {auraLogs.map((log, idx) => (
          <div key={idx} className={styles.entry}>
            <div className={styles.date}>{log.date}</div>
            <div className={styles.reason}>{log.reason}</div>
            <div className={log.net_earned >= 0 ? styles.positive : styles.negative}>
               {log.net_earned >= 0 ? '+' : ''}{log.net_earned} AP
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
export default AuraHistoryPage;\n`,

  'src/pages/History/History.module.css': `.container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
.header { margin-bottom: 3rem; }
.header h1 { font-family: 'Outfit'; font-size: 2.5rem; color: #fff; letter-spacing: 0.1em; }
.ledger { display: flex; flex-direction: column; gap: 0.5rem; }
.entry { display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.05); padding: 1rem 1.5rem; border-radius: var(--radius-md); }
.date { font-family: 'Outfit'; font-size: 0.8rem; color: var(--text-secondary); width: 100px; }
.reason { flex: 1; color: #fff; font-weight: 600; padding: 0 1rem; }
.positive { color: var(--rank-sigma); font-family: 'Outfit'; font-weight: 900; }
.negative { color: var(--rank-slacking); font-family: 'Outfit'; font-weight: 900; }\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
