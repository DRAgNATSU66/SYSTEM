/**
 * Returns a context-aware greeting based on time of day and whether
 * the user is new (first visit) or returning.
 */
export const getGreeting = (playerName = 'Grinder', isNewUser = false) => {
  const hour = new Date().getHours();
  const name  = playerName || 'Grinder';

  if (isNewUser) {
    return `Welcome, ${name}.`;
  }

  if (hour >= 0 && hour < 5) {
    return `Hi midnight owl, ${name}.`;
  }
  if (hour >= 5 && hour < 9) {
    return `Hi early riser, ${name}.`;
  }
  if (hour >= 9 && hour < 12) {
    return `Good morning, ${name}.`;
  }
  if (hour >= 12 && hour < 17) {
    return `Good afternoon, ${name}.`;
  }
  if (hour >= 17 && hour < 21) {
    return `Good evening, ${name}.`;
  }
  // 21:00 – 23:59
  return `Still grinding, ${name}.`;
};
