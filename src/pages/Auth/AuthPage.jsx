import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useUserStore } from '../../store/userStore';
import { userService } from '../../services/userService';
import { seedServerFromLocal, pullAllData } from '../../services/syncEngine';
import ParticleBackground from '../../components/three/ParticleBackground/ParticleBackground';
import systemIcon from '../../assets/system.png';
import styles from './Auth.module.css';

// ─── Forgot Password ────────────────────────────────────────────────────────
const ForgotPasswordView = ({ onBack }) => {
  const [step, setStep]       = useState('email'); // 'email' | 'otp' | 'done'
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [newPw, setNewPw]     = useState('');
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!supabase) return setError('Supabase not configured.');
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // Use OTP flow, not magic link
    });
    setLoading(false);
    if (err) return setError(err.message);
    setStep('otp');
  };

  const verifyAndReset = async (e) => {
    e.preventDefault();
    if (!supabase) return setError('Supabase not configured.');
    setLoading(true);
    setError(null);
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });
    if (verifyErr) {
      setLoading(false);
      return setError('Invalid or expired code. Try again.');
    }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (updateErr) return setError(updateErr.message);
    setStep('done');
  };

  if (step === 'done') {
    return (
      <div className={styles.forgotWrap}>
        <div className={styles.successMsg}>Password updated. You can now log in.</div>
        <button className={styles.linkBtn} onClick={onBack}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className={styles.forgotWrap}>
      <h2 className={styles.forgotTitle}>RECOVER ACCESS</h2>
      {step === 'email' ? (
        <form onSubmit={sendOtp} className={styles.form}>
          <p className={styles.forgotHint}>Enter your registered email. We'll send a one-time code.</p>
          {error && <div className={styles.error}>{error}</div>}
          <input
            type="email"
            placeholder="Identity Hook (Email)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'SENDING...' : 'SEND OTP CODE'}
          </button>
          <button type="button" className={styles.linkBtn} onClick={onBack}>← Back to Login</button>
        </form>
      ) : (
        <form onSubmit={verifyAndReset} className={styles.form}>
          <p className={styles.forgotHint}>Enter the 6-digit code sent to <b>{email}</b> and your new password.</p>
          {error && <div className={styles.error}>{error}</div>}
          <input
            type="text"
            placeholder="OTP Code"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={styles.input}
            maxLength={6}
            required
          />
          <input
            type="password"
            placeholder="New Password (min 8 chars)"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            className={styles.input}
            minLength={8}
            required
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'VERIFYING...' : 'RESET PASSWORD'}
          </button>
          <button type="button" className={styles.linkBtn} onClick={() => setStep('email')}>← Resend code</button>
        </form>
      )}
    </div>
  );
};

// ─── Player Name Prompt ──────────────────────────────────────────────────────
const PlayerNamePrompt = ({ defaultName, onConfirm }) => {
  const [name, setName] = useState(defaultName);

  return (
    <div className={styles.playerNameWrap}>
      <img src={systemIcon} alt="SYSTEM" className={styles.brandIconLg} />
      <h2 className={styles.forgotTitle}>CHOOSE YOUR ALIAS</h2>
      <p className={styles.forgotHint}>This is your identity in the network. You can update it later in Settings.</p>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        className={styles.input}
        placeholder="Player Name"
        maxLength={24}
        style={{ marginTop: '1rem', textAlign: 'center', letterSpacing: '0.1em', fontWeight: 800 }}
      />
      <button
        className={styles.button}
        style={{ marginTop: '1.25rem' }}
        disabled={!name.trim()}
        onClick={() => onConfirm(name.trim())}
      >
        LOCK IN ALIAS
      </button>
    </div>
  );
};

// ─── Main Auth Page ──────────────────────────────────────────────────────────
const AuthPage = () => {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [isLogin, setIsLogin]       = useState(true);
  const [error, setError]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [pendingUser, setPendingUser] = useState(null); // awaiting player name
  const navigate = useNavigate();
  const setUser        = useUserStore(state => state.setUser);
  const updateProfile  = useUserStore(state => state.updateProfile);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured yet. Set VITE_SUPABASE_URL and KEY in .env');
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: authErr } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      setUser(data.user);

      if (!isLogin) {
        // Show player name prompt before navigating
        const defaultName = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'GRINDER';
        setLoading(false);
        setPendingUser({ userId: data.user.id, defaultName });
        return;
      } else {
        await pullAllData(data.user.id);
        setLoading(false);
        navigate('/');
      }
    } else {
      setLoading(false);
    }
  };

  const handlePlayerNameConfirm = async (playerName) => {
    const { userId } = pendingUser;
    try {
      await userService.upsertProfileOnSignUp(userId, playerName);
      updateProfile({ name: playerName, username: playerName });
      await seedServerFromLocal(userId);
    } catch (e) {
      console.warn('[AuthPage] signup seed failed:', e);
    }
    setPendingUser(null);
    navigate('/');
  };

  // ── Player Name Screen ───────────────────────────────────────────────────
  if (pendingUser) {
    return (
      <div className={styles.container}>
        <ParticleBackground />
        <div className={styles.card}>
          <PlayerNamePrompt
            defaultName={pendingUser.defaultName}
            onConfirm={handlePlayerNameConfirm}
          />
        </div>
      </div>
    );
  }

  // ── Forgot Password Screen ───────────────────────────────────────────────
  if (showForgot) {
    return (
      <div className={styles.container}>
        <ParticleBackground />
        <div className={styles.card}>
          <img src={systemIcon} alt="SYSTEM" className={styles.brandIcon} />
          <ForgotPasswordView onBack={() => setShowForgot(false)} />
        </div>
      </div>
    );
  }

  // ── Main Login / Signup ──────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <ParticleBackground />
      <div className={styles.card}>
        <img src={systemIcon} alt="SYSTEM" className={styles.brandIcon} />
        <h1>SYSTEM</h1>
        <p className={styles.subtitle}>{isLogin ? 'Initialize Uplink' : 'Register Signature'}</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Identity Hook (Email)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Cipher (Password)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            required
            minLength={isLogin ? undefined : 8}
          />

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'SYNCING...' : (isLogin ? 'ACCESS TERMINAL' : 'INITIALIZE PROTOCOL')}
          </button>
        </form>

        {isLogin && (
          <button
            type="button"
            className={styles.forgotLink}
            onClick={() => setShowForgot(true)}
          >
            Forgot Password?
          </button>
        )}

        <p className={styles.toggle} onClick={() => { setIsLogin(!isLogin); setError(null); }}>
          {isLogin ? 'No signature? Create one.' : 'Already registered? Login.'}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
