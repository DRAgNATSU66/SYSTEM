import React, { useState } from 'react';
import { useTaskStore } from '../../../store/taskStore';
import { TASK_TYPES } from '../../../constants/taskTypes';
import styles from './TaskForm.module.css';

const TaskForm = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState(TASK_TYPES.PERMANENT_DAILY);
  const [weight, setWeight] = useState(100);
  const addTask = useTaskStore(state => state.addTask);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title, type, weight: Number(weight), method: 'checkbox' });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>New Directive</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input 
            type="text" 
            placeholder="e.g. 10 Pages Reading" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className={styles.input}
            autoFocus 
          />
          <div className={styles.row}>
            <select value={type} onChange={(e) => setType(e.target.value)} className={styles.input}>
              <option value={TASK_TYPES.PERMANENT_DAILY}>Permanent Habit</option>
              <option value={TASK_TYPES.SIDE_HUSTLE}>Side Hustle / Deep Work</option>
            </select>
            <input 
              type="number" 
              value={weight} 
              onChange={e => setWeight(e.target.value)} 
              className={styles.input} 
              style={{ width: '100px' }} 
            />
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>Cancel</button>
            <button type="submit" className={styles.btnSubmit}>Initialize</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default TaskForm;
