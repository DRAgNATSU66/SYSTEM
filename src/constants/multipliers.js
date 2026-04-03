export const MULTIPLIERS = {
  BASE: 1.0,
  UNLOCK_DAY: 7,   // Multiplier starts building after 7-day streak
  MAX_MULT: 4.0,   // Cap at 4x (PRD §6)
  STEP: 0.1,       // Per streak day above unlock
  DUEL_WIN_BONUS: 0.5,  // +0.5x for winning an Aura Duel
  STREAK_BREAK_COMPENSATION: 0.5, // +0.5x when streak breaks (to help user recover)
};
