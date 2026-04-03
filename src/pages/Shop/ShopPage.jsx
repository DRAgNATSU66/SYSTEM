import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useAuraStore } from '../../store/auraStore';
import amazonLogo from '../../assets/amazon.gif';
import netflixLogo from '../../assets/netflix.gif';
import spotifyLogo from '../../assets/spotify.gif';
import gpayLogo from '../../assets/gpay.gif';
import styles from './Shop.module.css';

const ShopPage = () => {
  const { totalAuraPoints, redeemPoints } = useAuraStore();
  const safePoints = totalAuraPoints ?? 0;
  const usdValue = (safePoints / 1000 * 0.1).toFixed(2);

  const rewards = [
    { id: 'amazon-1', name: 'AMAZON GIFT CARD', cost: 100000, value: '$10.00', icon: amazonLogo },
    { id: 'netflix-1', name: 'NETFLIX SUB (1 MO)', cost: 150000, value: '$15.00', icon: netflixLogo },
    { id: 'spotify-1', name: 'SPOTIFY PREMIUM', cost: 100000, value: '$10.00', icon: spotifyLogo },
    { id: 'cash-1', name: 'GPAY DIRECT CASHOUT', cost: 50000, value: '$5.00', icon: gpayLogo },
  ];

  const handleRedeem = (reward) => {
    if (totalAuraPoints >= reward.cost) {
      const success = redeemPoints(reward.cost, reward.name);
      if (success) {
        alert(`SUCCESS: ${reward.name} REDEEMED. VOUCHER SENT TO LINKED NEURAL NET.`);
      }
    } else {
      alert('INSUFFICIENT AURA POINTS. CONTINUE GRINDING.');
    }
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>AURA MARKETPLACE</h1>
          <p className={styles.subtitle}>Convert abstract merit into tangible assets.</p>
        </div>
        <div className={styles.balanceCard}>
          <div className={styles.apLabel}>CURRENT BALANCE</div>
          <div className={styles.apValue}>{(totalAuraPoints ?? 0).toLocaleString()} AP</div>
          <div className={styles.usdValue}>≈ ${usdValue} USD</div>
        </div>
      </header>

      <div className={styles.rewardGrid}>
        {rewards.map(reward => (
          <div key={reward.id} className={styles.rewardCard}>
            <div className={styles.rewardIcon}>
              <img src={reward.icon} alt={reward.name} className={styles.brandLogo} />
            </div>
            <div className={styles.rewardInfo}>
              <h3>{reward.name}</h3>
              <p>Value: {reward.value}</p>
            </div>
            <div className={styles.rewardCost}>
              <span>{(reward.cost ?? 0).toLocaleString()} AP</span>
              <button 
                className={styles.redeemBtn}
                onClick={() => handleRedeem(reward)}
                disabled={totalAuraPoints < reward.cost}
              >
                REDEEM
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className={styles.infoFooter}>
        <p>SYSTEM AUTO-REDEMPTION: 1000 AP = $0.10 USD. ALL TRANSACTIONS FINAL.</p>
      </footer>
    </PageWrapper>
  );
};

export default ShopPage;
