import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Target, Flame, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TodayStats {
  totalMinutes: number;
  sessionCount: number;
  goalMinutes: number;
}

export const FocusSessionSummary = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TodayStats>({
    totalMinutes: 0,
    sessionCount: 0,
    goalMinutes: 120, // Default 2 hours
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch today's study sessions
        const { data: sessions } = await supabase
          .from('study_sessions')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        // Fetch user's study goal
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('study_goal_minutes')
          .eq('user_id', user.id)
          .single();

        const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

        setStats({
          totalMinutes,
          sessionCount: sessions?.length || 0,
          goalMinutes: profile?.study_goal_minutes || 120,
        });
      } catch (error) {
        console.error('Error fetching today stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayStats();
  }, []);

  const progress = Math.min((stats.totalMinutes / stats.goalMinutes) * 100, 100);
  const remainingMinutes = Math.max(stats.goalMinutes - stats.totalMinutes, 0);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card className="animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            {language === 'ar' ? 'ملخص التركيز اليوم' : "Today's Focus"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/focus')}>
            {language === 'ar' ? 'ابدأ جلسة' : 'Start Session'}
            <ChevronRight className="h-4 w-4 mr-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress toward daily goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'ar' ? 'تقدم الهدف اليومي' : 'Daily Goal Progress'}
            </span>
            <span className="font-medium">
              {formatTime(stats.totalMinutes)} / {formatTime(stats.goalMinutes)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {progress >= 100 ? (
            <p className="text-sm text-primary flex items-center gap-1">
              <Flame className="h-4 w-4" />
              {language === 'ar' ? 'أحسنت! أكملت هدفك اليومي!' : 'Great job! You completed your daily goal!'}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? `متبقي ${formatTime(remainingMinutes)} للوصول للهدف`
                : `${formatTime(remainingMinutes)} remaining to reach your goal`
              }
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              {language === 'ar' ? 'الوقت الكلي' : 'Total Time'}
            </div>
            <p className="text-xl font-bold mt-1">{formatTime(stats.totalMinutes)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Target className="h-4 w-4" />
              {language === 'ar' ? 'الجلسات' : 'Sessions'}
            </div>
            <p className="text-xl font-bold mt-1">{stats.sessionCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
