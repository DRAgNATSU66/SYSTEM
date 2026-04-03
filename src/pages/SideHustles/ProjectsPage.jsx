import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useProjectStore } from '../../store/assetStores';
import { useAuraStore } from '../../store/auraStore';
import HistoryModal from '../../components/ui/HistoryModal/HistoryModal';
import styles from './Projects.module.css';

const ProjectsPage = () => {
  const { projects, projectsHistory, sessions, addProject, logSession, updateProjectStatus, deleteProject } = useProjectStore();
  const addAuraPoints = useAuraStore(state => state.addAuraPoints);
  const [newProjectName, setNewProjectName] = useState('');
  const [type] = useState('CS');
  const [showHistory, setShowHistory] = useState(false);

  const handleAddProject = (e) => {
    e.preventDefault();
    if(!newProjectName) return;
    addProject(newProjectName, type, '#00BFFF', 'UPCOMING');
    setNewProjectName('');
  };

  const handleLogFocus = (projectId, title) => {
    logSession(projectId, 1, 8);
    addAuraPoints(200, `Deep Work: ${title}`);
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>PROJECT MATRIX</h1>
        <p>Log focus sessions against strategic outcome vectors.</p>
      </header>

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
              <button 
                onClick={() => handleLogFocus(project.id, project.title)} 
                className={styles.btnSession}
              >
                +1H FOCUS SESSION
              </button>
              <button 
                onClick={() => updateProjectStatus(project.id, 'ARCHIVED')} 
                className={styles.btnArchive}
              >
                ARCHIVE
              </button>
              <button 
                onClick={() => deleteProject(project.id)} 
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
          onDelete={(id) => deleteProject(id, true)}
        />
      )}
      
      <section className={styles.history}>
        <h2>RECENT SESSIONS</h2>
        {sessions.slice(-5).map(s => (
          <div key={s.id} className={styles.sessionLine}>
             <span>{s.date}</span>
             <span>+1h Deep Work</span>
             <span className={styles.efficiency}>{s.efficiency}/10 FOCUS</span>
          </div>
        ))}
      </section>
    </PageWrapper>
  );
};
export default ProjectsPage;
