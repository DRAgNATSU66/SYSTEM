const fs = require('fs');
const path = require('path');

const files = {
  // AuraPointsDisplay
  'src/components/gamification/AuraPointsDisplay/AuraPointsDisplay.jsx': `import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import styles from './AuraPointsDisplay.module.css';

const AuraPointsDisplay = () => {
  const { totalAuraPoints, todayNet } = useAuraStore();
  const isPositive = todayNet >= 0;

  return (
    <div className={styles.container}>
      <h3 className={styles.label}>TOTAL AURA POINTS</h3>
      <div className={styles.value}>
        <span className={styles.icon}>💜</span>
        {totalAuraPoints.toLocaleString()} AP
      </div>
      <div className={styles.delta}>
        <span className={isPositive ? styles.positive : styles.negative}>
          {isPositive ? '+' : ''}{todayNet} AP Today
        </span>
      </div>
    </div>
  );
};
export default AuraPointsDisplay;\n`,

  'src/components/gamification/AuraPointsDisplay/AuraPointsDisplay.module.css': `.container {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-family: 'Outfit', sans-serif;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.value {
  font-size: 2rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
}

.icon {
  filter: drop-shadow(0 0 8px rgba(186, 85, 211, 0.5));
}

.delta {
  font-size: 0.9rem;
  font-weight: 600;
}

.positive {
  color: var(--rank-sigma);
}

.negative {
  color: var(--rank-slacking);
}\n`,

  // StreakCounter
  'src/components/gamification/StreakCounter/StreakCounter.jsx': `import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import styles from './StreakCounter.module.css';

const StreakCounter = () => {
  const { streakDays } = useAuraStore();
  
  return (
    <div className={styles.container}>
      <h3 className={styles.label}>STREAK</h3>
      <div className={styles.value}>
        <span className={streakDays > 0 ? styles.fireActive : styles.fireInactive}>🔥</span>
        {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
      </div>
    </div>
  );
};
export default StreakCounter;\n`,

  'src/components/gamification/StreakCounter/StreakCounter.module.css': `.container {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-family: 'Outfit', sans-serif;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.value {
  font-size: 2rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
}

.fireActive {
  filter: drop-shadow(0 0 10px #FF4500);
}

.fireInactive {
  filter: grayscale(100%);
  opacity: 0.5;
}\n`,

  // MultiplierBadge
  'src/components/gamification/MultiplierBadge/MultiplierBadge.jsx': `import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import styles from './MultiplierBadge.module.css';

const MultiplierBadge = () => {
  const { multiplier, streakDays } = useAuraStore();
  
  return (
    <div className={styles.container}>
      <h3 className={styles.label}>MULTIPLIER</h3>
      <div className={styles.badge} style={{ '--mult-glow': multiplier > 1.0 ? '#FFD700' : 'transparent' }}>
        <span className={styles.value}>{multiplier.toFixed(1)}x</span>
      </div>
    </div>
  );
};
export default MultiplierBadge;\n`,

  'src/components/gamification/MultiplierBadge/MultiplierBadge.module.css': `.container {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-family: 'Outfit', sans-serif;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 0 15px var(--mult-glow);
}\n`,

  // XPBar
  'src/components/gamification/XPBar/XPBar.jsx': `import React from 'react';
import { useScoreStore } from '../../../store/scoreStore';
import { RANKS } from '../../../constants/ranks';
import styles from './XPBar.module.css';

const XPBar = () => {
  const { todayScore } = useScoreStore();
  
  // Find next rank threshold
  const rankEntries = Object.values(RANKS).sort((a, b) => a.min - b.min);
  let nextRank = null;
  let currentRank = rankEntries[0];
  
  for (let i = 0; i < rankEntries.length; i++) {
    if (todayScore >= rankEntries[i].min) {
      currentRank = rankEntries[i];
      nextRank = rankEntries[i + 1] || rankEntries[i]; 
    }
  }

  const progress = Math.min(((todayScore - currentRank.min) / ((nextRank.min - currentRank.min) || 1)) * 100, 100);
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>DAILY RANK PROG</span>
        <span className={styles.score}>{todayScore} / {nextRank.min}</span>
      </div>
      <div className={styles.track}>
        <div 
          className={styles.fill} 
          style={{ width: \`\${progress}%\`, backgroundColor: currentRank.color }} 
        />
      </div>
    </div>
  );
};
export default XPBar;\n`,

  'src/components/gamification/XPBar/XPBar.module.css': `.container {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-family: 'Outfit', sans-serif;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.score {
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
}

.track {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition: width var(--transition-normal);
}\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
