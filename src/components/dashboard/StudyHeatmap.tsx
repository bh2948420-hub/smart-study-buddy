import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame } from 'lucide-react';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

const TOTAL_DAYS = 84; // 12 weeks
const COLS = 12;

interface DayData {
  date: Date;
  tasksCompleted: number;
  studyMinutes: number;
  level: number; // 0-4
}

export const StudyHeatmap = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [dayMap, setDayMap] = useState<Map<string, { tasks: number; minutes: number }>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const since = subDays(new Date(), TOTAL_DAYS).toISOString();
      
      const [tasksRes, sessionsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('due_date, completed')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('due_date', since),
        supabase
          .from('study_sessions')
          .select('created_at, duration_minutes')
          .eq('user_id', user.id)
          .gte('created_at', since),
      ]);

      const map = new Map<string, { tasks: number; minutes: number }>();

      tasksRes.data?.forEach(t => {
        const key = format(new Date(t.due_date), 'yyyy-MM-dd');
        const existing = map.get(key) || { tasks: 0, minutes: 0 };
        existing.tasks++;
        map.set(key, existing);
      });

      sessionsRes.data?.forEach(s => {
        const key = format(new Date(s.created_at), 'yyyy-MM-dd');
        const existing = map.get(key) || { tasks: 0, minutes: 0 };
        existing.minutes += s.duration_minutes || 0;
        map.set(key, existing);
      });

      setDayMap(map);
    };

    fetchData();
  }, []);

  const days = useMemo(() => {
    const result: DayData[] = [];
    const today = startOfDay(new Date());
    
    for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const key = format(date, 'yyyy-MM-dd');
      const data = dayMap.get(key);
      const tasks = data?.tasks || 0;
      const minutes = data?.minutes || 0;
      const score = tasks * 2 + Math.floor(minutes / 15);
      
      let level = 0;
      if (score >= 8) level = 4;
      else if (score >= 5) level = 3;
      else if (score >= 3) level = 2;
      else if (score >= 1) level = 1;

      result.push({ date, tasksCompleted: tasks, studyMinutes: minutes, level });
    }
    return result;
  }, [dayMap]);

  const levelColors = [
    'bg-muted',
    'bg-emerald-200 dark:bg-emerald-900',
    'bg-emerald-400 dark:bg-emerald-700',
    'bg-emerald-500 dark:bg-emerald-500',
    'bg-emerald-600 dark:bg-emerald-400',
  ];

  const totalActive = days.filter(d => d.level > 0).length;
  const currentStreak = (() => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].level > 0) streak++;
      else break;
    }
    return streak;
  })();

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          {isAr ? '🗺️ خريطة المذاكرة' : '🗺️ Study Journey Map'}
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {isAr ? `${totalActive} يوم نشط` : `${totalActive} active days`}
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            {isAr ? `${currentStreak} يوم متتالي` : `${currentStreak} day streak`}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-1">
          {days.map((day, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className={`aspect-square rounded-sm ${levelColors[day.level]} transition-colors cursor-pointer hover:ring-2 hover:ring-primary/50`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  {format(day.date, 'EEE, d MMM', { locale: isAr ? ar : undefined })}
                </p>
                <p className="text-xs">
                  {isAr 
                    ? `${day.tasksCompleted} مهمة · ${day.studyMinutes} دقيقة`
                    : `${day.tasksCompleted} tasks · ${day.studyMinutes} min`}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 mt-2 text-xs text-muted-foreground">
          <span>{isAr ? 'أقل' : 'Less'}</span>
          {levelColors.map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>{isAr ? 'أكتر' : 'More'}</span>
        </div>
      </CardContent>
    </Card>
  );
};
