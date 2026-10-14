// Pure colour helpers — no React/DOM so they run under node --test.
export const rgbVar = (name, alpha) => (alpha == null ? `rgb(var(${name}))` : `rgb(var(${name}) / ${alpha})`);

export function toRgba(channels, alpha = 1) {
  const [r, g, b] = channels.trim().split(/\s+/);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
