import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { soundService } from '@/services/soundService';

interface RankCelebrationProps {
  currentRank: number | null;
  userId: string | null;
  trigger?: boolean;
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
      triggerRankCelebration(currentRank, lastRank);
    }
  }, [currentRank, userId]);
}

export function triggerRankCelebration(newRank: number, oldRank?: number) {
  // Play celebration sound
  soundService.playLevelUp();

  // Determine celebration intensity based on rank
  const isTopThree = newRank <= 3;
  const isFirstPlace = newRank === 1;

  if (isFirstPlace) {
    // Epic celebration for #1!
    fireConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => fireConfetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } }), 250);
    setTimeout(() => fireConfetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } }), 400);
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });
    }, 600);
  } else if (isTopThree) {
    // Special celebration for top 3
    fireConfetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => fireConfetti({ particleCount: 40, angle: 60, spread: 45, origin: { x: 0 } }), 200);
    setTimeout(() => fireConfetti({ particleCount: 40, angle: 120, spread: 45, origin: { x: 1 } }), 350);
  } else {
    // Standard celebration for other rank improvements
    fireConfetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => fireConfetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } }), 200);
  }
}

function fireConfetti(options: confetti.Options) {
  confetti({
    ...options,
    disableForReducedMotion: true,
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
  });
}

export function RankCelebration({ currentRank, userId }: RankCelebrationProps) {
  useRankCelebration(currentRank, userId);
  return null; // This component only handles effects
}
