/**
 * Returns a CSS color value based on AP score.
 * Used uniformly across Dashboard, Calendar, Leaderboard, Progress bars.
 */
export function getAPColor(ap) {
  if (ap >= 1500) return 'var(--color-blue)';
  if (ap >= 1000) return 'var(--color-green)';
  if (ap >= 500)  return 'var(--color-yellow)';
  return 'var(--color-red)';
}

export function getAPTier(ap) {
  if (ap >= 1500) return 'peak';
  if (ap >= 1000) return 'good';
  if (ap >= 500)  return 'okay';
  return 'low';
}

export function getAPColorHex(ap) {
  if (ap >= 1500) return '#3B82F6';
  if (ap >= 1000) return '#22C55E';
  if (ap >= 500)  return '#EAB308';
  return '#EF4444';
}

export function getAPColorPale(ap) {
  if (ap >= 1500) return 'rgba(59, 130, 246, 0.6)';
  if (ap >= 1000) return 'rgba(34, 197, 94, 0.6)';
  if (ap >= 500)  return 'rgba(234, 179, 8, 0.6)';
  return 'rgba(239, 68, 68, 0.6)';
}
