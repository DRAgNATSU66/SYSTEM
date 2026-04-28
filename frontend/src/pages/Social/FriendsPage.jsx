import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import { useSocialStore } from '../../store/socialStore';
import styles from './Social.module.css';

const FriendsPage = () => {
  const { friends, addFriend } = useSocialStore();
  const [cipherInput, setCipherInput] = useState('');

  const handleAddFriend = (e) => {
    e.preventDefault();
    if(!cipherInput) return;
    addFriend({ id: Date.now(), name: 'Cipher User ' + Math.floor(Math.random() * 1000), rank: 'Sigma', avatar: null });
    setCipherInput('');
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <h1>NEURAL SOCIAL HUB</h1>
        <p>Connect with other performance vectors in the collective.</p>
      </header>

      <form onSubmit={handleAddFriend} className={styles.addForm}>
        <input 
          type="text" value={cipherInput} 
          onChange={e => setCipherInput(e.target.value)} 
          placeholder="ENTER CIPHER ID..." 
          className={styles.input}
        />
        <button type="submit" className={styles.btnAdd}>CONNECT</button>
      </form>

      <div className={styles.grid}>
        {friends.map(friend => (
          <div key={friend.id} className={styles.friendCard}>
            <div className={styles.avatar}>[CIPHER_ID]</div>
            <div className={styles.info}>
              <h3>{friend.name}</h3>
              <div className={styles.status} style={{ color: 'var(--rank-sigma)' }}>{friend.rank.toUpperCase()}</div>
            </div>
            <button className={styles.btnPing}>PING</button>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
export default FriendsPage;
