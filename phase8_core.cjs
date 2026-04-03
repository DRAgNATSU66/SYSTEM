const fs = require('fs');
const path = require('path');

const files = {
  // Goals Page
  'src/pages/Goals/GoalsPage.jsx': `import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useGoalStore } from '../../store/assetStores';
import { useAuraStore } from '../../store/auraStore';
import styles from './Goals.module.css';

const GoalsPage = () => {
  const { goals, addGoal, completeGoal, deleteGoal } = useGoalStore();
  const { totalAuraPoints } = useAuraStore(); // Just to show status
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if(!newTitle) return;
    addGoal({ title: newTitle, bounty: 1000 });
    setNewTitle('');
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>STRATEGIC MILESTONES</h1>
        <p>Set long-term targets to unlock massive Aura Bounties.</p>
      </header>

      <form onSubmit={handleAdd} className={styles.addForm}>
        <input 
          type="text" value={newTitle} 
          onChange={e => setNewTitle(e.target.value)} 
          placeholder="New milestone..." 
          className={styles.input}
        />
        <button type="submit" className={styles.btnAdd}>SET TARGET</button>
      </form>

      <div className={styles.grid}>
        {goals.map(goal => (
          <div key={goal.id} className={\`\${styles.card} \${goal.completed ? styles.completed : ''}\`}>
            <h3>{goal.title}</h3>
            <div className={styles.bounty}>{goal.bounty} AP BOUNTY</div>
            {!goal.completed && (
              <button 
                onClick={() => completeGoal(goal.id)} 
                className={styles.btnComplete}
              >
                TARGET ACHIEVED
              </button>
            )}
            <button onClick={() => deleteGoal(goal.id)} className={styles.btnDelete}>PURGE</button>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
export default GoalsPage;\n`,

  'src/pages/Goals/Goals.module.css': `.container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
.header { margin-bottom: 3rem; }
.header h1 { font-family: 'Outfit'; font-size: 2.5rem; color: #fff; letter-spacing: 0.1em; }
.addForm { display: flex; gap: 1rem; margin-bottom: 3rem; }
.input { flex: 1; background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.1); padding: 1rem; border-radius: var(--radius-md); color: #fff; }
.btnAdd { background: var(--rank-alpha); color: #000; padding: 1rem 2rem; border-radius: var(--radius-md); border: none; font-weight: 900; cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.card { background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: var(--radius-lg); position: relative; transition: 0.3s; }
.card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.2); }
.card h3 { font-family: 'Outfit'; margin-bottom: 1rem; color: #fff; }
.bounty { font-size: 0.8rem; font-weight: 800; color: var(--rank-sigma); margin-bottom: 1.5rem; }
.completed { opacity: 0.6; border-color: var(--rank-sigma); }
.btnComplete { width: 100%; padding: 0.8rem; background: var(--rank-sigma); border: none; border-radius: var(--radius-sm); color: #000; font-weight: 900; cursor: pointer; }
.btnDelete { position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.7rem; }\n`,

  // Side Hustles (Projects) Page
  'src/pages/SideHustles/ProjectsPage.jsx': `import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useProjectStore } from '../../store/assetStores';
import styles from './Projects.module.css';

const ProjectsPage = () => {
  const { projects, sessions, addProject, logSession } = useProjectStore();
  const [newProjectName, setNewProjectName] = useState('');

  const handleAddProject = (e) => {
    e.preventDefault();
    if(!newProjectName) return;
    addProject(newProjectName, '#00BFFF');
    setNewProjectName('');
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
      </form>

      <div className={styles.grid}>
        {projects.map(project => (
          <div key={project.id} className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <h3>{project.title}</h3>
              <div className={styles.hours}>{project.total_hours}h LOGGED</div>
            </div>
            
            <button 
              onClick={() => logSession(project.id, 1, 8)} 
              className={styles.btnSession}
            >
              +1H FOCUS SESSION
            </button>
          </div>
        ))}
      </div>
      
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
export default ProjectsPage;\n`,

  'src/pages/SideHustles/Projects.module.css': `.container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
.header { margin-bottom: 3rem; }
.header h1 { font-family: 'Outfit'; font-size: 2.5rem; color: #fff; letter-spacing: 0.1em; }
.addForm { display: flex; gap: 1rem; margin-bottom: 3rem; }
.input { flex: 1; background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.1); padding: 1rem; border-radius: var(--radius-md); color: #fff; }
.btnAdd { background: var(--rank-alpha); color: #000; padding: 1rem 2rem; border-radius: var(--radius-md); border: none; font-weight: 900; cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 4rem; }
.projectCard { background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
.projectCard:hover { border-color: var(--rank-alpha); }
.projectHeader { display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem; }
.projectHeader h3 { color: #fff; font-family: 'Outfit'; margin: 0; }
.hours { font-size: 0.7rem; background: rgba(0,191,255,0.1); color: var(--rank-alpha); padding: 4px 8px; border-radius: 4px; font-weight: 800; }
.btnSession { width: 100%; background: transparent; border: 1px solid var(--rank-alpha); color: var(--rank-alpha); padding: 1rem; border-radius: var(--radius-sm); font-weight: 900; cursor: pointer; transition: 0.2s; }
.btnSession:hover { background: var(--rank-alpha); color: #000; }
.history h2 { font-size: 1rem; font-family: 'Outfit'; margin-bottom: 1.5rem; color: var(--text-secondary); }
.sessionLine { display: flex; justify-content: space-between; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; font-size: 0.8rem; }
.efficiency { color: var(--rank-sigma); font-weight: 800; }\n`,

  // PWA Manifest
  'public/manifest.json': `{
  "short_name": "Antigravity",
  "name": "Antigravity Performance OS",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#000000"
}\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
