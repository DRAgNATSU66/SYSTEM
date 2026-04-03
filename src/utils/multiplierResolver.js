import { MULTIPLIERS } from '../constants/multipliers';

/**
 * Resolves the streak multiplier.
 * Starts building from day UNLOCK_DAY.
 * Each day above unlock adds STEP (0.1x).
 * Hard cap: 4.0x (PRD §6).
 */
export const resolveMultiplier = (streakDays) => {
  if (streakDays < MULTIPLIERS.UNLOCK_DAY) return MULTIPLIERS.BASE;
  const over    = streakDays - MULTIPLIERS.UNLOCK_DAY + 1;
  const rawMult = MULTIPLIERS.BASE + (over * MULTIPLIERS.STEP);
  return Math.min(Math.round(rawMult * 10) / 10, MULTIPLIERS.MAX_MULT);
};
