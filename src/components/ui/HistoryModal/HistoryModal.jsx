import React from 'react';
import { X } from 'lucide-react';
import styles from './HistoryModal.module.css';

const HistoryModal = ({ title, items, onClose, onDelete, type }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{title} HISTORY</h2>
          <button className={styles.btnClose} onClick={onClose}><X size={20} /></button>
        </header>

        <div className={styles.content}>
          {items.length === 0 && <p className={styles.empty}>No archived records found.</p>}
          <div className={styles.list}>
            {items.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.info}>
                  <h3>{item.title}</h3>
                  <p className={styles.meta}>
                    {type === 'goal' && `Achieved: ${new Date(item.completedAt).toLocaleDateString()}`}
                    {type === 'project' && `Archived: ${new Date(item.archivedAt).toLocaleDateString()} | ${item.total_hours}h`}
                    {type === 'hobby' && `Dropped: ${new Date(item.archivedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button 
                  className={styles.btnDelete} 
                  onClick={() => onDelete(item.id)}
                  title="Purge permanently"
                >
                  PURGE
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
