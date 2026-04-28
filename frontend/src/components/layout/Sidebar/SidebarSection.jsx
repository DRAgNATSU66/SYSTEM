import React from 'react';
import styles from './Sidebar.module.css';

const SidebarSection = ({ title, children }) => {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionContent}>
        {children}
      </div>
    </div>
  );
};
export default SidebarSection;
