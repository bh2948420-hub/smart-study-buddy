import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

type ChartView = 'daily' | 'weekly';

interface DayData {
  date: string;
  label: string;
  minutes: number;
  active: boolean;
}

export const StreakProgressChart = () => {
  const { language } = useLanguage();
  const [view, setView] = useState<ChartView>('daily');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    title: language === 'ar' ? 'تقدم الالتزام' : 'Streak Progress',
    daily: language === 'ar' ? 'يومي' : 'Daily',
    weekly: language === 'ar' ? 'أسبوعي' : 'Weekly',
    minutes: language === 'ar' ? 'دقيقة' : 'min',
    noActivity: language === 'ar' ? 'لا يوجد نشاط' : 'No activity',
    activeDays: language === 'ar' ? 'أيام نشطة' : 'Active days',
    totalMinutes: language === 'ar' ? 'إجمالي الدقائق' : 'Total minutes',
    week: language === 'ar' ? 'الأسبوع' : 'Week',
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const since = subDays(new Date(), 28);
        const { data } = await supabase
          .from('study_sessions')
          .select('start_time, duration_minutes')
          .eq('user_id', user.id)
          .gte('start_time', since.toISOString())
          .order('start_time', { ascending: true });

        setSessions(data || []);
      } catch (err) {
        console.error('Error fetching sessions for chart:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const dailyData = useMemo(() => {
    const days = 14;
    const today = startOfDay(new Date());
    const result: DayData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(today, i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMinutes = sessions
        .filter(s => {
          const d = new Date(s.start_time);
          return d >= day && d <= dayEnd;
        })
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      result.push({
        date: format(day, 'yyyy-MM-dd'),
        label: format(day, 'dd/MM'),
        minutes: dayMinutes,
        active: dayMinutes > 0,
      });
    }
    return result;
  }, [sessions]);

  const weeklyData = useMemo(() => {
    const weeks: { label: string; minutes: number; activeDays: number }[] = [];
    const today = new Date();

    for (let w = 3; w >= 0; w--) {
      const weekStart = startOfWeek(subDays(today, w * 7), { weekStartsOn: 6 });
      const weekEnd = endOfWeek(subDays(today, w * 7), { weekStartsOn: 6 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd > today ? today : weekEnd });

      let totalMin = 0;
      let activeDayCount = 0;

      daysInWeek.forEach(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayMin = sessions
          .filter(s => {
            const d = new Date(s.start_time);
            return d >= dayStart && d <= dayEnd;
          })
          .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

        totalMin += dayMin;
        if (dayMin > 0) activeDayCount++;
      });

      weeks.push({
        label: `${t.week} ${4 - w}`,
        minutes: totalMin,
        activeDays: activeDayCount,
      });
    }
    return weeks;
  }, [sessions, t.week]);

  const activeDaysCount = dailyData.filter(d => d.active).length;
  const totalMinutes = dailyData.reduce((s, d) => s + d.minutes, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            {t.title}
          </CardTitle>
          <Tabs value={view} onValueChange={(v) => setView(v as ChartView)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="text-xs px-3 gap-1">
                <Calendar className="h-3 w-3" />
                {t.daily}
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-3 gap-1">
                <TrendingUp className="h-3 w-3" />
                {t.weekly}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {/* Summary stats */}
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
            {activeDaysCount} {t.activeDays}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            {totalMinutes} {t.totalMinutes}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'daily' ? (
              <BarChart data={dailyData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--popover))',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(value: number) => [`${value} ${t.minutes}`, '']}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {dailyData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.active ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                      className={entry.active ? 'opacity-90 hover:opacity-100' : 'opacity-40'}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={weeklyData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--popover))',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'minutes') return [`${value} ${t.minutes}`, t.totalMinutes];
                    return [`${value}`, t.activeDays];
                  }}
                />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar dataKey="activeDays" fill="hsl(var(--chart-2, var(--accent)))" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Daily streak dots */}
        {view === 'daily' && (
          <div className="flex justify-center gap-1 mt-3">
            {dailyData.map((day, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full transition-all ${
                  day.active
                    ? 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]'
                    : 'bg-muted'
                }`}
                title={`${day.label}: ${day.minutes} ${t.minutes}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
