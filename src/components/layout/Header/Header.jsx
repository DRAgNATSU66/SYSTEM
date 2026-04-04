import React from 'react';
import { useAuraStore } from '../../../store/auraStore';
import { useUserStore } from '../../../store/userStore';
import { useUiStore } from '../../../store/uiStore';
import { useRankResolver } from '../../../hooks/useRankResolver';
import { getAPColor } from '../../../utils/apColorLogic';
import RankBadge from './RankBadge';
import PlayerLogo from '../../../assets/player-logo.png';
import { Menu, X } from 'lucide-react';
import styles from './Header.module.css';

const Header = () => {
  const { totalAuraPoints } = useAuraStore();
  const { profile } = useUserStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { rankLabel, rankColor } = useRankResolver();

  const dateStr = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.hamburger} onClick={toggleSidebar} aria-label="Toggle sidebar">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <img src={PlayerLogo} alt="LOGO" className={styles.brandIcon} />
        <div className={styles.date}>{dateStr}</div>
      </div>
      <div className={styles.playerName}>PLAYER: {profile?.name?.toUpperCase() || 'NATSU'}</div>
      <div className={styles.right}>
        <div className={styles.scoreContainer}>
          <span className={styles.scoreLabel}>SCORE:</span>
          <span className={styles.scoreValue} style={{ color: 'var(--rank-omega)' }}>{(totalAuraPoints || 0).toLocaleString()}</span>
        </div>
        <RankBadge label={rankLabel} color={rankColor} />
      </div>
    </header>
  );
};
export default Header;
