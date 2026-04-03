import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import gigachad from '../../../assets/Gigachad.png';
import styles from './AuraPointsDisplay.module.css';

const AuraPointsDisplay = () => {
  const { totalAuraPoints, todayNet } = useAuraStore();
  const isPositive = todayNet >= 0;

  return (
    <div className={styles.container}>
      <h3 className={styles.label}>TOTAL AURA POINTS</h3>
      <div className={styles.value}>
        <div className={styles.iconContainer}>
          <img src={gigachad} alt="GigaChad" className={styles.brandIcon} />
        </div>
        {(totalAuraPoints || 0).toLocaleString()} AP
      </div>
      <div className={styles.delta}>
        <span className={isPositive ? styles.positive : styles.negative}>
          {isPositive ? '+' : ''}{todayNet} AP Today
        </span>
      </div>
    </div>
  );
};
export default AuraPointsDisplay;
