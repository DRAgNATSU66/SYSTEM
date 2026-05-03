import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useUserStore } from '../../store/userStore';
import { useUiStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { userService } from '../../services/userService';
import { supabase } from '../../services/supabaseClient';
import PulseCore from '../../components/ui/PulseCore/PulseCore';
import PlayerLogo from '../../assets/player-logo.png';
import { DEFAULT_WEIGHTS } from '../../constants/scoreWeights';
import styles from './Settings.module.css';

const SettingsPage = () => {
  const { user, profile, updateProfile, setAvatarUrl, cypherId, ensureCypherId } = useUserStore();
  const { offlineMode, cloudSync, toggleOfflineMode, toggleCloudSync } = useUiStore();
  const { tasks, addTask, removeTask, updateTask } = useTaskStore();
  const [name, setName] = useState(profile.name);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const fileRef = useRef(null);

  // Ensure cypher ID is generated even for local-only users
  React.useEffect(() => { ensureCypherId(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [saved, setSaved] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Task Manager state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setAvatarMsg('File too large — max 5MB'); return; }
    setAvatarUploading(true);
    setAvatarMsg('');
    try {
      if (user?.id) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        const url = `${data.publicUrl}?t=${Date.now()}`;  // cache-bust
        setAvatarUrl(url);
        await userService.updateProfile(user.id, { avatarUrl: url });
        setAvatarMsg('Avatar updated!');
      } else {
        // Offline: use local object URL
        const url = URL.createObjectURL(file);
        setAvatarUrl(url);
        setAvatarMsg('Avatar set (local only — sign in to persist).');
      }
    } catch (err) {
      setAvatarMsg(`Upload failed: ${err.message}`);
    } finally {
      setAvatarUploading(false);
      setTimeout(() => setAvatarMsg(''), 4000);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    updateProfile({ name, username: name });
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

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({ title: newTaskTitle.trim(), type: 'permanent' });
    setNewTaskTitle('');
  };

  const handleEditSave = (id) => {
    if (!editTitle.trim()) return;
    updateTask(id, { title: editTitle.trim() });
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>OS . CONFIG</h1>
          <p>System parameters and user preferences.</p>
        </div>
        <div className={styles.breathingZone}>
          <PulseCore />
          <span className={styles.breathingLabel}>20S CYCLE</span>
        </div>
      </div>

      {/* ── Identity Avatar ── */}
      <section className={styles.section}>
        <h2>IDENTITY AVATAR</h2>
        <p className={styles.desc}>Upload a profile picture — shown in the header and sidebar.</p>
        <div className={styles.avatarRow}>
          <img
            src={profile?.avatarUrl || PlayerLogo}
            alt="avatar"
            className={styles.avatarPreview}
            onError={e => { e.target.src = PlayerLogo; }}
          />
          <div className={styles.avatarActions}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              className={styles.btnSave}
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              style={{ marginTop: 0 }}
            >
              {avatarUploading ? 'UPLOADING…' : 'UPLOAD IMAGE'}
            </button>
            {avatarMsg && <p style={{ color: avatarMsg.includes('fail') ? 'var(--color-red)' : 'var(--color-green)', fontSize: '0.78rem', marginTop: '0.5rem' }}>{avatarMsg}</p>}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '0.35rem' }}>JPG, PNG, WEBP · Max 5MB</p>
          </div>
        </div>
      </section>

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
              value={cypherId || 'GENERATING...'}
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
        <h2>TASK MANAGER</h2>
        <p className={styles.desc}>Manage your permanent Daily Loop tasks shown on the dashboard.</p>
        <form onSubmit={handleAddTask} className={styles.taskForm}>
          <input
            type="text"
            className={styles.input}
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="New task name..."
          />
          <button type="submit" className={styles.btnSave} style={{ marginTop: 0 }}>+ ADD TASK</button>
        </form>
        <div className={styles.taskManagerList}>
          {tasks.length === 0 && <p className={styles.desc}>No tasks yet. Add one above.</p>}
          {tasks.map(task => (
            <div key={task.id} className={styles.taskManagerItem}>
              {editingId === task.id ? (
                <>
                  <input
                    className={styles.input}
                    style={{ flex: 1, marginBottom: 0 }}
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    autoFocus
                  />
                  <button className={styles.btnSave} style={{ padding: '0.5rem 1rem', marginTop: 0 }} onClick={() => handleEditSave(task.id)}>SAVE</button>
                  <button className={styles.btnDeleteTask} onClick={() => setEditingId(null)}>CANCEL</button>
                </>
              ) : (
                <>
                  <span className={styles.taskItemTitle}>{task.title || task.name || 'Unnamed'}</span>
                  <button
                    className={styles.btnEditTask}
                    onClick={() => { setEditingId(task.id); setEditTitle(task.title || task.name || ''); }}
                  >EDIT</button>
                  <button className={styles.btnDeleteTask} onClick={() => removeTask(task.id)}>✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>AURA WEIGHTS</h2>
        <p className={styles.desc}>Daily Core = 1000 AP, Misc (Goals/Hobbies/Projects) = 1000 AP, Total = 2000 AP/day.</p>
        <h3 style={{ color: 'var(--rank-alpha)', margin: '1rem 0 0.5rem', fontSize: '0.75rem', letterSpacing: '0.15em' }}>DAILY CORE (1000 AP)</h3>
        <div className={styles.weightList}>
          {Object.entries(DEFAULT_WEIGHTS).map(([key, value]) => (
            <div key={key} className={styles.weightItem}>
              <span className={styles.weightLabel}>{key.toUpperCase()}</span>
              <span className={styles.weightValue}>{value} AP</span>
            </div>
          ))}
        </div>
        <h3 style={{ color: 'var(--rank-alpha)', margin: '1rem 0 0.5rem', fontSize: '0.75rem', letterSpacing: '0.15em' }}>MISC / SIDE (1000 AP)</h3>
        <div className={styles.weightList}>
          <div className={styles.weightItem}>
            <span className={styles.weightLabel}>GOALS / HOBBIES / PROJECTS</span>
            <span className={styles.weightValue}>1000 AP (proportional)</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>CONNECTIVITY</h2>
        <p className={styles.desc}>Control sync and offline behaviour.</p>
        <div className={styles.toggleList}>
          <div className={styles.toggleItem}>
            <div>
              <div className={styles.toggleLabel}>OFFLINE MODE</div>
              <div className={styles.toggleDesc}>Store all data locally. Disable cloud writes.</div>
            </div>
            <button
              className={`${styles.toggleBtn} ${offlineMode ? styles.toggleActive : ''}`}
              onClick={toggleOfflineMode}
            >
              {offlineMode ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className={styles.toggleItem}>
            <div>
              <div className={styles.toggleLabel}>CLOUD SYNC</div>
              <div className={styles.toggleDesc}>Sync data to Supabase cloud in real time.</div>
            </div>
            <button
              className={`${styles.toggleBtn} ${cloudSync ? styles.toggleActive : ''}`}
              onClick={toggleCloudSync}
            >
              {cloudSync ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        {offlineMode && (
          <p className={styles.syncStatus}>OFFLINE MODE ACTIVE — changes stored locally only.</p>
        )}
        {!offlineMode && cloudSync && (
          <p className={styles.syncStatus} style={{ color: 'var(--rank-sigma)' }}>CLOUD SYNC ACTIVE — data syncing to Supabase.</p>
        )}
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
              if (window.confirm('Wipe local OS state? This cannot be undone.')) {
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
