import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAchievements } from '@/hooks/useAchievements';
import { useStats } from '@/hooks/useStats';
import { cn } from '@/lib/utils';
import { Flame, Loader2 } from 'lucide-react';

interface StreakMilestone {
  days: number;
  icon: string;
  name: string;
  name_ar: string;
  color: string;
}

const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 7, icon: '🔥', name: 'Week Warrior', name_ar: 'محارب الأسبوع', color: 'from-orange-400 to-orange-600' },
  { days: 30, icon: '👑', name: 'Month Master', name_ar: 'سيد الشهر', color: 'from-yellow-400 to-amber-600' },
  { days: 100, icon: '🏅', name: 'Streak Legend', name_ar: 'أسطورة الالتزام', color: 'from-purple-400 to-purple-600' },
];

export const StreakBadges = () => {
  const { language } = useLanguage();
  const { achievements, userAchievements, loading: achievementsLoading } = useAchievements();
  const { stats, loading: statsLoading } = useStats();

  if (achievementsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const earnedAchievementIds = userAchievements.map(ua => ua.achievement_id);
  
  // Map streak milestones to their achievement status
  const streakAchievements = STREAK_MILESTONES.map(milestone => {
    const achievement = achievements.find(
      a => a.requirement_type === 'streak_days' && a.requirement_value === milestone.days
    );
    const isEarned = achievement ? earnedAchievementIds.includes(achievement.id) : false;
    const progress = Math.min(100, (stats.streakDays / milestone.days) * 100);
    
    return {
      ...milestone,
      achievement,
      isEarned,
      progress,
    };
  });

  const earnedCount = streakAchievements.filter(s => s.isEarned).length;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-500" />
        <h3 className="font-semibold">
          {language === 'ar' ? 'شارات الالتزام' : 'Streak Badges'}
        </h3>
        <Badge variant="secondary" className="ml-auto">
          {earnedCount}/{STREAK_MILESTONES.length}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        {streakAchievements.map((streak) => (
          <div
            key={streak.days}
            className={cn(
              'relative flex flex-col items-center p-4 rounded-xl transition-all duration-300',
              streak.isEarned
                ? 'bg-gradient-to-br ' + streak.color + ' text-white shadow-lg scale-100'
                : 'bg-muted/50 opacity-50 grayscale'
            )}
          >
            {/* Badge icon */}
            <div className={cn(
              'text-4xl mb-2',
              streak.isEarned && 'animate-pulse'
            )}>
              {streak.icon}
            </div>
            
            {/* Days badge */}
            <div className={cn(
              'text-lg font-bold',
              streak.isEarned ? 'text-white' : 'text-muted-foreground'
            )}>
              {streak.days} {language === 'ar' ? 'يوم' : 'days'}
            </div>
            
            {/* Name */}
            <div className={cn(
              'text-xs text-center mt-1',
              streak.isEarned ? 'text-white/90' : 'text-muted-foreground'
            )}>
              {language === 'ar' ? streak.name_ar : streak.name}
            </div>

            {/* Progress indicator for unearned */}
            {!streak.isEarned && (
              <div className="mt-2 w-full">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${streak.progress}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground text-center mt-1">
                  {stats.streakDays}/{streak.days}
                </div>
              </div>
            )}

            {/* Earned checkmark */}
            {streak.isEarned && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 shadow-md">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current streak display */}
      <div className="mt-4 pt-4 border-t text-center">
        <div className="text-sm text-muted-foreground">
          {language === 'ar' ? 'الالتزام الحالي' : 'Current Streak'}
        </div>
        <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
          <Flame className="h-5 w-5" />
          {stats.streakDays} {language === 'ar' ? 'يوم' : 'days'}
        </div>
      </div>
    </Card>
  );
};
