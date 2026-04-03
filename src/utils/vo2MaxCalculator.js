/**
 * VO2 Max Calculator — 10-minute Airbike maximum intensity session
 *
 * Formula derived from the Cooper test / Astrand-Ryhming nomogram adapted
 * for Airbike ergometer output.
 *
 * Inputs:
 *   bpm      — average heart rate during session (beats per minute)
 *   distKm   — distance covered in km
 *   timeMins — duration in minutes (nominally 10)
 *   age      — user age in years
 *
 * Returns:
 *   rawVO2   — estimated VO2 max in ml/kg/min (20–80 typical range)
 *   score    — normalized 0–100 score
 */
export const calculateVO2Max = ({ bpm, distKm, timeMins, age }) => {
  if (!bpm || !distKm || !timeMins || !age) return { rawVO2: 0, score: 0 };

  // Power output proxy: distance per minute
  const distPerMin = distKm / timeMins;

  // Airbike-adapted VO2 max estimation
  // Based on: VO2max ≈ (Distance_km / Time_min * 21.4) − (0.07 * HR) + (0.3 * Age_factor)
  // Reference: Storer et al. cycle ergometer adaptation
  const ageFactor = Math.max(0, 30 - age) * 0.1; // younger = slight bonus
  const rawVO2 = (distPerMin * 21.4) - (0.065 * bpm) + ageFactor + 10;

  const clamped = Math.max(20, Math.min(80, rawVO2));

  // Normalize: 20 ml/kg/min = very poor (score 0), 80 = elite (score 100)
  const score = Math.round(((clamped - 20) / 60) * 100);

  return { rawVO2: Math.round(clamped * 10) / 10, score };
};
