import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/routes';
import { AuthProvider } from './components/auth/AuthProvider';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#fff', fontFamily: 'Outfit, sans-serif', background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#00BFFF', letterSpacing: '0.15em', marginBottom: '1rem' }}>SYSTEM ERROR</h2>
          <p style={{ color: '#9E9E9E', marginBottom: '1.5rem' }}>An unexpected error occurred.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 1.5rem', background: 'rgba(0,191,255,0.15)', border: '1px solid rgba(0,191,255,0.4)', color: '#00BFFF', borderRadius: 12, cursor: 'pointer', fontWeight: 800, letterSpacing: '0.1em' }}>RELOAD OS</button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
