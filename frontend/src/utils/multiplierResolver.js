import { MULTIPLIERS } from '../constants/multipliers';

/**
 * Resolves the streak multiplier from streak days.
 * Every streak day adds +0.1x from day 1.
 * Capped between MIN_MULT (-5.0) and MAX_MULT (5.0).
 */
export const resolveMultiplier = (streakDays) => {
  if (streakDays <= 0) return MULTIPLIERS.BASE;
  const rawMult = MULTIPLIERS.BASE + (streakDays * MULTIPLIERS.STEP);
  return clampMultiplier(rawMult);
};

/**
 * Clamp a multiplier value between MIN_MULT and MAX_MULT.
 */
export const clampMultiplier = (value) => {
  const clamped = Math.max(MULTIPLIERS.MIN_MULT, Math.min(value, MULTIPLIERS.MAX_MULT));
  return Math.round(clamped * 10) / 10;
};
