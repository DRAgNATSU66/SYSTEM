const fs = require('fs');
const path = require('path');

const files = {
  'src/utils/scoreCalculator.js': `// Computation logic for daily score from 0 to 1000
export const computeDailyScore = (tasks, defaultWeights) => {
  let score = 0;
  tasks.forEach(t => {
    let completionRate = 0;
    if (t.method === 'checkbox') completionRate = t.completed ? 1 : 0;
    if (t.method === 'numeric') completionRate = Math.min(t.progress / t.target, 1);
    const weight = t.weight || defaultWeights[t.type] || 100;
    score += weight * completionRate;
  });
  return Math.floor(Math.min(score, 1000));
};\n`,

  'src/utils/auraCalculator.js': `import { AURA_RULES } from '../constants/auraPoints';

export const computeAuraPoints = (dailyScore, hasAllPermanent, peakMood, overperformedCount) => {
  // Base daily score goes straight to AP
  let earned = dailyScore; 
  
  if (hasAllPermanent) earned += AURA_RULES.BONUSES.ALL_PERMANENT_DONE;
  if (dailyScore >= 900) earned += AURA_RULES.BONUSES.IM_HIM_TIER;
  if (peakMood) earned += AURA_RULES.BONUSES.PEAK_MOOD;
  if (overperformedCount > 0) earned += (overperformedCount * AURA_RULES.BONUSES.OVERPERFORM_TASK);
  
  return earned;
};\n`,

  'src/utils/multiplierResolver.js': `import { MULTIPLIERS } from '../constants/multipliers';

export const resolveMultiplier = (streakDays) => {
  if (streakDays < MULTIPLIERS.UNLOCK_DAY) return MULTIPLIERS.BASE;
  
  // E.g., Day 21 = 1.1x, Day 22 = 1.2x, cap at Day 31 (2.0x)
  const over = streakDays - MULTIPLIERS.UNLOCK_DAY + 1; // day 21 -> 1
  const rawMult = 1.0 + (over * 0.1);
  return Math.min(Math.round(rawMult * 10) / 10, MULTIPLIERS.MAX_MULT);
};\n`,

  'src/utils/penaltyEngine.js': `import { PENALTIES } from '../constants/penalties';

export const computePenalties = (gapDays, ignoredTasks) => {
  let penalty = 0;
  
  // Sequence penalty
  if (gapDays === 1) penalty += PENALTIES.INACTIVE_1_DAY;
  else if (gapDays === 2) penalty += PENALTIES.INACTIVE_2_DAYS * 2;
  else if (gapDays >= 3 && gapDays < 7) penalty += PENALTIES.INACTIVE_3_PLUS_DAYS * gapDays;
  else if (gapDays >= 7) penalty += PENALTIES.NO_LOG_7_PLUS_DAYS * gapDays;
  
  // Permanent ignores
  if (ignoredTasks > 0) {
    penalty += PENALTIES.IGNORED_PERMANENT_3_DAYS * ignoredTasks * gapDays;
  }
  
  return penalty;
};\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.writeFileSync(fullPath, files[file]);
  console.log('Updated: ' + file);
});
