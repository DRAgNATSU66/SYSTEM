import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import styles from './MultiplierBadge.module.css';

const MultiplierBadge = () => {
  const { multiplier } = useAuraStore();
  
  return (
    <div className={styles.container}>
      <h3 className={styles.label}>MULTIPLIER</h3>
      <div className={styles.badge} style={{ '--mult-glow': multiplier > 1.0 ? '#FFD700' : 'transparent' }}>
        <span className={styles.value}>{multiplier.toFixed(1)}x</span>
      </div>
    </div>
  );
};
export default MultiplierBadge;
