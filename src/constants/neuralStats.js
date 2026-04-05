/**
 * Neural Stats Configuration — IQ & Knowledge gain parameters
 *
 * IQ is extremely hard to increase. Only deep analytical work contributes.
 * Knowledge is higher than IQ and increases faster, but still controlled.
 *
 * Subject tiers determine IQ gain rate per hour of study:
 *   HIGH:   1.0 IQ/hr  — pure analytical/mathematical/competitive
 *   MEDIUM: 0.5 IQ/hr  — applied science/engineering/CS
 *   LOW:    0.1 IQ/hr  — general knowledge/soft subjects
 *
 * Knowledge gain rate is uniform across all subjects:
 *   2.0 knowledge points per hour of study (any subject)
 */

// IQ gain rate per hour of study, by subject tier
export const IQ_GAIN_RATES = {
  HIGH: 1.0,    // 1 IQ per hour (maths, aptitude, brain puzzles, competitive programming)
  MEDIUM: 0.5,  // 0.5 IQ per hour (CS, ML, AI, engineering, chemistry)
  LOW: 0.1,     // 0.1 IQ per hour (general knowledge, soft subjects)
};

// Knowledge gain rate per hour of study (all subjects)
export const KNOWLEDGE_GAIN_RATE = 2.0; // 2 knowledge points per hour

// Maximum display values for the Neural Pentagram radar chart (0-100 scale)
export const NEURAL_PENTAGRAM_CAPS = {
  IQ_MAX: 100,         // 100 accumulated IQ points = 100% on radar
  KNOWLEDGE_MAX: 200,  // 200 accumulated knowledge points = 100% on radar
};

// Subject tier classification for IQ gain
// HIGH tier: pure analytical, mathematical, competitive — hardest IQ gain
export const IQ_SUBJECT_TIERS = {
  HIGH: [
    'mathematics', 'maths', 'math',
    'calculus',
    'linear algebra',
    'discrete mathematics', 'discrete math',
    'statistics', 'probability',
    'physics',
    'aptitude', 'quantitative aptitude',
    'competitive programming',
    'problem solving',
    'logic', 'reasoning',
    'data structures', 'algorithms', 'dsa',
    'brain puzzles', 'puzzles',
  ],
  MEDIUM: [
    'computer science',
    'machine learning',
    'artificial intelligence',
    'engineering',
    'chemistry',
    'economics',
    'electronics',
  ],
  LOW: [
    'gk', 'general knowledge',
    'history',
    'geography',
    'biology',
    'psychology',
    'philosophy',
    'english', 'language',
    'literature',
  ],
};

/**
 * Determine IQ tier for a subject name.
 * Returns 'HIGH', 'MEDIUM', or 'LOW'.
 */
export const getIQTier = (subjectName) => {
  const lower = (subjectName || '').toLowerCase().trim();
  for (const keyword of IQ_SUBJECT_TIERS.HIGH) {
    if (lower.includes(keyword) || keyword.includes(lower)) return 'HIGH';
  }
  for (const keyword of IQ_SUBJECT_TIERS.MEDIUM) {
    if (lower.includes(keyword) || keyword.includes(lower)) return 'MEDIUM';
  }
  // If subject matches LOW tier keywords or is unknown — LOW
  return 'LOW';
};

/**
 * Compute IQ gain for a study session.
 * @param {string} subjectName — name of the subject studied
 * @param {number} minutes — duration in minutes
 * @returns {number} IQ points gained (can be fractional)
 */
export const computeIQGain = (subjectName, minutes) => {
  const tier = getIQTier(subjectName);
  const hours = minutes / 60;
  return Math.round((hours * IQ_GAIN_RATES[tier]) * 100) / 100;
};

/**
 * Compute Knowledge gain for a study session.
 * @param {number} minutes — duration in minutes
 * @returns {number} Knowledge points gained
 */
export const computeKnowledgeGain = (minutes) => {
  const hours = minutes / 60;
  return Math.round((hours * KNOWLEDGE_GAIN_RATE) * 100) / 100;
};
