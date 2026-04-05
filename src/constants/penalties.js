export const PENALTIES = {
  // AP penalties for inactivity
  INACTIVE_1_DAY: -1000,
  INACTIVE_2_DAYS: -1100,
  INACTIVE_3_PLUS_DAYS: -1200,
  NO_LOG_7_PLUS_DAYS: -1500,
  IGNORED_PERMANENT_3_DAYS: -200, // per task
  LACKING_3_DAYS: -300,

  // Multiplier impact is defined in constants/multipliers.js
  // (PENALTY_1_DAY, PENALTY_2_DAYS, PENALTY_3_PLUS_PER_DAY, etc.)
};
