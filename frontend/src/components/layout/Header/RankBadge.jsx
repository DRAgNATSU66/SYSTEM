import React from 'react';
import styles from './Header.module.css';

const RankBadge = ({ label, color }) => {
  const c = color || 'var(--rank-slacking)';
  return (
    <div
      className={styles.rankBadge}
      style={{
        '--badge-color': c,
        // 25.1% / 12.55% = the old hex alphas 0x40 / 0x20; color-mix also works when c is a var()
        boxShadow: `0 0 12px color-mix(in srgb, ${c} 25.1%, transparent), inset 0 0 8px color-mix(in srgb, ${c} 12.55%, transparent)`
      }}
    >
      <div className={styles.pulse} style={{ backgroundColor: c }} />
      <span className={styles.rankTitle} style={{ color: c }}>{(label || 'RANKING...').toUpperCase()}</span>
    </div>
  );
};
export default RankBadge;
