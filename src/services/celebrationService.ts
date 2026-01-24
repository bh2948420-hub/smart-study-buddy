import confetti from 'canvas-confetti';
import { soundService } from '@/services/soundService';

export type CelebrationType = 
  | 'level_up' 
  | 'achievement' 
  | 'challenge_complete' 
  | 'rank_up' 
  | 'perfect_score'
  | 'streak_milestone';

interface CelebrationOptions {
  type: CelebrationType;
  level?: number;
  rank?: number;
  streakDays?: number;
}

/**
 * Centralized celebration service for all app-wide celebrations
 */
export const celebrationService = {
  /**
   * Trigger a celebration effect based on the type
   */
  celebrate(options: CelebrationOptions) {
    const { type } = options;

    switch (type) {
      case 'level_up':
        this.playLevelUpCelebration(options.level);
        break;
      case 'achievement':
        this.playAchievementCelebration();
        break;
      case 'challenge_complete':
        this.playChallengeCelebration();
        break;
      case 'rank_up':
        this.playRankUpCelebration(options.rank);
        break;
      case 'perfect_score':
        this.playPerfectScoreCelebration();
        break;
      case 'streak_milestone':
        this.playStreakCelebration(options.streakDays);
        break;
    }
  },

  /**
   * Level up celebration - ascending confetti with level-based intensity
   */
  playLevelUpCelebration(level?: number) {
    soundService.playLevelUp();
    
    const intensity = level && level >= 10 ? 1.5 : 1;
    
    // Burst from center
    this.fireConfetti({
      particleCount: Math.floor(70 * intensity),
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#6EE7B7', '#FFD700'],
    });

    // Side bursts
    setTimeout(() => {
      this.fireConfetti({
        particleCount: Math.floor(30 * intensity),
        angle: 60,
        spread: 50,
        origin: { x: 0 },
        colors: ['#10B981', '#34D399'],
      });
    }, 150);

    setTimeout(() => {
      this.fireConfetti({
        particleCount: Math.floor(30 * intensity),
        angle: 120,
        spread: 50,
        origin: { x: 1 },
        colors: ['#10B981', '#34D399'],
      });
    }, 300);
  },

  /**
   * Achievement unlock celebration - golden stars effect
   */
  playAchievementCelebration() {
    soundService.playAchievement();
    
    // Star-shaped burst
    const defaults = {
      spread: 360,
      ticks: 60,
      gravity: 0.5,
      decay: 0.94,
      startVelocity: 20,
      colors: ['#FFD700', '#FFA500', '#FF6347', '#FFE4B5'],
    };

    this.fireConfetti({
      ...defaults,
      particleCount: 50,
      scalar: 1.2,
      shapes: ['star'],
      origin: { y: 0.5 },
    });

    setTimeout(() => {
      this.fireConfetti({
        ...defaults,
        particleCount: 30,
        scalar: 0.8,
        shapes: ['circle'],
        origin: { y: 0.5 },
      });
    }, 200);
  },

  /**
   * Weekly challenge completion - purple themed celebration
   */
  playChallengeCelebration() {
    soundService.playSessionComplete();
    
    // Burst upward
    this.fireConfetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#10B981'],
    });

    // Sparkle effect
    setTimeout(() => {
      this.fireConfetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#8B5CF6', '#FFD700'],
        ticks: 80,
        gravity: 0.8,
      });
    }, 250);
  },

  /**
   * Rank improvement celebration - intensity based on new rank
   */
  playRankUpCelebration(newRank?: number) {
    soundService.playLevelUp();
    
    const isTopThree = newRank && newRank <= 3;
    const isFirst = newRank === 1;

    if (isFirst) {
      // Epic #1 celebration
      this.fireConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => this.fireConfetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } }), 250);
      setTimeout(() => this.fireConfetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } }), 400);
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });
      }, 600);
    } else if (isTopThree) {
      // Top 3 celebration
      this.fireConfetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => this.fireConfetti({ particleCount: 40, angle: 60, spread: 45, origin: { x: 0 } }), 200);
      setTimeout(() => this.fireConfetti({ particleCount: 40, angle: 120, spread: 45, origin: { x: 1 } }), 350);
    } else {
      // Standard rank improvement
      this.fireConfetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      setTimeout(() => this.fireConfetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } }), 200);
    }
  },

  /**
   * Perfect quiz score celebration
   */
  playPerfectScoreCelebration() {
    soundService.playCorrect();
    
    // Gold and green burst
    this.fireConfetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#10B981', '#FFA500', '#34D399'],
    });

    // Follow-up sparkles
    setTimeout(() => {
      this.fireConfetti({
        particleCount: 40,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFFACD'],
        ticks: 100,
      });
    }, 300);
  },

  /**
   * Streak milestone celebration (7, 14, 30, etc. days)
   */
  playStreakCelebration(streakDays?: number) {
    soundService.playAchievement();
    
    const isMajorMilestone = streakDays && (streakDays === 30 || streakDays === 60 || streakDays === 100);
    
    // Fire themed celebration
    this.fireConfetti({
      particleCount: isMajorMilestone ? 80 : 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#F97316', '#FB923C', '#FDBA74', '#FFD700'],
    });

    if (isMajorMilestone) {
      setTimeout(() => {
        this.fireConfetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#F97316', '#EF4444', '#FFD700'],
        });
      }, 250);
    }
  },

  /**
   * Fire confetti with default settings
   */
  fireConfetti(options: confetti.Options) {
    confetti({
      ...options,
      disableForReducedMotion: true,
    });
  },
};
