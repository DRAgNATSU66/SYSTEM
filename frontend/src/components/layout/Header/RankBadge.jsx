import React from 'react';
import styles from './Header.module.css';

const RankBadge = ({ label, color }) => {
  const c = color || '#FF3131';
  return (
    <div
      className={styles.rankBadge}
      style={{
        '--badge-color': c,
        boxShadow: `0 0 12px ${c}40, inset 0 0 8px ${c}20`
      }}
    >
      <div className={styles.pulse} style={{ backgroundColor: c }} />
      <span className={styles.rankTitle} style={{ color: c }}>{(label || 'RANKING...').toUpperCase()}</span>
    </div>
  );
};
export default RankBadge;
