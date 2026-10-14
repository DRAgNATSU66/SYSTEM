import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../services/supabaseClient';
import { getAPColor } from '../../utils/apColorLogic';
import { rgbVar } from '../../theme/palette';
import styles from './Leaderboard.module.css';

const RANK_NAMES  = ['IM HIM', 'ALPHA & OMEGA', 'SIGMA'];
const RANK_COLORS = ['var(--rank-alpha)', 'var(--rank-omega)', 'var(--rank-sigma)'];

const getRankLabel = (position, ap = 0) => {
  if (ap <= 0) return { label: 'BETA', color: 'var(--rank-slacking)' };
  if (position >= 1 && position <= 3) return { label: RANK_NAMES[position - 1], color: RANK_COLORS[position - 1] };
  return { label: `#${position}`, color: 'var(--rank-beta)' };
};

const timeAgo = (ts) => {
  if (!ts) return 'Unknown';
  const diff = Date.now() - new Date(ts);
  if (diff < 5 * 60 * 1000) return 'ONLINE NOW';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const Top5ProfileCard = ({ profileId, onClose }) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!supabase || !profileId) return;
    supabase.rpc('get_top5_profile', { target_user_id: profileId }).then(({ data: result, error: rpcErr }) => {
      if (!rpcErr && result && !result.error) {
        setLoading(false);
        setData(result);
        return;
      }
      // RPC failed or not deployed — fall back to direct profile read
      supabase.from('profiles')
        .select('id, username, avatar_url, total_aura_points, current_streak, multiplier, last_seen_at, rank_tier')
        .eq('id', profileId).single()
        .then(({ data: fallback, error: fbErr }) => {
          setLoading(false);
          if (fbErr || !fallback) { setError('Could not load profile.'); return; }
          setData({ ...fallback, rank_position: null, today_score: 0, today_earned: 0, today_lost: 0 });
        });
    });
  }, [profileId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: rgbVar('--shade-rgb', 0.65), backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'var(--glass-bg)', border: `1px solid ${rgbVar('--accent-rgb', 0.3)}`, borderRadius: 24, padding: '2rem', maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {loading && <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>LOADING...</p>}
        {error && <p style={{ color: 'var(--color-red)', textAlign: 'center', fontSize: '0.8rem' }}>{error}</p>}
        {data && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: rgbVar('--accent-rgb', 0.1), border: `2px solid ${rgbVar('--accent-rgb', 0.4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontSize: '1.4rem' }}>
                {data.avatar_url
                  ? <img src={data.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.parentNode.textContent='⬡'; }} />
                  : '⬡'}
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.1em' }}>{(data.username || 'UNKNOWN').toUpperCase()}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--rank-alpha)', letterSpacing: '0.12em', marginTop: '0.2rem' }}>RANK #{data.rank_position}</div>
              </div>
              <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${rgbVar('--fg-rgb', 0.2)}`, borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
            </div>

            {[
              { label: 'TOTAL AURA', value: `${(data.total_aura_points || 0).toLocaleString()} AP`, color: getAPColor(data.total_aura_points || 0) },
              { label: 'STREAK', value: `${data.current_streak || 0} days` },
              { label: 'MULTIPLIER', value: `${(data.multiplier || 1).toFixed(1)}×`, color: 'var(--rank-sigma)' },
              { label: 'LAST ACTIVE', value: timeAgo(data.last_seen_at), color: data.last_seen_at && (Date.now() - new Date(data.last_seen_at)) < 300000 ? 'var(--color-green)' : undefined },
              { label: "TODAY'S SCORE", value: data.today_score || 0 },
              { label: 'TODAY EARNED', value: `+${(data.today_earned || 0).toLocaleString()} AP`, color: 'var(--color-green)' },
              { label: 'TODAY LOST', value: `-${(data.today_lost || 0).toLocaleString()} AP`, color: 'var(--color-red)' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${rgbVar('--fg-rgb', 0.05)}`, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{row.label}</span>
                <span style={{ fontWeight: 800, color: row.color || rgbVar('--fg-rgb') }}>{row.value}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const LeaderboardPage = () => {
  const { totalAuraPoints } = useAuraStore();
  const { user, profile }   = useUserStore();
  const [leaders, setLeaders]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selfRank, setSelfRank] = useState(null);
  const [history, setHistory]   = useState(false);
  const [expandedId, setExpandedId] = useState(null);  // top-5 profile card

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      if (!supabase) { setLeaders([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, total_aura_points, current_streak, multiplier, rank_tier, last_seen_at')
        .order('total_aura_points', { ascending: false })
        .limit(100);
      if (error || !data) { setLeaders([]); setLoading(false); return; }
      setLeaders(data);
      if (user?.id) {
        const pos = data.findIndex(r => r.id === user.id);
        setSelfRank(pos >= 0 ? pos + 1 : null);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, [user?.id, totalAuraPoints]);

  const { auraHistory } = useAuraStore();

  const handleRowClick = (pos, leader) => {
    if (pos > 5 || !selfRank || selfRank > 5) return;
    setExpandedId(leader.id);
  };

  return (
    <PageWrapper className={styles.container}>
      <div className={styles.header}>
        <h1>GLOBAL HIERARCHY</h1>
        <p className={styles.headerSub}>Top performers ranked by total Aura Points.</p>
        {selfRank && selfRank <= 5 && (
          <p style={{ fontSize: '0.65rem', color: 'var(--rank-sigma)', letterSpacing: '0.1em', marginTop: '0.35rem' }}>
            ★ TOP-5 ACCESS — click any top-5 row to view full profile
          </p>
        )}
      </div>

      <div className={styles.selfCard}>
        <div className={styles.selfLabel}>YOUR AURA</div>
        <div className={styles.selfAP} style={{ color: getRankLabel(selfRank || 999, totalAuraPoints).color }}>{(totalAuraPoints || 0).toLocaleString()} AP</div>
        <div className={styles.selfRank} style={{ color: getRankLabel(selfRank || 999, totalAuraPoints).color }}>
          {getRankLabel(selfRank || 999, totalAuraPoints).label}
        </div>
        <div className={styles.selfName}>{profile?.username || profile?.name || 'You'}</div>
      </div>

      <div className={styles.viewToggle}>
        <button className={`${styles.toggleBtn} ${!history ? styles.toggleActive : ''}`} onClick={() => setHistory(false)}>LEADERBOARD</button>
        <button className={`${styles.toggleBtn} ${history ? styles.toggleActive : ''}`} onClick={() => setHistory(true)}>MY AURA HISTORY</button>
      </div>

      {!history ? (
        <div className={styles.leaderList}>
          {loading && <div className={styles.loadingMsg}>Fetching leaderboard...</div>}
          {!loading && leaders.length === 0 && <div className={styles.emptyMsg}>No data yet.</div>}
          {leaders.map((leader, idx) => {
            const pos    = idx + 1;
            const rank   = getRankLabel(pos, leader.total_aura_points);
            const isSelf = leader.id === user?.id;
            const isTop5Clickable = pos <= 5 && selfRank && selfRank <= 5;
            const online = leader.last_seen_at && (Date.now() - new Date(leader.last_seen_at)) < 300000;
            return (
              <div
                key={leader.id}
                className={`${styles.leaderRow} ${isSelf ? styles.selfRow : ''}`}
                style={{ cursor: isTop5Clickable ? 'pointer' : 'default', position: 'relative' }}
                onClick={() => handleRowClick(pos, leader)}
              >
                {online && <span style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)', boxShadow: '0 0 6px var(--color-green)' }} />}
                <div className={styles.rankNum} style={{ color: rank.color }}>
                  {pos <= 3 ? ['🥇','🥈','🥉'][pos - 1] : `#${pos}`}
                </div>
                <div className={styles.identity}>
                  <div className={styles.name}>
                    {(leader.username || 'Anonymous').toUpperCase()}
                    {isSelf && <span className={styles.youTag}> (YOU)</span>}
                  </div>
                  <div className={styles.tier} style={{ color: rank.color }}>{rank.label}</div>
                </div>
                <div className={styles.score} style={{ color: rank.color }}>
                  {(leader.total_aura_points || 0).toLocaleString()} AP
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.historyList}>
          <h2 className={styles.historyTitle}>AURA HISTORY</h2>
          {auraHistory.length === 0 && <div className={styles.emptyMsg}>No history yet.</div>}
          {[...auraHistory].reverse().map((entry, i) => (
            <div key={i} className={styles.historyRow}>
              <span className={styles.historyDate}>{entry.date}</span>
              <span className={styles.historyReason}>{entry.reason || 'Daily AP'}</span>
              <span className={styles.historyNet} style={{ color: entry.net >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                {entry.net >= 0 ? '+' : ''}{entry.net} AP
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <p>Leaderboard syncs live from the network.</p>
      </div>

      {expandedId && <Top5ProfileCard profileId={expandedId} onClose={() => setExpandedId(null)} />}
    </PageWrapper>
  );
};

export default LeaderboardPage;
