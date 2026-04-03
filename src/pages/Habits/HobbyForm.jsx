import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useHobbyStore } from '../../store/assetStores';
import styles from './HobbyForm.module.css';

const HobbyForm = ({ onClose }) => {
  const addHobby = useHobbyStore(state => state.addHobby);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('PERMANENT');
  const [categories, setCategories] = useState([]);

  const toggleCategory = (cat) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    
    addHobby({
      title,
      type,
      categories,
      lastLogged: null
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>INITIALIZE HOBBY</h2>
          <button className={styles.btnClose} onClick={onClose}><X size={20} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>HOBBY NAME</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. DIGITAL ART, CHESS..."
              className={styles.input}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label>OPERATIONAL TYPE</label>
            <div className={styles.typeGrid}>
              {['TEMPORARY', 'PERMANENT', 'SOMETIMES'].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.typeBtn} ${type === t ? styles.activeType : ''}`}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>NEURAL CATEGORIES (MULTI-SELECT)</label>
            <div className={styles.categoryGrid}>
              {['INTELLECTUAL', 'CREATIVE', 'COMPETITIVE'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.catBtn} ${categories.includes(cat) ? styles.activeCat : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.btnSubmit}>COMMIT HOBBY</button>
        </form>
      </div>
    </div>
  );
};

export default HobbyForm;
