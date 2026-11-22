import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuraStore } from '../store/auraStore';
import { useUserStore } from '../store/userStore';

// Named rank tiers for top 3 positions (matches DB rank_tier names)
const TOP_RANK_NAMES = ['IM HIM', 'ALPHA & OMEGA', 'SIGMA'];
// Returned as var() strings so the badge follows the active theme without re-reading CSS.
const TOP_RANK_VARS = ['--rank-alpha', '--rank-omega', '--rank-sigma'];

/**
 * Resolves the current user's rank label.
 * - If they're in top 3 by AP → named rank title + color
 * - Otherwise → "Unranked #N" with grey color
 *
 * Falls back to AP-threshold-based offline resolution when Supabase is unavailable.
 */
export const useRankResolver = () => {
  const { totalAuraPoints } = useAuraStore();
  const { user } = useUserStore();
  const [rankLabel, setRankLabel]   = useState('Calculating...');
  const [rankColor, setRankColor]   = useState(() => 'var(--rank-beta)');
  const [rankPosition, setRankPosition] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      // Fallback: offline AP-threshold resolution based on live AP
      const offlineResolve = () => {
        if (totalAuraPoints >= 9999) { setRankLabel('IM HIM');        setRankColor('var(--rank-alpha)'); setRankPosition(1); }
        else if (totalAuraPoints >= 5000) { setRankLabel('ALPHA & OMEGA'); setRankColor('var(--rank-omega)'); setRankPosition(2); }
        else if (totalAuraPoints >= 2000) { setRankLabel('SIGMA');          setRankColor('var(--rank-sigma)'); setRankPosition(3); }
        else if (totalAuraPoints <= 0) { setRankLabel('BETA');          setRankColor('var(--rank-slacking)'); setRankPosition(null); }
        else { setRankLabel(`#${Math.max(4, Math.ceil(10000 / Math.max(1, totalAuraPoints)))}`); setRankColor('var(--rank-beta)'); setRankPosition(null); }
      };

      if (!supabase || !user?.id) {
        offlineResolve();
        return;
      }

      try {
        // Fetch top leaderboard rows (ordered by AP desc)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, total_aura_points')
          .order('total_aura_points', { ascending: false })
          .limit(200);

        if (error || !data) { offlineResolve(); return; }

        const position = data.findIndex(row => row.id === user.id) + 1; // 1-based

        if (cancelled) return;

        // Always check live AP first — 0 AP = BETA regardless of position
        if (totalAuraPoints <= 0) {
          setRankLabel('BETA');
          setRankColor('var(--rank-slacking)');
          setRankPosition(null);
        } else if (position >= 1 && position <= 3) {
          setRankLabel(TOP_RANK_NAMES[position - 1]);
          setRankColor(`var(${TOP_RANK_VARS[position - 1]})`);
          setRankPosition(position);
        } else if (position > 3) {
          setRankLabel(`#${position}`);
          setRankColor('var(--rank-beta)');
          setRankPosition(position);
        } else {
          offlineResolve();
        }
      } catch {
        offlineResolve();
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [totalAuraPoints, user?.id]);

  return { rankLabel, rankColor, rankPosition };
};
