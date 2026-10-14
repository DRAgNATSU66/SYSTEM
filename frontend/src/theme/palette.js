// Single source for colours used from JS. Inline styles: rgbVar(); SVG/Recharts props: useThemeColors().
import { useMemo } from 'react';
import { useUiStore } from '../store/uiStore';
import { rgbVar, toRgba } from './paletteCore';

export { rgbVar, toRgba };

export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function useThemeColors() {
  const theme = useUiStore((s) => s.theme);
  return useMemo(() => {
    const ch = (n) => cssVar(n);
    return {
      accent: toRgba(ch('--accent-rgb')),
      accentHi: toRgba(ch('--accent-hi-rgb')),
      fg: toRgba(ch('--fg-rgb')),
      shade: toRgba(ch('--shade-rgb')),
      rankAlpha: cssVar('--rank-alpha'), rankOmega: cssVar('--rank-omega'), rankSigma: cssVar('--rank-sigma'),
      rankOthers: cssVar('--rank-others'), rankSlacking: cssVar('--rank-slacking'), rankBeta: cssVar('--rank-beta'),
      red: cssVar('--color-red'), yellow: cssVar('--color-yellow'), green: cssVar('--color-green'), blue: cssVar('--color-blue'),
      alpha: (name, a) => toRgba(ch(name), a),
    };
  }, [theme]); // eslint-disable-line react-hooks/exhaustive-deps
}
