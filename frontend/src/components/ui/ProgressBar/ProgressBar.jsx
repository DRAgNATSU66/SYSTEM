import React from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ value, label, color = 'var(--rank-alpha)', height = '8px' }) => {
  const percentage = Math.min(100, Math.max(0, value));
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{Math.round(percentage)}%</span>
      </div>
      <div className={styles.track} style={{ height }}>
        <div 
          className={styles.fill} 
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}44`
          }} 
        />
      </div>
    </div>
  );
};

export default ProgressBar;
