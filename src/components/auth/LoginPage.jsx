import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useUserStore } from '../../store/userStore';
import { userService } from '../../services/userService';
import { seedServerFromLocal, pullAllData } from '../../services/syncEngine';
import systemLogo from '../../assets/system.png';

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,191,255,0.08) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '400px',
    padding: '2.5rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(0,191,255,0.2)',
    borderRadius: '16px',
    boxShadow: '0 0 40px rgba(0,191,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
  },
  logo: {
    width: '72px',
    height: '72px',
    borderRadius: '16px',
    boxShadow: '0 0 20px rgba(0,191,255,0.4)',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    letterSpacing: '0.15em',
    color: '#00BFFF',
    margin: 0,
    textShadow: '0 0 20px rgba(0,191,255,0.5)',
  },
  subtitle: {
    fontSize: '0.8rem',
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.35)',
    margin: 0,
    textTransform: 'uppercase',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(0,191,255,0.15)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '0.85rem',
    background: '#00BFFF',
    border: 'none',
    borderRadius: '8px',
    color: '#0a0a0a',
    fontWeight: 700,
    fontSize: '0.85rem',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    marginTop: '0.25rem',
    transition: 'opacity 0.2s, box-shadow 0.2s',
    boxShadow: '0 0 20px rgba(0,191,255,0.3)',
  },
  error: {
    width: '100%',
    padding: '0.65rem 0.9rem',
    background: 'rgba(255,49,49,0.1)',
    border: '1px solid rgba(255,49,49,0.3)',
    borderRadius: '8px',
    color: '#FF3131',
    fontSize: '0.8rem',
  },
  toggle: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.35)',
    cursor: 'pointer',
    textAlign: 'center',
    userSelect: 'none',
  },
  toggleAccent: {
    color: '#00BFFF',
    fontWeight: 600,
  },
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useUserStore(state => state.setUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
    } else if (data.user) {
      setUser(data.user);

      if (!isLogin) {
        const username = email.split('@')[0];
        try {
          await userService.upsertProfileOnSignUp(data.user.id, username);
          await seedServerFromLocal(data.user.id);
        } catch (e) {
          console.warn('[LoginPage] signup seed failed:', e);
        }
      } else {
        await pullAllData(data.user.id);
      }

      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.glow} />
      <div style={styles.card}>
        <img src={systemLogo} alt="SYSTEM" style={styles.logo} />
        <div style={{ textAlign: 'center' }}>
          <h1 style={styles.title}>SYSTEM</h1>
          <p style={styles.subtitle}>
            {isLogin ? 'Initialize Uplink' : 'Register Signature'}
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Identity Hook (Email)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Cipher (Password)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button
            type="submit"
            style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? 'SYNCING...' : isLogin ? 'ACCESS TERMINAL' : 'INITIALIZE PROTOCOL'}
          </button>
        </form>

        <p style={styles.toggle} onClick={() => { setIsLogin(!isLogin); setError(null); }}>
          {isLogin
            ? <>No signature? <span style={styles.toggleAccent}>Create one.</span></>
            : <>Already registered? <span style={styles.toggleAccent}>Login.</span></>
          }
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
