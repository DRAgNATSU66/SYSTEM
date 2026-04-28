const fs = require('fs');
const path = require('path');

const files = {
  // Friends Page
  'src/pages/Social/FriendsPage.jsx': `import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useSocialStore } from '../../store/socialStore';
import styles from './Social.module.css';

const FriendsPage = () => {
  const { friends, addFriend } = useSocialStore();
  const [cipherInput, setCipherInput] = useState('');

  const handleAddFriend = (e) => {
    e.preventDefault();
    if(!cipherInput) return;
    addFriend({ id: Date.now(), name: 'Cipher_User_' + Math.floor(Math.random() * 1000), rank: 'Sigma', avatar: null });
    setCipherInput('');
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>NEURAL_SOCIAL_HUB</h1>
        <p>Connect with other performance vectors in the collective.</p>
      </header>

      <form onSubmit={handleAddFriend} className={styles.addForm}>
        <input 
          type="text" value={cipherInput} 
          onChange={e => setCipherInput(e.target.value)} 
          placeholder="ENTER_CIPHER_ID ..." 
          className={styles.input}
        />
        <button type="submit" className={styles.btnAdd}>CONNECT</button>
      </form>

      <div className={styles.grid}>
        {friends.map(friend => (
          <div key={friend.id} className={styles.friendCard}>
            <div className={styles.avatar}>[CIPHER_ID]</div>
            <div className={styles.info}>
              <h3>{friend.name}</h3>
              <div className={styles.status} style={{ color: 'var(--rank-sigma)' }}>{friend.rank.toUpperCase()}</div>
            </div>
            <button className={styles.btnPing}>PING</button>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
export default FriendsPage;\n`,

  'src/pages/Social/Social.module.css': `.container { padding: 4rem 2rem; max-width: 900px; margin: 0 auto; }
.header { margin-bottom: 3rem; }
.header h1 { font-family: 'Outfit'; font-size: 2.5rem; color: #fff; letter-spacing: 0.1em; }
.addForm { display: flex; gap: 1rem; margin-bottom: 4rem; }
.input { flex: 1; background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.1); padding: 1.25rem; border-radius: 8px; color: #fff; font-family: 'Outfit'; letter-spacing: 0.1em; }
.btnAdd { background: var(--rank-alpha); color: #000; padding: 1rem 2rem; border-radius: 8px; border: none; font-weight: 900; cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
.friendCard { background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1.25rem; }
.avatar { width: 50px; height: 50px; background: rgba(0,191,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 0.5rem; color: var(--rank-alpha); border-radius: 50%; border: 1px solid var(--rank-alpha); flex-shrink: 0; }
.info h3 { margin: 0; font-family: 'Outfit'; font-size: 1rem; color: #fff; }
.status { font-size: 0.6rem; font-weight: 900; letter-spacing: 0.1em; }
.btnPing { margin-left: auto; background: transparent; border: 1px dashed rgba(255,255,255,0.3); color: var(--text-secondary); padding: 4px 10px; border-radius: 4px; font-size: 0.6rem; font-weight: 900; cursor: pointer; }\n`,

  // Duel Page
  'src/pages/Duels/DuelPage.jsx': `import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useSocialStore } from '../../store/socialStore';
import styles from './Duels.module.css';

const DuelPage = () => {
  const { duels, initiateDuel } = useSocialStore();

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>AURA_DUELS</h1>
        <p>1v1 competitive sprints. 24h cycle. Winner takes all.</p>
      </header>

      <div className={styles.activeDuels}>
        {duels.map(duel => (
          <div key={duel.id} className={styles.duelCard}>
             <div className={styles.duelInfo}>
                <div className={styles.versus}>VS</div>
                <h3>{duel.opponent_name}</h3>
                <div className={styles.stake}>{duel.stake_ap} AP STAKED</div>
             </div>
             <div className={styles.progressRow}>
                <div className={styles.progressLabel}>YOU</div>
                <div className={styles.bar}><div className={styles.fill} style={{ width: '45%' }} /></div>
             </div>
             <div className={styles.progressRow}>
                <div className={styles.progressLabel}>OPPONENT</div>
                <div className={styles.bar}><div className={styles.fill} style={{ width: '32%', background: 'var(--rank-slacking)' }} /></div>
             </div>
          </div>
        ))}
        {duels.length === 0 && <p className={styles.empty}>No active duels detected. Initiate a challenge via the Social Hub.</p>}
      </div>

      <button className={styles.btnNewDuel} onClick={() => initiateDuel('001', 'GOGGINS_CLONE')}>
        SEARCH FOR OPPONENT
      </button>
    </PageWrapper>
  );
};
export default DuelPage;\n`,

  'src/pages/Duels/Duels.module.css': `.container { padding: 4rem 2rem; max-width: 1000px; margin: 0 auto; text-align: center; }
.header { margin-bottom: 5rem; }
.header h1 { font-family: 'Outfit'; font-size: 3rem; color: #fff; letter-spacing: 0.2em; }
.activeDuels { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 2rem; margin-bottom: 4rem; }
.duelCard { background: var(--bg-surface); padding: 2.5rem; border-radius: 16px; border: 1px solid var(--rank-alpha); box-shadow: 0 0 30px rgba(0,191,255,0.05); }
.duelInfo { margin-bottom: 2rem; }
.versus { font-family: 'Outfit'; font-size: 0.7rem; color: var(--rank-slacking); font-weight: 900; letter-spacing: 0.3em; margin-bottom: 0.5rem; }
.duelInfo h3 { font-size: 1.5rem; font-family: 'Outfit'; color: #fff; margin: 0 0 1rem 0; }
.stake { font-size: 0.8rem; font-weight: 800; color: var(--rank-sigma); letter-spacing: 0.1em; }
.progressRow { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
.progressLabel { width: 80px; font-size: 0.6rem; font-weight: 900; color: var(--text-secondary); text-align: left; }
.bar { flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
.fill { height: 100%; background: var(--rank-alpha); border-radius: 4px; }
.btnNewDuel { padding: 1.25rem 3rem; background: transparent; border: 2px solid var(--rank-alpha); color: var(--rank-alpha); border-radius: 8px; font-weight: 900; letter-spacing: 0.2em; cursor: pointer; transition: 0.3s; }
.btnNewDuel:hover { background: var(--rank-alpha); color: #000; box-shadow: 0 0 40px var(--rank-alpha); }\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
