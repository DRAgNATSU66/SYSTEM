import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useSocialStore } from '../../store/socialStore';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../services/supabaseClient';
import { pullAllData } from '../../services/syncEngine';
import styles from './Social.module.css';

const isOnline = (lastSeen) =>
  lastSeen && (new Date() - new Date(lastSeen)) < 5 * 60 * 1000;

const FriendsPage = () => {
  const { friends } = useSocialStore();
  const { user, cypherId } = useUserStore();

  const [cipherInput, setCipherInput]   = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError]   = useState('');
  const [searching, setSearching]       = useState(false);
  const [sending, setSending]           = useState(false);
  const [msg, setMsg]                   = useState('');
  const [pendingReqs, setPendingReqs]   = useState([]);  // incoming requests
  const [friendProfiles, setFriendProfiles] = useState([]); // enriched accepted friends

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3500); };

  // Load incoming pending requests + enrich accepted friends with profile data
  useEffect(() => {
    if (!supabase || !user?.id) return;

    // Incoming: rows where I am the friend_id and status is pending
    supabase.from('friends')
      .select('user_id, status, profiles!friends_user_id_fkey(id, username, cypher_id, avatar_url, total_aura_points)')
      .eq('friend_id', user.id).eq('status', 'pending')
      .then(({ data }) => { if (data) setPendingReqs(data); });

    // Accepted friends with full profile
    if (friends.length) {
      const ids = friends.filter(f => !f.status || f.status === 'accepted').map(f => f.friend_id);
      if (ids.length) {
        supabase.from('profiles')
          .select('id, username, cypher_id, avatar_url, total_aura_points, rank_tier, last_seen_at')
          .in('id', ids)
          .then(({ data }) => { if (data) setFriendProfiles(data); });
      }
    }
  }, [user?.id, friends.length]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!cipherInput.trim() || !supabase) return;
    setSearching(true); setSearchError(''); setSearchResult(null);
    const { data } = await supabase.from('profiles')
      .select('id, username, cypher_id, total_aura_points, rank_tier, last_seen_at')
      .eq('cypher_id', cipherInput.trim().toUpperCase()).single();
    setSearching(false);
    if (!data) return setSearchError('No profile found with that Cipher ID.');
    if (data.id === user?.id) return setSearchError("That's your own Cipher ID.");
    const alreadyFriend = friends.some(f => f.friend_id === data.id);
    if (alreadyFriend) return setSearchError('Already connected.');
    setSearchResult(data);
  };

  const handleSendRequest = async () => {
    if (!searchResult || !user?.id || !supabase) return;
    setSending(true);
    const { error } = await supabase.from('friends').upsert({
      user_id: user.id,
      friend_id: searchResult.id,
      status: 'pending',
      requested_by: user.id,
    }, { onConflict: 'user_id,friend_id' });
    setSending(false);
    if (error) return flash('Failed to send request.');
    flash(`Request sent to ${searchResult.username}!`);
    setSearchResult(null); setCipherInput('');
  };

  const handleAccept = async (requesterId) => {
    if (!supabase || !user?.id) return;
    await supabase.from('friends').update({ status: 'accepted' })
      .eq('user_id', requesterId).eq('friend_id', user.id);
    await supabase.from('friends').upsert({
      user_id: user.id, friend_id: requesterId,
      status: 'accepted', requested_by: requesterId,
    }, { onConflict: 'user_id,friend_id' });
    setPendingReqs(prev => prev.filter(r => r.user_id !== requesterId));
    flash('Request accepted!');
    pullAllData(user.id);
  };

  const handleReject = async (requesterId) => {
    if (!supabase || !user?.id) return;
    await supabase.from('friends').delete()
      .eq('user_id', requesterId).eq('friend_id', user.id);
    setPendingReqs(prev => prev.filter(r => r.user_id !== requesterId));
    flash('Request declined.');
  };

  const acceptedFriends = friendProfiles.length ? friendProfiles
    : friends.filter(f => !f.status || f.status === 'accepted');
  const onlineFriends = acceptedFriends.filter(f => isOnline(f.last_seen_at));
  const offlineFriends = acceptedFriends.filter(f => !isOnline(f.last_seen_at));

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <h1>NEURAL SOCIAL HUB</h1>
        <p>Connect with performance vectors in the collective.</p>
        {cypherId && (
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', letterSpacing: '0.12em' }}>
            YOUR CIPHER ID: <strong style={{ color: 'var(--rank-alpha)' }}>{cypherId}</strong>
          </p>
        )}
      </div>

      {msg && (
        <div style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.3)', borderRadius: 12, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--rank-alpha)' }}>
          {msg}
        </div>
      )}

      {/* ── Search ── */}
      <form onSubmit={handleSearch} className={styles.addForm}>
        <input
          type="text" value={cipherInput}
          onChange={e => setCipherInput(e.target.value.toUpperCase())}
          placeholder="ENTER CIPHER ID..."
          className={styles.input}
          maxLength={10}
        />
        <button type="submit" className={styles.btnAdd} disabled={searching}>
          {searching ? '...' : 'FIND'}
        </button>
      </form>

      {searchError && (
        <p style={{ color: 'var(--color-red)', fontSize: '0.72rem', marginBottom: '1rem', letterSpacing: '0.08em' }}>{searchError}</p>
      )}

      {searchResult && (
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.08em' }}>{(searchResult.username || 'UNKNOWN').toUpperCase()}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
              {searchResult.cypher_id} · {(searchResult.total_aura_points || 0).toLocaleString()} AP · {searchResult.rank_tier}
            </div>
          </div>
          <button
            onClick={handleSendRequest} disabled={sending}
            style={{ background: 'rgba(0,191,255,0.18)', border: '1px solid rgba(0,191,255,0.4)', color: 'var(--rank-alpha)', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.12em', padding: '0.6rem 1.2rem', borderRadius: 20, cursor: 'pointer' }}
          >{sending ? 'SENDING...' : 'SEND REQUEST'}</button>
        </div>
      )}

      {/* ── Incoming Requests ── */}
      {pendingReqs.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.2em', color: 'var(--rank-sigma)', marginBottom: '0.75rem' }}>
            INCOMING REQUESTS ({pendingReqs.length})
          </h2>
          {pendingReqs.map(req => {
            const p = req.profiles;
            return (
              <div key={req.user_id} style={{ background: 'var(--glass-bg)', border: '1px solid rgba(255,230,0,0.2)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.06em' }}>
                  {(p?.username || 'UNKNOWN').toUpperCase()}
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{p?.cypher_id}</span>
                </div>
                <button onClick={() => handleAccept(req.user_id)}
                  style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.4)', color: 'var(--color-green)', fontWeight: 800, fontSize: '0.68rem', padding: '0.4rem 0.9rem', borderRadius: 16, cursor: 'pointer' }}>✅ ACCEPT</button>
                <button onClick={() => handleReject(req.user_id)}
                  style={{ background: 'rgba(255,49,49,0.12)', border: '1px solid rgba(255,49,49,0.3)', color: 'var(--color-red)', fontWeight: 800, fontSize: '0.68rem', padding: '0.4rem 0.9rem', borderRadius: 16, cursor: 'pointer' }}>❌ REJECT</button>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Online Now ── */}
      {onlineFriends.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.2em', color: 'var(--color-green)', marginBottom: '0.75rem' }}>
            ONLINE NOW ({onlineFriends.length})
          </h2>
          <div className={styles.grid}>
            {onlineFriends.map(f => (
              <div key={f.id || f.friend_id} className={styles.friendCard}>
                <div className={styles.avatar}>
                  {f.avatar_url ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '⬡'}
                </div>
                <div className={styles.info}>
                  <h3>{(f.username || 'UNKNOWN').toUpperCase()}</h3>
                  <div className={styles.status} style={{ color: 'var(--color-green)' }}>
                    ● ONLINE · {(f.total_aura_points || 0).toLocaleString()} AP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── All Friends ── */}
      <div className={styles.grid}>
        {offlineFriends.map(f => (
          <div key={f.id || f.friend_id} className={styles.friendCard}>
            <div className={styles.avatar}>
              {f.avatar_url ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '⬡'}
            </div>
            <div className={styles.info}>
              <h3>{(f.username || 'UNKNOWN').toUpperCase()}</h3>
              <div className={styles.status} style={{ color: 'var(--text-secondary)' }}>
                {f.rank_tier || 'NORMIE'} · {(f.total_aura_points || 0).toLocaleString()} AP
              </div>
            </div>
          </div>
        ))}
        {acceptedFriends.length === 0 && pendingReqs.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem', gridColumn: '1/-1' }}>
            No connections yet. Enter a Cipher ID above to find someone.
          </p>
        )}
      </div>
    </PageWrapper>
  );
};

export default FriendsPage;
