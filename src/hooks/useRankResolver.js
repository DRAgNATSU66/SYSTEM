import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuraStore } from '../store/auraStore';
import { useUserStore } from '../store/userStore';

// Named rank tiers for top 3 positions (matches DB rank_tier names)
const TOP_RANK_NAMES = ['IM HIM', 'ALPHA & OMEGA', 'SIGMA'];
const TOP_RANK_COLORS = ['#00CFFF', '#39FF14', '#FFE600'];

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
  const [rankColor, setRankColor]   = useState('#9E9E9E');
  const [rankPosition, setRankPosition] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      // Fallback: offline AP-threshold resolution
      const offlineResolve = () => {
        if (totalAuraPoints >= 9999) { setRankLabel('IM HIM');        setRankColor('#00CFFF'); }
        else if (totalAuraPoints >= 5000) { setRankLabel('ALPHA & OMEGA'); setRankColor('#39FF14'); }
        else if (totalAuraPoints >= 2000) { setRankLabel('SIGMA');          setRankColor('#FFE600'); }
        else { setRankLabel('RANKING...'); setRankColor('#FF3131'); }
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

        if (position >= 1 && position <= 3) {
          setRankLabel(TOP_RANK_NAMES[position - 1]);
          setRankColor(TOP_RANK_COLORS[position - 1]);
          setRankPosition(position);
        } else if (position > 3) {
          setRankLabel(`Unranked #${position}`);
          setRankColor('#90EE90');
          setRankPosition(position);
        } else {
          // User not found in list yet (0 AP or not seeded)
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
