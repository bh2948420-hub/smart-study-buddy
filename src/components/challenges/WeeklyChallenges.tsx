import { useLanguage } from '@/contexts/LanguageContext';
import { useChallenges } from '@/hooks/useChallenges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WeeklyChallenges = () => {
  const { language } = useLanguage();
  const { challenges, loading, claimXP } = useChallenges();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'تحديات الأسبوع' : 'Weekly Challenges'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'تحديات الأسبوع' : 'Weekly Challenges'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {language === 'ar' 
              ? 'لا توجد تحديات حالية' 
              : 'No active challenges this week'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {language === 'ar' ? 'تحديات الأسبوع' : 'Weekly Challenges'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge) => {
          const progress = challenge.progress;
          const currentValue = progress?.current_value || 0;
          const progressPercent = Math.min((currentValue / challenge.target_value) * 100, 100);
          const isCompleted = progress?.completed || false;
          const xpClaimed = progress?.xp_claimed || false;

          return (
            <div
              key={challenge.id}
              className={cn(
                'p-4 rounded-lg border transition-all',
                isCompleted 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30 border-border'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{challenge.icon}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">
                      {language === 'ar' ? challenge.title_ar : challenge.title}
                    </h4>
                    {isCompleted && (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" />
                        {language === 'ar' ? 'مكتمل' : 'Done'}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {language === 'ar' ? challenge.description_ar : challenge.description}
                  </p>

                  <div className="flex items-center gap-2 mb-2">
                    <Progress value={progressPercent} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {currentValue}/{challenge.target_value}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      +{challenge.xp_reward} XP
                    </Badge>

                    {isCompleted && !xpClaimed && (
                      <Button
                        size="sm"
                        onClick={() => claimXP(challenge.id)}
                        className="gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        {language === 'ar' ? 'استلم المكافأة' : 'Claim XP'}
                      </Button>
                    )}

                    {xpClaimed && (
                      <span className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'تم الاستلام ✓' : 'Claimed ✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
