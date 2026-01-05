import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Achievement } from '@/hooks/useAchievements';

interface AchievementCardProps {
  achievement: Achievement;
  earned: boolean;
  progress: number;
}

export const AchievementCard = ({ achievement, earned, progress }: AchievementCardProps) => {
  const { language } = useLanguage();
  
  return (
    <Card 
      className={cn(
        'p-4 transition-all duration-300',
        earned 
          ? 'bg-primary/10 border-primary/30 shadow-md' 
          : 'opacity-60 grayscale'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'text-3xl p-2 rounded-lg',
          earned ? 'bg-primary/20' : 'bg-muted'
        )}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">
            {language === 'ar' ? achievement.name_ar : achievement.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {language === 'ar' ? achievement.description_ar : achievement.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-primary">
              +{achievement.points} XP
            </span>
            {earned ? (
              <span className="text-xs text-green-600 dark:text-green-400">
                ✓ {language === 'ar' ? 'مكتسب' : 'Earned'}
              </span>
            ) : (
              <div className="flex-1">
                <Progress value={progress} className="h-1" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
