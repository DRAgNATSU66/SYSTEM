/**
 * Aura Points Rules — PRD §6
 *
 * Daily budget:
 *   Total earnable per day: 2000 AP
 *   Total losable per day:  2000 AP
 *
 * Split:
 *   Dailies block:        1000 AP — earned proportionally by completing the 5 dailies
 *   Goals/Hobbies block:  1000 AP — dynamically weighted by difficulty/permanence
 *
 * Dailies (5 categories, equal base weight = 200 AP each):
 *   1. Workout    — day-specific (Mon/Tue/Wed: Cardio+Mobility; Thu–Sun: Hypertrophy)
 *   2. Nutrition  — all macros AND micros hit baseline
 *   3. Sleep      — ≥8h + deep sleep ≥9/10
 *   4. Study      — ≥2h
 *   5. Mood       — logged ≥ Stable (value ≥ 5)
 */
export const AURA_RULES = {
  MAX_DAILY_EARN: 2000,
  MAX_DAILY_LOSE: 2000,

  // Dailies block
  DAILIES_POOL: 1000,
  DAILY_CATEGORY_WEIGHT: 200, // 5 categories × 200 = 1000

  // Goals & Hobbies block
  GOALS_POOL: 1000,

  // Goal difficulty weights (fraction of pool)
  GOAL_WEIGHTS: {
    HARD:     0.4,   // hard/permanent goal can earn up to 400 AP of the 1000 pool
    MEDIUM:   0.2,
    EASY:     0.1,
    HOBBY_PERMANENT: 0.15,
    HOBBY_TEMPORARY: 0.05,
  },

  // Legacy bonuses (kept for backwards compat)
  BONUSES: {
    ALL_PERMANENT_DONE:    150,
    ALL_SUBCATEGORIES_LOGGED: 50,
    IM_HIM_TIER:           200,
    PEAK_MOOD:             100,
    OVERPERFORM_TASK:       50,
  }
};
