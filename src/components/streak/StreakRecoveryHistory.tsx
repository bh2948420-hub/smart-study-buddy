import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Coins, Calendar, History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface StreakRecovery {
  id: string;
  recovered_streak: number;
  xp_spent: number;
  recovered_at: string;
}

export const StreakRecoveryHistory = () => {
  const { language } = useLanguage();

  const { data: recoveries, isLoading } = useQuery({
    queryKey: ['streak-recoveries'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('streak_recoveries')
        .select('*')
        .eq('user_id', user.id)
        .order('recovered_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as StreakRecovery[];
    },
  });

  const t = {
    title: language === 'ar' ? 'سجل استعادة السلسلة' : 'Streak Recovery History',
    noRecoveries: language === 'ar' ? 'لم تستعد أي سلسلة بعد' : "You haven't recovered any streaks yet",
    totalRecoveries: language === 'ar' ? 'إجمالي الاستعادات' : 'Total Recoveries',
    totalXPSpent: language === 'ar' ? 'إجمالي XP المنفقة' : 'Total XP Spent',
    days: language === 'ar' ? 'يوم' : 'days',
    streak: language === 'ar' ? 'سلسلة' : 'streak',
  };

  const totalRecoveries = recoveries?.length || 0;
  const totalXPSpent = recoveries?.reduce((sum, r) => sum + r.xp_spent, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-orange-500" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-orange-500">{totalRecoveries}</div>
            <div className="text-xs text-muted-foreground">{t.totalRecoveries}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-yellow-500">{totalXPSpent}</div>
            <div className="text-xs text-muted-foreground">{t.totalXPSpent}</div>
          </div>
        </div>

        {/* Recovery List */}
        {recoveries && recoveries.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recoveries.map((recovery) => (
              <div
                key={recovery.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-500/10">
                    <Flame className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {recovery.recovered_streak} {t.days} {t.streak}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(recovery.recovered_at), 'PPp', {
                        locale: language === 'ar' ? ar : enUS,
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                  <Coins className="h-4 w-4" />
                  -{recovery.xp_spent}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Flame className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>{t.noRecoveries}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
