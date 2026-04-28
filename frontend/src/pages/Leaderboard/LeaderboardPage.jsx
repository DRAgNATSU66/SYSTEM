import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../services/supabaseClient';
import { getAPColor } from '../../utils/apColorLogic';
import styles from './Leaderboard.module.css';

const RANK_NAMES  = ['IM HIM', 'ALPHA & OMEGA', 'SIGMA'];
const RANK_COLORS = ['#00CFFF', '#39FF14', '#FFE600'];

const getRankLabel = (position, ap = 0) => {
  if (ap <= 0) {
    return { label: 'BETA', color: '#FF3131' };
  }
  if (position >= 1 && position <= 3) {
    return { label: RANK_NAMES[position - 1], color: RANK_COLORS[position - 1] };
  }
  return { label: `#${position}`, color: '#9E9E9E' };
};

const LeaderboardPage = () => {
  const { totalAuraPoints } = useAuraStore();
  const { user, profile }   = useUserStore();
  const [leaders, setLeaders]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selfRank, setSelfRank] = useState(null);
  const [history, setHistory]   = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      if (!supabase) {
        setLeaders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, total_aura_points, current_streak, multiplier, rank_tier')
        .order('total_aura_points', { ascending: false })
        .limit(100);

      if (error || !data) {
        setLeaders([]);
        setLoading(false);
        return;
      }

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

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>GLOBAL HIERARCHY</h1>
        <p className={styles.headerSub}>Top performers in the network, ranked by total Aura Points.</p>
      </header>

      {/* Self Status Card */}
      <div className={styles.selfCard}>
        <div className={styles.selfLabel}>YOUR AURA</div>
        <div className={styles.selfAP} style={{ color: getAPColor(totalAuraPoints || 0) }}>{(totalAuraPoints || 0).toLocaleString()} AP</div>
        <div
          className={styles.selfRank}
          style={{ color: getRankLabel(selfRank || 999, totalAuraPoints).color }}
        >
          {getRankLabel(selfRank || 999, totalAuraPoints).label}
        </div>
        <div className={styles.selfName}>{profile?.username || profile?.name || 'You'}</div>
      </div>

      {/* Toggle: Leaderboard / Aura History */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleBtn} ${!history ? styles.toggleActive : ''}`}
          onClick={() => setHistory(false)}
        >
          LEADERBOARD
        </button>
        <button
          className={`${styles.toggleBtn} ${history ? styles.toggleActive : ''}`}
          onClick={() => setHistory(true)}
        >
          MY AURA HISTORY
        </button>
      </div>

      {!history ? (
        <div className={styles.leaderList}>
          {loading && (
            <div className={styles.loadingMsg}>Fetching leaderboard...</div>
          )}
          {!loading && leaders.length === 0 && (
            <div className={styles.emptyMsg}>No data yet. Be the first to log and earn AP.</div>
          )}
          {leaders.map((leader, idx) => {
            const pos   = idx + 1;
            const rank  = getRankLabel(pos, leader.total_aura_points);
            const isSelf = leader.id === user?.id;
            return (
              <div
                key={leader.id}
                className={`${styles.leaderRow} ${isSelf ? styles.selfRow : ''}`}
              >
                <div className={styles.rankNum} style={{ color: rank.color }}>
                  {pos <= 3 ? ['🥇','🥈','🥉'][pos - 1] : `#${pos}`}
                </div>
                <div className={styles.identity}>
                  <div className={styles.name}>
                    {(leader.username || 'Anonymous').toUpperCase()}
                    {isSelf && <span className={styles.youTag}> (YOU)</span>}
                  </div>
                  <div className={styles.tier} style={{ color: rank.color }}>
                    {rank.label}
                  </div>
                </div>
                <div className={styles.score} style={{ color: getAPColor(leader.total_aura_points || 0) }}>
                  {(leader.total_aura_points || 0).toLocaleString()} AP
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.historyList}>
          <h2 className={styles.historyTitle}>AURA HISTORY</h2>
          {auraHistory.length === 0 && (
            <div className={styles.emptyMsg}>No history yet. Start earning AP.</div>
          )}
          {[...auraHistory].reverse().map((entry, i) => (
            <div key={i} className={styles.historyRow}>
              <span className={styles.historyDate}>{entry.date}</span>
              <span className={styles.historyReason}>{entry.reason || 'Daily AP'}</span>
              <span
                className={styles.historyNet}
                style={{ color: entry.net >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
              >
                {entry.net >= 0 ? '+' : ''}{entry.net} AP
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <p>Leaderboard syncs live from the network.</p>
      </div>
    </PageWrapper>
  );
};

export default LeaderboardPage;
