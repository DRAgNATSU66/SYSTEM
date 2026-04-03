const fs = require('fs');
const path = require('path');

const files = {
  // Pulse AI Core Component
  'src/components/ui/PulseCore/PulseCore.jsx': `import React from 'react';
import styles from './PulseCore.module.css';

const PulseCore = ({ status = 'alpha' }) => {
  return (
    <div className={styles.container}>
      <div className={\`\${styles.ring} \${styles.r1}\`} />
      <div className={\`\${styles.ring} \${styles.r2}\`} />
      <div className={\`\${styles.ring} \${styles.r3}\`} />
      <div className={styles.core} />
    </div>
  );
};
export default PulseCore;\n`,

  'src/components/ui/PulseCore/PulseCore.module.css': `.container { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; }
.core { width: 30px; height: 30px; background: var(--rank-alpha); border-radius: 50%; box-shadow: 0 0 30px var(--rank-alpha); z-index: 10; }
.ring { position: absolute; border: 1px solid var(--rank-alpha); border-radius: 50%; opacity: 0; animation: pulse 3s infinite; }
.r1 { width: 50px; height: 50px; animation-delay: 0s; }
.r2 { width: 75px; height: 75px; animation-delay: 1s; }
.r3 { width: 100px; height: 100px; animation-delay: 2s; }
@keyframes pulse {
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}\n`,

  // Command Page
  'src/pages/Command/CommandPage.jsx': `import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import PulseCore from '../../components/ui/PulseCore/PulseCore';
import { useTaskStore } from '../../store/taskStore';
import { useAuraStore } from '../../store/auraStore';
import styles from './Command.module.css';

const CommandPage = () => {
  const [logs, setLogs] = useState([
    { id: 1, type: 'system', text: 'NEURAL_OS_BOOT . . . [V9.0.1 ALPHA]' },
    { id: 2, type: 'system', text: 'SCANNING_ENVIRONMENT . . . [SECURE_ENCLAVE]' },
    { id: 3, type: 'update', text: 'SYNCING_USER_BIOMETRICS . . . [SUCCESS]' }
  ]);
  const [input, setInput] = useState('');
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = (e) => {
    e.preventDefault();
    if(!input) return;

    setLogs(prev => [...prev, { id: Date.now(), type: 'user', text: '> ' + input.toUpperCase() }]);
    
    // Simulate AI thinking
    setTimeout(() => {
      setLogs(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: 'COMMAND_RECOGNIZED: INITIALIZING CRITIQUE ENGINE.' }]);
    }, 600);
    
    setInput('');
  };

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.visualStack}>
         <PulseCore />
         <div className={styles.status}>CORE_ACTIVE</div>
      </div>
      
      <div className={styles.terminal}>
        <div className={styles.log}>
          {logs.map(log => (
            <div key={log.id} className={styles[log.type]}>
              {log.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
        
        <form onSubmit={handleCommand} className={styles.commandForm}>
          <input 
            type="text" value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="EXECUTE_COMMAND ..." 
            className={styles.numInput}
            autoFocus
          />
        </form>
      </div>
    </PageWrapper>
  );
};
export default CommandPage;\n`,

  'src/pages/Command/Command.module.css': `.container { padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; max-height: 100vh; }
.visualStack { display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem; }
.status { font-family: 'Outfit'; font-size: 0.6rem; color: var(--rank-alpha); letter-spacing: 0.3em; margin-top: 1rem; }
.terminal { width: 100%; max-width: 900px; background: rgba(0,0,0,0.4); border: 1px solid rgba(0,191,255,0.1); border-radius: 8px; padding: 2rem; display: flex; flex-direction: column; height: 500px; position: relative; overflow: hidden; }
.terminal::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 100%; background: linear-gradient(rgba(0,191,255,0.02) 50%, rgba(0,0,0,0) 50%); background-size: 100% 4px; pointer-events: none; z-index: 10; }
.log { flex: 1; overflow-y: auto; padding-right: 1rem; font-family: 'Outfit'; font-size: 0.85rem; line-height: 1.6; }
.system { color: var(--text-secondary); opacity: 0.7; }
.update { color: var(--rank-sigma); }
.user { color: #fff; font-weight: 800; margin-top: 1rem; }
.ai { color: var(--rank-alpha); margin-bottom: 1rem; font-weight: 900; }
.commandForm { margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; }
.numInput { background: transparent; border: none; outline: none; color: var(--rank-alpha); width: 100%; font-family: 'Outfit'; letter-spacing: 0.1em; font-weight: 900; }\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
