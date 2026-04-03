export const injectMockData = () => {
  const now = new Date();
  
  // Generate last 14 days string
  const dates = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Generate scores
  // Let's assume a streak, then a break, then a streak
  const mockDailyScores = {};
  const mockAuraHistory = [];
  const mockPenaltyLog = [];
  
  let currentTotalAP = 50000; // Starting base
  let currentMultiplier = 1.0;
  let currentStreak = 0;

  dates.forEach((date, i) => {
    let score = 0;
    
    // Simulate behavior
    if (i === 4 || i === 5) { // Missed days
      score = 0;
      currentStreak = 0;
      currentMultiplier = 1.0;
      currentTotalAP -= 1000;
      mockPenaltyLog.push({ date, reason: 'Inactivity', amount: -1000 });
      mockAuraHistory.push({ date, net: -1000, multiplier: 1.0 });
    } else { // Active days
      score = Math.floor(Math.random() * 300) + 700; // 700 to 1000
      currentStreak += 1;
      
      if (currentStreak >= 7) currentMultiplier = Math.min(4.0, 1.0 + ((currentStreak - 6) * 0.1)); // 4x cap
      
      let earned = score;
      if (score >= 900) earned += 200; // IM HIM 
      
      const netEarned = Math.floor(earned * currentMultiplier);
      currentTotalAP += netEarned;
      
      mockAuraHistory.push({ date, net: netEarned, multiplier: currentMultiplier });
    }
    
    mockDailyScores[date] = score;
  });

  const auraState = {
    state: {
      totalAuraPoints: currentTotalAP,
      todayEarned: 0,
      todayLost: 0,
      todayNet: 0,
      multiplier: currentMultiplier,
      streakDays: currentStreak,
      penaltyLog: mockPenaltyLog,
      auraHistory: mockAuraHistory,
      lastLoginDate: dates[13]
    },
    version: 0
  };

  const scoreState = {
    state: {
      dailyScores: mockDailyScores,
      todayScore: mockDailyScores[dates[13]],
      weeklyScores: []
    },
    version: 0
  };

  localStorage.setItem('antigravity-aura-store', JSON.stringify(auraState));
  localStorage.setItem('antigravity-score-store', JSON.stringify(scoreState));
  
  console.log('Mock Data Injected into localStorage');
  window.location.reload();
};
