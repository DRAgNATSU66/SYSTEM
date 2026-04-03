import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import { useUserStore } from '../../../store/userStore';
import { useRankResolver } from '../../../hooks/useRankResolver';
import RankBadge from './RankBadge';
import PlayerLogo from '../../../assets/player-logo.png';
import styles from './Header.module.css';

const Header = () => {
  const { totalAuraPoints } = useAuraStore();
  const { profile } = useUserStore();
  const { rankLabel, rankColor } = useRankResolver();

  const dateStr = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <img src={PlayerLogo} alt="LOGO" className={styles.brandIcon} />
        <div className={styles.date}>{dateStr}</div>
      </div>
      <div className={styles.playerName}>PLAYER: {profile?.name?.toUpperCase() || 'NATSU'}</div>
      <div className={styles.right}>
        <div className={styles.scoreContainer}>
          <span className={styles.scoreLabel}>SCORE:</span>
          <span className={styles.scoreValue}>{(totalAuraPoints || 0).toLocaleString()}</span>
        </div>
        <RankBadge label={rankLabel} color={rankColor} />
      </div>
    </header>
  );
};
export default Header;
