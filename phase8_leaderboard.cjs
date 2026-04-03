const fs = require('fs');
const path = require('path');

const files = {
  // Leaderboard Page
  'src/pages/Leaderboard/LeaderboardPage.jsx': `import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import styles from './Leaderboard.module.css';

const MOCK_LEADERS = [
  { rank: 1, name: 'GOGGINS_CLONE', score: 14500, status: 'IM HIM' },
  { rank: 2, name: 'SILICON_MONK', score: 12200, status: 'IM HIM' },
  { rank: 3, name: 'NEURO_GRINDER', score: 11000, status: 'GRINDER' },
  { rank: 4, name: 'PROTO_ALPHA', score: 9800, status: 'GRINDER' },
  { rank: 5, name: 'ZEN_ARCHITECT', score: 8500, status: 'GRINDER' },
];

const LeaderboardPage = () => {
  const { totalAuraPoints } = useAuraStore();
  
  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>GLOBAL HIERARCHY</h1>
        <p>The top 0.1% performance vectors in the network.</p>
      </header>

      <div className={styles.yourStatus}>
        <div className={styles.statusLabel}>YOUR CURRENT AURA</div>
        <div className={styles.statusValue}>{totalAuraPoints} AP</div>
      </div>

      <div className={styles.leaderList}>
        {MOCK_LEADERS.map(leader => (
          <div key={leader.rank} className={styles.leaderRow}>
            <div className={styles.rank}>#{leader.rank}</div>
            <div className={styles.identity}>
              <div className={styles.name}>{leader.name}</div>
              <div className={styles.tier} style={{ color: leader.status === 'IM HIM' ? 'var(--rank-alpha)' : 'var(--rank-sigma)' }}>
                {leader.status}
              </div>
            </div>
            <div className={styles.score}>{leader.score} AP</div>
          </div>
        ))}
      </div>
      
      <div className={styles.footer}>
        <p>Leaderboard refreshes every 24h cycle.</p>
      </div>
    </PageWrapper>
  );
};
export default LeaderboardPage;\n`,

  'src/pages/Leaderboard/Leaderboard.module.css': `.container { padding: 4rem 2rem; max-width: 800px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 4rem; }
.header h1 { font-family: 'Outfit'; font-size: 3rem; color: #fff; letter-spacing: 0.15em; }
.yourStatus { background: rgba(0,191,255,0.05); border: 1px solid var(--rank-alpha); padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 3rem; text-align: center; }
.statusLabel { font-size: 0.7rem; font-weight: 900; color: var(--rank-alpha); letter-spacing: 0.2em; margin-bottom: 0.5rem; }
.statusValue { font-family: 'Outfit'; font-size: 2.5rem; font-weight: 900; color: #fff; }
.leaderList { display: flex; flex-direction: column; gap: 0.75rem; }
.leaderRow { display: flex; align-items: center; background: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.05); transition: 0.2s; }
.leaderRow:hover { transform: scale(1.02); border-color: rgba(255,255,255,0.2); }
.rank { font-family: 'Outfit'; font-size: 1.5rem; font-weight: 900; color: var(--text-secondary); width: 60px; }
.identity { flex: 1; }
.name { font-family: 'Outfit'; font-size: 1.1rem; color: #fff; font-weight: 700; }
.tier { font-size: 0.6rem; font-weight: 900; letter-spacing: 0.1em; margin-top: 4px; }
.score { font-family: 'Outfit'; font-size: 1.2rem; font-weight: 900; color: var(--rank-sigma); }
.footer { margin-top: 4rem; text-align: center; color: var(--text-secondary); font-size: 0.7rem; font-style: italic; }\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
