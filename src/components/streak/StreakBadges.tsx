import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Award } from 'lucide-react';

const STREAK_BADGES = [
  { days: 3, icon: '🔥', name: 'Spark', nameAr: 'شرارة', color: 'from-orange-300 to-orange-400' },
  { days: 7, icon: '⚡', name: 'Week Warrior', nameAr: 'محارب الأسبوع', color: 'from-amber-400 to-amber-500' },
  { days: 14, icon: '🌟', name: 'Consistent', nameAr: 'ثابت', color: 'from-yellow-400 to-yellow-500' },
  { days: 21, icon: '💪', name: 'Dedicated', nameAr: 'مُلتزم', color: 'from-blue-400 to-blue-500' },
  { days: 30, icon: '👑', name: 'Monthly King', nameAr: 'ملك الشهر', color: 'from-purple-400 to-purple-500' },
  { days: 50, icon: '🏆', name: 'Champion', nameAr: 'بطل', color: 'from-emerald-400 to-emerald-500' },
  { days: 100, icon: '💎', name: 'Diamond', nameAr: 'ماسي', color: 'from-cyan-400 to-cyan-500' },
  { days: 365, icon: '🌍', name: 'Legendary', nameAr: 'أسطوري', color: 'from-red-400 to-red-500' },
];

export const StreakBadges = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    const fetchStreak = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('streak_days')
        .eq('user_id', user.id)
        .single();
      if (data) setStreakDays(data.streak_days || 0);
    };
    fetchStreak();
  }, []);

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          {isAr ? '🏅 شارات السلسلة' : '🏅 Streak Badges'}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {isAr ? `سلسلتك الحالية: ${streakDays} يوم` : `Current streak: ${streakDays} days`}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {STREAK_BADGES.map(badge => {
            const earned = streakDays >= badge.days;
            return (
              <Tooltip key={badge.days}>
                <TooltipTrigger asChild>
                  <div className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    earned 
                      ? `bg-gradient-to-br ${badge.color} shadow-lg` 
                      : 'bg-muted/50 opacity-40 grayscale'
                  }`}>
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-[9px] font-bold text-center leading-tight">{badge.days}d</span>
                    {earned && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{isAr ? badge.nameAr : badge.name}</p>
                  <p className="text-xs">
                    {earned 
                      ? (isAr ? '✅ تم الحصول عليها!' : '✅ Earned!') 
                      : (isAr ? `${badge.days - streakDays} يوم متبقي` : `${badge.days - streakDays} days to go`)}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
