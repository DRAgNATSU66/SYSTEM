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
  if (ap >= 1500) return 'var(--color-blue)';
  if (ap >= 1000) return 'var(--color-green)';
  if (ap >= 500)  return 'var(--color-yellow)';
  return 'var(--color-red)';
}

// Tier tokens are hex, so 60% alpha via color-mix (same result as rgba(r,g,b,0.6)).
const pale = (v) => `color-mix(in srgb, var(${v}) 60%, transparent)`;

export function getAPColorPale(ap) {
  if (ap >= 1500) return pale('--color-blue');
  if (ap >= 1000) return pale('--color-green');
  if (ap >= 500)  return pale('--color-yellow');
  return pale('--color-red');
}
