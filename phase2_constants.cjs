const fs = require('fs');
const path = require('path');

const files = {
  'src/constants/auraPoints.js': `export const AURA_RULES = {
  MAX_DAILY_BASE: 1000,
  MAX_DAILY_LOSE: -1000,
  BONUSES: {
    ALL_PERMANENT_DONE: 150,
    ALL_SUBCATEGORIES_LOGGED: 50,
    IM_HIM_TIER: 200,
    PEAK_MOOD: 100,
    OVERPERFORM_TASK: 50 // per task >= 150%
  }
};\n`,

  'src/constants/multipliers.js': `export const MULTIPLIERS = {
  BASE: 1.0,
  UNLOCK_DAY: 21,
  CAP_DAY: 31,
  MAX_MULT: 2.0
};\n`,

  'src/constants/penalties.js': `export const PENALTIES = {
  INACTIVE_1_DAY: -1000,
  INACTIVE_2_DAYS: -1100,
  INACTIVE_3_PLUS_DAYS: -1200,
  NO_LOG_7_PLUS_DAYS: -1500,
  IGNORED_PERMANENT_3_DAYS: -200, // per task
  LACKING_3_DAYS: -300
};\n`,

  'src/constants/scoreWeights.js': `export const DEFAULT_WEIGHTS = {
  PERMANENT_DAILY: 400,
  STUDY: 200,
  WORKOUT: 200,
  NUTRITION: 100,
  SLEEP: 100
};\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.writeFileSync(fullPath, files[file]);
  console.log('Updated: ' + file);
});
