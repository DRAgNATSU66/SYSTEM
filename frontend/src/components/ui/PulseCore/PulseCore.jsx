import React from 'react';
import styles from './PulseCore.module.css';

const PulseCore = ({ status = 'alpha' }) => {
  return (
    <div className={`${styles.container} ${status ? styles[status] : ''}`}>
      <div className={`${styles.ring} ${styles.r1}`} />
      <div className={`${styles.ring} ${styles.r2}`} />
      <div className={`${styles.ring} ${styles.r3}`} />
      <div className={styles.core} />
    </div>
  );
};
export default PulseCore;
