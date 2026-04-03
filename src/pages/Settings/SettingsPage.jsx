import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useUserStore } from '../../store/userStore';
import { userService } from '../../services/userService';
import PulseCore from '../../components/ui/PulseCore/PulseCore';
import { DEFAULT_WEIGHTS } from '../../constants/scoreWeights';
import styles from './Settings.module.css';

const SettingsPage = () => {
  const { user, profile, updateProfile } = useUserStore();
  const [name, setName] = useState(profile.name);
  const [saved, setSaved] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    updateProfile({ name, username: name });
    // Persist to Supabase if user is authenticated
    if (user?.id) {
      try {
        await userService.updateProfile(user.id, { username: name });
      } catch (err) {
        console.warn('[Settings] profile update failed:', err);
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>OS . CONFIG</h1>
          <p>System parameters and user preferences.</p>
        </div>
        <div className={styles.breathingZone}>
          <PulseCore />
          <span className={styles.breathingLabel}>20S CYCLE</span>
        </div>
      </header>
      
      <section className={styles.section}>
        <h2>CORE IDENTITY</h2>
        <form onSubmit={handleUpdate} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>PLAYER NAME</label>
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
              value={user?.id || 'LOCAL SNAPSHOT'} 
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
        <div className={styles.systemTools}>
          {deferredPrompt && (
            <div className={styles.installZone}>
              <p>Install SYSTEM as a native OS application.</p>
              <button className={styles.btnInstall} onClick={handleInstall}>INSTALL OS</button>
            </div>
          )}
          
          <div className={styles.dangerZone}>
            <p>&#9888;&#65039; Danger zone: wipe local state caches. This action is irreversible.</p>
            <button className={styles.btnDelete} onClick={() => {
              if(window.confirm('Wipe local OS state? This cannot be undone.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}>PURGE LOCAL CACHE</button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};
export default SettingsPage;
