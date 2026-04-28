/**
 * Returns a context-aware greeting based on time of day and whether
 * the user is new (first visit) or returning.
 *
 * New users  → "Welcome, {name}."  (never "welcome back")
 * Returning  → time-aware dynamic greeting with variety
 */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const getGreeting = (playerName = 'Grinder', isNewUser = false) => {
  const hour = new Date().getHours();
  const name = playerName || 'Grinder';

  // ── New player: first-ever session ───────────────────────────
  if (isNewUser) {
    return pick([
      `Welcome, ${name}. Let's build something legendary.`,
      `Welcome, ${name}. Your journey starts now.`,
      `Welcome, ${name}. Time to level up.`,
    ]);
  }

  // ── Returning player: time-aware dynamic greetings ───────────
  if (hour >= 0 && hour < 5) {
    return pick([
      `Night owl mode, ${name}. Respect the grind.`,
      `Burning midnight oil, ${name}. Let's get it.`,
      `The world sleeps, ${name}. You don't.`,
    ]);
  }
  if (hour >= 5 && hour < 7) {
    return pick([
      `Early riser, ${name}. Discipline is freedom.`,
      `Up before the sun, ${name}. That's elite.`,
      `5 AM club, ${name}. Winners move first.`,
    ]);
  }
  if (hour >= 7 && hour < 9) {
    return pick([
      `Good morning, ${name}. Time to execute.`,
      `Morning, ${name}. Stack the wins early.`,
      `Rise and grind, ${name}.`,
    ]);
  }
  if (hour >= 9 && hour < 12) {
    return pick([
      `Good morning, ${name}. Deep work hours are live.`,
      `Morning, polymath. Let's dominate, ${name}.`,
      `Peak focus window, ${name}. Make it count.`,
    ]);
  }
  if (hour >= 12 && hour < 14) {
    return pick([
      `Afternoon, ${name}. Stay locked in.`,
      `Good afternoon, ${name}. Keep the momentum.`,
      `Midday check-in, ${name}. How's the grind?`,
    ]);
  }
  if (hour >= 14 && hour < 17) {
    return pick([
      `Afternoon push, ${name}. No coasting.`,
      `Good afternoon, ${name}. Finish strong today.`,
      `Still in the arena, ${name}. Respect.`,
    ]);
  }
  if (hour >= 17 && hour < 20) {
    return pick([
      `Good evening, ${name}. Log the wins.`,
      `Evening grind, ${name}. Close out strong.`,
      `Welcome back, ${name}. Time to reflect and execute.`,
    ]);
  }
  if (hour >= 20 && hour < 22) {
    return pick([
      `Late session, ${name}. Still in beast mode.`,
      `Good evening, ${name}. The work never stops.`,
      `Night grind activated, ${name}.`,
    ]);
  }
  // 22:00 – 23:59
  return pick([
    `Still grinding, ${name}. Rest is earned.`,
    `Late night hustle, ${name}. Lock in.`,
    `Burning the midnight candle, ${name}.`,
  ]);
};
