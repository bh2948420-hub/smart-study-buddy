import { useEffect, useRef } from 'react';
import { celebrationService } from '@/services/celebrationService';

interface RankCelebrationProps {
  currentRank: number | null;
  userId: string | null;
}

const RANK_STORAGE_KEY = 'smartedu_last_rank';

export function useRankCelebration(currentRank: number | null, userId: string | null) {
  const hasChecked = useRef(false);
  const celebrationTriggered = useRef(false);

  useEffect(() => {
    if (!userId || currentRank === null || hasChecked.current) return;
    
    hasChecked.current = true;
    const storageKey = `${RANK_STORAGE_KEY}_${userId}`;
    const lastRankStr = localStorage.getItem(storageKey);
    const lastRank = lastRankStr ? parseInt(lastRankStr, 10) : null;

    // Save current rank for next comparison
    localStorage.setItem(storageKey, currentRank.toString());

    // Trigger celebration if rank improved (lower number = better)
    if (lastRank !== null && currentRank < lastRank && !celebrationTriggered.current) {
      celebrationTriggered.current = true;
      celebrationService.celebrate({ type: 'rank_up', rank: currentRank });
    }
  }, [currentRank, userId]);
}

export function RankCelebration({ currentRank, userId }: RankCelebrationProps) {
  useRankCelebration(currentRank, userId);
  return null; // This component only handles effects
}
