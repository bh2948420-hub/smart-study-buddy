import { useAchievements } from '@/hooks/useAchievements';
import { useStats } from '@/hooks/useStats';
import { AchievementCard } from './AchievementCard';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const AchievementsList = () => {
  const { language } = useLanguage();
  const { achievements, userAchievements, loading: achievementsLoading, getAchievementProgress } = useAchievements();
  const { stats, loading: statsLoading } = useStats();

  if (achievementsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const earnedIds = userAchievements.map(ua => ua.achievement_id);
  
  const statsData = {
    studyHours: stats.totalStudyHours,
    quizzesCompleted: stats.quizzesCompleted,
    streakDays: stats.streakDays,
    bestQuizScore: stats.averageScore, // Use average as proxy
  };

  // Sort: earned first, then by progress
  const sortedAchievements = [...achievements].sort((a, b) => {
    const aEarned = earnedIds.includes(a.id);
    const bEarned = earnedIds.includes(b.id);
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return getAchievementProgress(b, statsData) - getAchievementProgress(a, statsData);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {language === 'ar' ? 'الإنجازات' : 'Achievements'}
        </h2>
        <span className="text-sm text-muted-foreground">
          {earnedIds.length}/{achievements.length} {language === 'ar' ? 'مكتسب' : 'earned'}
        </span>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {sortedAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            earned={earnedIds.includes(achievement.id)}
            progress={getAchievementProgress(achievement, statsData)}
          />
        ))}
      </div>
    </div>
  );
};
