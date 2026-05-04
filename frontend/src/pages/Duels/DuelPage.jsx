import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useSocialStore } from '../../store/socialStore';
import { useUserStore } from '../../store/userStore';
import { useAuraStore } from '../../store/auraStore';
import { supabase } from '../../services/supabaseClient';
import { pullAllData } from '../../services/syncEngine';
import styles from './Duels.module.css';

const DuelPage = () => {
  const { duels } = useSocialStore();
  const { user } = useUserStore();
  const { totalAuraPoints } = useAuraStore();

  const [cipherInput, setCipherInput]   = useState('');
  const [stakeInput, setStakeInput]     = useState('500');
  const [targetProfile, setTargetProfile] = useState(null);
  const [searching, setSearching]       = useState(false);
  const [searchError, setSearchError]   = useState('');
  const [msg, setMsg]                   = useState('');
  const [duelProgress, setDuelProgress] = useState({});  // { [duelId]: { myAP, theirAP } }

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  // Split duels by state
  const incoming = duels.filter(d => d.opponent_id === user?.id && d.state === 'pending');
  const active   = duels.filter(d => d.state === 'active' && (d.challenger_id === user?.id || d.opponent_id === user?.id));

  // Fetch AP progress for all active duels
  useEffect(() => {
    if (!supabase || !active.length || !user?.id) return;
    active.forEach(async (duel) => {
      const startDate = duel.start_at?.split('T')[0] || new Date().toISOString().split('T')[0];
      const myId    = user.id;
      const theirId = duel.challenger_id === myId ? duel.opponent_id : duel.challenger_id;
      const [myRes, theirRes] = await Promise.allSettled([
        supabase.from('aura_logs').select('earned').eq('user_id', myId).gte('date', startDate),
        supabase.from('aura_logs').select('earned').eq('user_id', theirId).gte('date', startDate),
      ]);
      const myAP    = (myRes.status === 'fulfilled' ? myRes.value.data : [])?.reduce((s, r) => s + (r.earned || 0), 0) ?? 0;
      const theirAP = (theirRes.status === 'fulfilled' ? theirRes.value.data : [])?.reduce((s, r) => s + (r.earned || 0), 0) ?? 0;
      setDuelProgress(prev => ({ ...prev, [duel.id]: { myAP, theirAP } }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.length, user?.id]);

  // Lookup opponent by Cipher ID
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!cipherInput.trim() || !supabase) return;
    setSearching(true); setSearchError(''); setTargetProfile(null);
    const { data } = await supabase.from('profiles')
      .select('id, username, cypher_id, total_aura_points, rank_tier')
      .eq('cypher_id', cipherInput.trim().toUpperCase()).single();
    setSearching(false);
    if (!data) return setSearchError('No profile found with that Cipher ID.');
    if (data.id === user?.id) return setSearchError('Cannot duel yourself.');
    setTargetProfile(data);
  };

  // Send challenge
  const handleChallenge = async () => {
    if (!targetProfile || !user?.id || !supabase) return;
    const stake = Math.min(totalAuraPoints, Math.max(100, parseInt(stakeInput) || 500));
    if (stake > totalAuraPoints) return flash('Not enough AP to stake.');
    const { error } = await supabase.from('duels').insert({
      id: crypto.randomUUID(),
      challenger_id: user.id,
      opponent_id: targetProfile.id,
      state: 'pending',
      stake_ap: stake,
      match_type: 'direct',
    });
    if (error) return flash('Failed to send challenge. Try again.');
    flash(`Challenge sent to ${targetProfile.username} — ${stake} AP staked!`);
    setTargetProfile(null); setCipherInput('');
    pullAllData(user.id);
  };

  // Accept duel (stake deducted server-side via RPC — client triggers state change)
  const handleAccept = async (duel) => {
    if (!supabase) return;
    const now    = new Date().toISOString();
    const endAt  = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('duels').update({ state: 'active', start_at: now, end_at: endAt }).eq('id', duel.id);
    if (error) return flash('Failed to accept duel.');
    flash('Duel accepted — 24h window started!');
    pullAllData(user.id);
  };

  const handleReject = async (duel) => {
    if (!supabase) return;
    await supabase.from('duels').update({ state: 'rejected' }).eq('id', duel.id);
    flash('Challenge rejected.');
    pullAllData(user.id);
  };

  const pct = (a, b) => {
    const total = a + b;
    return total === 0 ? 50 : Math.round((a / total) * 100);
  };

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <h1>AURA DUELS</h1>
        <p>1v1 competitive sprints. Stake AP — winner takes all.</p>
      </div>

      {msg && (
        <div style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.3)', borderRadius: 12, padding: '0.7rem 1.1rem', marginBottom: '1.25rem', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--rank-alpha)' }}>
          {msg}
        </div>
      )}

      {/* ── Direct Challenge Form ── */}
      <section className={styles.challengeSection}>
        <h2 style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.2em', color: 'var(--rank-alpha)', marginBottom: '1rem' }}>DIRECT CHALLENGE</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <input type="text" value={cipherInput} onChange={e => setCipherInput(e.target.value.toUpperCase())}
            placeholder="OPPONENT CIPHER ID" maxLength={10} className={styles.challengeInput} />
          <input type="number" value={stakeInput} onChange={e => setStakeInput(e.target.value)}
            placeholder="STAKE AP" min="100" max={totalAuraPoints} className={styles.stakeInput} />
          <button type="submit" disabled={searching} className={styles.btnNewDuel} style={{ padding: '0.65rem 1.5rem', fontSize: '0.7rem' }}>
            {searching ? '...' : 'FIND'}
          </button>
        </form>

        {searchError && <p style={{ color: 'var(--color-red)', fontSize: '0.72rem', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{searchError}</p>}

        {targetProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,230,0,0.06)', border: '1px solid rgba(255,230,0,0.2)', borderRadius: 14, padding: '1rem 1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.08em' }}>{targetProfile.username?.toUpperCase()}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {targetProfile.cypher_id} · {(targetProfile.total_aura_points || 0).toLocaleString()} AP
              </div>
            </div>
            <button onClick={handleChallenge} className={styles.btnNewDuel} style={{ padding: '0.6rem 1.5rem', fontSize: '0.7rem', background: 'rgba(255,230,0,0.15)', borderColor: 'rgba(255,230,0,0.4)', color: 'var(--rank-sigma)' }}>
              ⚔ CHALLENGE ({parseInt(stakeInput) || 500} AP)
            </button>
          </div>
        )}
      </section>

      {/* ── Incoming Challenges ── */}
      {incoming.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.2em', color: 'var(--rank-sigma)', marginBottom: '1rem' }}>
            INCOMING CHALLENGES ({incoming.length})
          </h2>
          {incoming.map(duel => (
            <div key={duel.id} className={styles.incomingCard}>
              <div className={styles.duelInfo}>
                <div className={styles.versus}>INCOMING CHALLENGE</div>
                <h3>{(duel.challenger_name || duel.opponent_name || 'OPPONENT').toUpperCase()}</h3>
                <div className={styles.stake}>{(duel.stake_ap || 0).toLocaleString()} AP STAKED EACH</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
                <button onClick={() => handleAccept(duel)} className={styles.btnAccept}>✅ ACCEPT</button>
                <button onClick={() => handleReject(duel)} className={styles.btnReject}>❌ REJECT</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Active Duels ── */}
      <div className={styles.activeDuels}>
        {active.map(duel => {
          const prog = duelProgress[duel.id] || { myAP: 0, theirAP: 0 };
          const myPct    = pct(prog.myAP, prog.theirAP);
          const theirPct = 100 - myPct;
          const theirName = (duel.challenger_id === user?.id
            ? (duel.opponent_name || 'OPPONENT')
            : (duel.challenger_name || 'OPPONENT')
          ).toUpperCase();
          return (
            <div key={duel.id} className={styles.duelCard}>
              <div className={styles.duelInfo}>
                <div className={styles.versus}>ACTIVE DUEL</div>
                <h3>{theirName}</h3>
                <div className={styles.stake}>{(duel.stake_ap || 0).toLocaleString()} AP · {duel.match_type === 'ranked' ? 'RANKED' : 'DIRECT'}</div>
              </div>
              <div className={styles.progressRow}>
                <div className={styles.progressLabel}>YOU</div>
                <div className={styles.bar}><div className={styles.fill} style={{ width: `${myPct}%` }} /></div>
                <span style={{ fontSize: '0.62rem', color: 'var(--rank-alpha)', fontWeight: 800, minWidth: 40, textAlign: 'right' }}>{prog.myAP.toLocaleString()}</span>
              </div>
              <div className={styles.progressRow}>
                <div className={styles.progressLabel}>{theirName.slice(0, 6)}</div>
                <div className={styles.bar}><div className={styles.fill} style={{ width: `${theirPct}%`, background: 'var(--rank-slacking)' }} /></div>
                <span style={{ fontSize: '0.62rem', color: 'var(--rank-slacking)', fontWeight: 800, minWidth: 40, textAlign: 'right' }}>{prog.theirAP.toLocaleString()}</span>
              </div>
              {duel.end_at && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  ENDS: {new Date(duel.end_at).toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
        {active.length === 0 && incoming.length === 0 && (
          <p className={styles.empty}>No active duels. Challenge someone via their Cipher ID above.</p>
        )}
      </div>

      {/* ── Matchmaking ── */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className={styles.btnNewDuel} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          RANKED MATCHMAKING — COMING SOON
        </button>
        <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '0.5rem', letterSpacing: '0.08em' }}>Skill-based AP-bracket matchmaking requires server queue — pending Phase 3 backend.</p>
      </div>
    </PageWrapper>
  );
};

export default DuelPage;
