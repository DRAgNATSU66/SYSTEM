import { AURA_RULES } from '../constants/auraPoints';

/**
 * Compute Aura Points earned today.
 *
 * @param {Object} params
 * @param {number}  params.workoutProgress   — 0–1 (fraction of today's scheduled workout done)
 * @param {number}  params.nutritionProgress — 0–1 (fraction of all macro+micro baselines met)
 * @param {number}  params.sleepProgress     — 0–1 (combined sleep score)
 * @param {number}  params.studyProgress     — 0–1 (study minutes / 120)
 * @param {number}  params.moodValue         — 0–10 mood log value
 * @param {Array}   params.goals             — array of { difficulty, completed } objects
 * @param {Array}   params.hobbies           — array of { type, loggedToday } objects
 * @param {number}  params.multiplier        — current streak multiplier
 *
 * Returns { earned, breakdown } where earned is already capped at MAX_DAILY_EARN.
 */
export const computeAuraPoints = ({
  workoutProgress   = 0,
  nutritionProgress = 0,
  sleepProgress     = 0,
  studyProgress     = 0,
  moodValue         = 0,
  goals             = [],
  hobbies           = [],
  multiplier        = 1.0,
} = {}) => {
  const PW = AURA_RULES.DAILY_CATEGORY_WEIGHT; // 200

  // ── Dailies block (1000 AP) ──────────────────────────────────────────────
  const moodProgress = Math.min(1, Math.max(0, moodValue) / 5); // ≥5 = 100%

  const dailiesEarned = Math.round(
    (workoutProgress   * PW) +
    (nutritionProgress * PW) +
    (sleepProgress     * PW) +
    (studyProgress     * PW) +
    (moodProgress      * PW)
  );

  // ── Goals & Hobbies block (1000 AP) ─────────────────────────────────────
  let goalsEarned = 0;
  const GW = AURA_RULES.GOAL_WEIGHTS;

  goals.forEach(goal => {
    if (!goal.completed) return;
    const fraction = goal.difficulty === 'hard'   ? GW.HARD
                   : goal.difficulty === 'medium' ? GW.MEDIUM
                   : GW.EASY;
    goalsEarned += AURA_RULES.GOALS_POOL * fraction;
  });

  hobbies.forEach(hobby => {
    if (!hobby.loggedToday) return;
    const fraction = hobby.type === 'permanent' ? GW.HOBBY_PERMANENT : GW.HOBBY_TEMPORARY;
    goalsEarned += AURA_RULES.GOALS_POOL * fraction;
  });

  // Cap goals block at pool size
  goalsEarned = Math.min(Math.round(goalsEarned), AURA_RULES.GOALS_POOL);

  // ── Apply multiplier & daily cap ─────────────────────────────────────────
  const rawTotal    = dailiesEarned + goalsEarned;
  const withMult    = Math.round(rawTotal * (multiplier || 1.0));
  const earned      = Math.min(withMult, AURA_RULES.MAX_DAILY_EARN);

  return {
    earned,
    breakdown: {
      dailies: dailiesEarned,
      goalsHobbies: goalsEarned,
      rawBeforeMult: rawTotal,
      multiplier,
      final: earned,
    }
  };
};

/**
 * Legacy shim — used by existing auraStore.computeTodayAura() call signature.
 * Maps old params to new calculator for backwards compatibility.
 */
export const computeAuraPointsLegacy = (dailyScore, hasAllPermanent, peakMood, overperformedCount) => {
  let earned = dailyScore;
  if (hasAllPermanent) earned += AURA_RULES.BONUSES.ALL_PERMANENT_DONE;
  if (dailyScore >= 900) earned += AURA_RULES.BONUSES.IM_HIM_TIER;
  if (peakMood)          earned += AURA_RULES.BONUSES.PEAK_MOOD;
  if (overperformedCount > 0) earned += overperformedCount * AURA_RULES.BONUSES.OVERPERFORM_TASK;
  return earned;
};
