import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useTasks } from '@/hooks/useTasks';
import { useQuizzes } from '@/hooks/useQuizzes';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Clock, CheckCircle, Trophy, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface QuizResultData {
  percentage: number;
  completed_at: string;
}

const Reports = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const { sessions, loading: sessionsLoading } = useStudySessions();
  const { tasks, loading: tasksLoading } = useTasks();
  const { quizzes, loading: quizzesLoading } = useQuizzes();
  const quizResults: QuizResultData[] = []; // Quiz results would be fetched separately
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const locale = language === 'ar' ? ar : enUS;

  // Calculate weekly study data
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyStudyData = weekDays.map(day => {
    const dayName = format(day, 'EEE', { locale });
    const daySessions = sessions.filter(s => 
      s.end_time && isSameDay(new Date(s.start_time), day)
    );
    const totalMinutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    
    return {
      day: dayName,
      minutes: totalMinutes,
      hours: Math.round(totalMinutes / 60 * 10) / 10,
    };
  });

  // Tasks stats
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const tasksPieData = [
    { name: language === 'ar' ? 'مكتملة' : 'Completed', value: completedTasks, color: 'hsl(var(--accent))' },
    { name: language === 'ar' ? 'قيد الانتظار' : 'Pending', value: pendingTasks, color: 'hsl(var(--muted))' },
  ];

  // Quiz performance over time
  const quizPerformanceData = quizResults
    .slice(-10)
    .map(result => ({
      date: format(new Date(result.completed_at), 'MM/dd'),
      score: result.percentage,
    }));

  // Total stats
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const totalStudyHours = Math.round(totalStudyMinutes / 60 * 10) / 10;
  const averageQuizScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((acc, r) => acc + r.percentage, 0) / quizResults.length)
    : 0;

  if (loading || sessionsLoading || tasksLoading || quizzesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'التقارير والإحصائيات' : 'Reports & Statistics'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'تتبع تقدمك وإنجازاتك' : 'Track your progress and achievements'}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStudyHours}h</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الدراسة' : 'Total Study'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedTasks}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'مهام مكتملة' : 'Tasks Completed'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{quizResults.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'اختبارات' : 'Quizzes Taken'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{averageQuizScore}%</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'متوسط الدرجات' : 'Avg. Score'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Study Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {language === 'ar' ? 'الدراسة هذا الأسبوع' : 'This Week\'s Study'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'ساعات الدراسة اليومية' : 'Daily study hours'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyStudyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} ${language === 'ar' ? 'دقيقة' : 'min'}`, language === 'ar' ? 'الدراسة' : 'Study']}
                  />
                  <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tasks Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {language === 'ar' ? 'توزيع المهام' : 'Tasks Distribution'}
              </CardTitle>
              <CardDescription>
                {taskCompletionRate}% {language === 'ar' ? 'نسبة الإنجاز' : 'completion rate'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tasksPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {tasksPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quiz Performance Trend */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {language === 'ar' ? 'تطور أداء الاختبارات' : 'Quiz Performance Trend'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'آخر 10 اختبارات' : 'Last 10 quizzes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quizPerformanceData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={quizPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, language === 'ar' ? 'النتيجة' : 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reports;
