import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/routes';
import { AuthProvider } from './components/auth/AuthProvider';
import './index.css';
import { rgbVar } from './theme/palette';
import { IS_DEMO } from './services/demoFlag';
import { purgeDemoResidue } from './utils/demoResidue';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: rgbVar('--fg-rgb'), fontFamily: 'var(--font-display)', background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: rgbVar('--accent-rgb'), letterSpacing: '0.15em', marginBottom: '1rem' }}>SYSTEM ERROR</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>An unexpected error occurred.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 1.5rem', background: rgbVar('--accent-rgb', 0.15), border: `1px solid ${rgbVar('--accent-rgb', 0.4)}`, color: rgbVar('--accent-rgb'), borderRadius: 12, cursor: 'pointer', fontWeight: 800, letterSpacing: '0.1em' }}>RELOAD OS</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Leaving demo mode: wipe the fake data it persisted, then reload *before* React mounts anything.
// Doing this in an effect was too late: child effects (useCloudSync's flushQueue) run before a
// parent's, and StrictMode's second effect run found nothing left to purge and started a sync.
let purged = false;
if (!IS_DEMO) {
  try { purged = purgeDemoResidue(localStorage); } catch { /* storage unavailable: normal boot */ }
}

if (purged) {
  window.location.reload();
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
