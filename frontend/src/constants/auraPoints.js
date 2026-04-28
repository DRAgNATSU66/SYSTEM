/**
 * Aura Points Rules — PRD §6
 *
 * Daily budget:
 *   Total earnable per day: 2000 AP
 *   Total losable per day:  2000 AP
 *
 * Split:
 *   Daily Core block:     1000 AP — earned by completing 5 daily categories
 *   Misc block:           1000 AP — weighted by priority across goals/hobbies/projects/content
 *
 * Daily Core (5 categories, weighted):
 *   1. Workout    — 300 AP
 *   2. Study      — 300 AP (≥2h deep work)
 *   3. Nutrition  — 200 AP (all macros AND micros hit baseline)
 *   4. Sleep      — 150 AP (≥8h + deep sleep ≥9/10)
 *   5. Mood       —  50 AP (logged ≥ Stable, value ≥ 5)
 *
 * Misc block:     1000 AP — proportional to difficulty/type/duration/seriousness
 */
export const AURA_RULES = {
  MAX_DAILY_EARN: 2000,
  MAX_DAILY_LOSE: 2000,

  // Daily Core block
  DAILIES_POOL: 1000,

  // Per-category caps within the daily core
  DAILY_CATEGORY_CAP: {
    WORKOUT:   300,
    STUDY:     300,
    NUTRITION: 200,
    SLEEP:     150,
    MOOD:       50,
  },

  // Legacy alias — average category weight (used by auraCalculator)
  DAILY_CATEGORY_WEIGHT: 200,

  // Misc block (goals, hobbies, projects, content, etc.)
  GOALS_POOL: 1000,

  // Misc difficulty weights (fraction of pool)
  // Proportional by difficulty, type, duration, and seriousness of work
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
