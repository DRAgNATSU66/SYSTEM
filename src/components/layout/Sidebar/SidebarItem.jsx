import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PlayCircle, XCircle } from 'lucide-react';
import styles from './Sidebar.module.css';

const SidebarItem = ({ to, icon, label, exact, progressData }) => {
  const [showProgress, setShowProgress] = useState(false);

  return (
    <div className={styles.itemWrapper}>
      <div className={styles.mainLink}>
        <NavLink 
          to={to} 
          end={exact}
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
        >
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </NavLink>
        
        {progressData && (
          <button 
            className={`${styles.playBtn} ${showProgress ? styles.active : ''}`} 
            onClick={() => setShowProgress(!showProgress)}
          >
            {showProgress ? <XCircle size={14} /> : <PlayCircle size={14} />}
          </button>
        )}
      </div>

      {showProgress && progressData && (
        <div className={styles.progressFlyout}>
          <div className={styles.linearProgressContainer}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>{progressData.label}</span>
              <span className={styles.progressValue}>{Math.round(progressData.value)}%</span>
            </div>
            <div className={styles.progressBarBg}>
              <div 
                className={styles.progressBarFill} 
                style={{ 
                  width: `${progressData.value}%`,
                  backgroundColor: progressData.color || 'var(--rank-alpha)'
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
