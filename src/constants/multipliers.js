export const MULTIPLIERS = {
  BASE: 1.0,
  MAX_MULT: 5.0,          // Hard ceiling: 5x
  MIN_MULT: -5.0,         // Hard floor: -5x (negative multiplier from penalties)
  STEP: 0.1,              // +0.1x per streak day (from day 1)
  DUEL_WIN_BONUS: 0.5,    // +0.5x for winning an Aura Duel
  DUEL_LOSS_RESET: true,  // Multiplier resets on duel loss
  STREAK_LOSS_RESET: true, // Multiplier resets on streak break

  // Penalty-based multiplier reductions
  PENALTY_1_DAY: -0.2,        // 1 day inactive
  PENALTY_2_DAYS: -0.5,       // 2 days inactive
  PENALTY_3_PLUS_PER_DAY: -1.0, // per day for 3+ days inactive
  PENALTY_7_PLUS_FLOOR: -1.0, // floor multiplier after 7+ days inactive
  PENALTY_INCOMPLETE_DAILY: -0.1, // per uncompleted required daily task
  PENALTY_NO_CCA: -0.2,       // not doing hobbies/goals/content occasionally
};
