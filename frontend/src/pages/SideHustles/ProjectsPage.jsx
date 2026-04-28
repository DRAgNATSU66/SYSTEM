import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useProjectStore } from '../../store/assetStores';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { projectService } from '../../services/projectService';
import HistoryModal from '../../components/ui/HistoryModal/HistoryModal';
import styles from './Projects.module.css';

const ProjectsPage = () => {
  const { projects, projectsHistory, sessions, addProject, logSession, updateProjectStatus, deleteProject } = useProjectStore();
  const { addCategoryAP, checkAndUpdateStreak, resetDailyIfNeeded } = useAuraStore();
  const { user } = useUserStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [type] = useState('CS');
  const [showHistory, setShowHistory] = useState(false);
  const [focusRatings, setFocusRatings] = useState({});

  const handleAddProject = (e) => {
    e.preventDefault();
    if(!newProjectName) return;
    if (user?.id) {
      projectService.addProject(user.id, newProjectName, type, '#00BFFF', 'UPCOMING');
    } else {
      addProject(newProjectName, type, '#00BFFF', 'UPCOMING');
    }
    setNewProjectName('');
  };

  const handleLogFocus = (projectId, title) => {
    const rating = Math.min(10, Math.max(1, parseInt(focusRatings[projectId] ?? 8, 10) || 8));
    resetDailyIfNeeded();
    if (user?.id) {
      projectService.logSession(user.id, projectId, 1, rating, title);
    } else {
      logSession(projectId, 1, rating, title);
    }
    addCategoryAP('MISC', 200, `Deep Work: ${title}`);
    checkAndUpdateStreak();
  };

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <h1>PROJECT MATRIX</h1>
        <p>Log focus sessions against strategic outcome vectors.</p>
      </div>

      <form onSubmit={handleAddProject} className={styles.addForm}>
        <input 
          type="text" value={newProjectName} 
          onChange={e => setNewProjectName(e.target.value)} 
          placeholder="New project / hustle..." 
          className={styles.input}
        />
        <button type="submit" className={styles.btnAdd}>INITIALIZE PROJECT</button>
        <button type="button" className={styles.btnHistory} onClick={() => setShowHistory(true)}>HISTORY</button>
      </form>

      <div className={styles.grid}>
        {projects.map(project => (
          <div key={project.id} className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <h3>{project.title}</h3>
              <div className={styles.hours}>{project.total_hours}h LOGGED</div>
            </div>
            
            <div className={styles.projectActions}>
              <div className={styles.focusRatingRow}>
                <span className={styles.focusLabel}>FOCUS RATING</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={focusRatings[project.id] ?? 8}
                  onChange={e => setFocusRatings(prev => ({ ...prev, [project.id]: e.target.value }))}
                  className={styles.focusInput}
                />
                <span className={styles.focusMax}>/10</span>
              </div>
              <button
                onClick={() => handleLogFocus(project.id, project.title)}
                className={styles.btnSession}
              >
                +1H FOCUS SESSION
              </button>
              <button
                onClick={() => {
                  if (user?.id) projectService.updateStatus(user.id, project.id, 'ARCHIVED');
                  else updateProjectStatus(project.id, 'ARCHIVED');
                }}
                className={styles.btnArchive}
              >
                ARCHIVE
              </button>
              <button
                onClick={() => {
                  if (user?.id) projectService.deleteProject(user.id, project.id);
                  else deleteProject(project.id);
                }}
                className={styles.btnPurge}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {showHistory && (
        <HistoryModal 
          title="PROJECTS" 
          items={projectsHistory} 
          type="project"
          onClose={() => setShowHistory(false)} 
          onDelete={(id) => {
            if (user?.id) projectService.deleteProject(user.id, id, true);
            else deleteProject(id, true);
          }}
        />
      )}
      
      <section className={styles.history}>
        <h2>RECENT SESSIONS</h2>
        {[...sessions].reverse().slice(0, 5).map(s => (
          <div key={s.id} className={styles.sessionLine}>
             <span>{s.date}</span>
             <span>{s.project_title || '+1h Deep Work'}</span>
             <span className={styles.efficiency}>{s.efficiency}/10 FOCUS</span>
          </div>
        ))}
      </section>
    </PageWrapper>
  );
};
export default ProjectsPage;
