import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, TrendingDown, Sparkles, Crown } from 'lucide-react';

interface SubjectMastery {
  subject: string;
  quizAvg: number;
  studyHours: number;
  tasksCompleted: number;
  mastery: number; // 0-100
  trend: 'up' | 'down' | 'stable';
}

export const SubjectMasteryRadar = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [subjects, setSubjects] = useState<SubjectMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallMastery, setOverallMastery] = useState(0);

  useEffect(() => {
    const fetchMastery = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [quizRes, sessionRes, taskRes, scheduleRes] = await Promise.all([
        supabase.from('quiz_results').select('quiz_id, percentage, completed_at, quizzes(subject)').eq('user_id', user.id),
        supabase.from('study_sessions').select('subject, duration_minutes').eq('user_id', user.id),
        supabase.from('tasks').select('title, completed, due_date').eq('user_id', user.id),
        supabase.from('study_schedule').select('subject').eq('user_id', user.id),
      ]);

      // Collect all subjects from schedule
      const subjectSet = new Set<string>();
      scheduleRes.data?.forEach(s => { if (s.subject) subjectSet.add(s.subject); });
      // Also from quiz results
      quizRes.data?.forEach((r: any) => { if (r.quizzes?.subject) subjectSet.add(r.quizzes.subject); });
      // From sessions
      sessionRes.data?.forEach(s => { if (s.subject) subjectSet.add(s.subject); });

      if (subjectSet.size === 0) {
        // Fallback demo data
        subjectSet.add(isAr ? 'رياضيات' : 'Math');
        subjectSet.add(isAr ? 'علوم' : 'Science');
        subjectSet.add(isAr ? 'إنجليزي' : 'English');
        subjectSet.add(isAr ? 'عربي' : 'Arabic');
      }

      const masteryData: SubjectMastery[] = [];
      
      for (const subject of subjectSet) {
        // Quiz average for this subject
        const subjectQuizzes = quizRes.data?.filter((r: any) => r.quizzes?.subject === subject) || [];
        const quizAvg = subjectQuizzes.length > 0 
          ? subjectQuizzes.reduce((sum: number, r: any) => sum + Number(r.percentage), 0) / subjectQuizzes.length 
          : 0;

        // Study hours
        const subjectSessions = sessionRes.data?.filter(s => s.subject === subject) || [];
        const studyMinutes = subjectSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const studyHours = Math.round(studyMinutes / 60 * 10) / 10;

        // Tasks completed (simple match by subject name in title)
        const subjectTasks = taskRes.data?.filter(t => 
          t.title.toLowerCase().includes(subject.toLowerCase())
        ) || [];
        const tasksCompleted = subjectTasks.filter(t => t.completed).length;

        // Calculate mastery score (weighted)
        const quizWeight = 0.5;
        const studyWeight = 0.3;
        const taskWeight = 0.2;
        
        const quizScore = quizAvg; // already 0-100
        const studyScore = Math.min(studyHours * 10, 100); // 10 hours = 100%
        const taskScore = Math.min(tasksCompleted * 20, 100); // 5 tasks = 100%
        
        const mastery = Math.round(quizScore * quizWeight + studyScore * studyWeight + taskScore * taskWeight);

        // Simple trend (compare recent vs older quiz scores)
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (subjectQuizzes.length >= 2) {
          const sorted = [...subjectQuizzes].sort((a: any, b: any) => 
            new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
          );
          const recent = Number((sorted[0] as any).percentage);
          const older = Number((sorted[sorted.length - 1] as any).percentage);
          trend = recent > older ? 'up' : recent < older ? 'down' : 'stable';
        }

        masteryData.push({ subject, quizAvg: Math.round(quizAvg), studyHours, tasksCompleted, mastery, trend });
      }

      setSubjects(masteryData);
      setOverallMastery(masteryData.length > 0 
        ? Math.round(masteryData.reduce((sum, s) => sum + s.mastery, 0) / masteryData.length) 
        : 0);
      setLoading(false);
    };

    fetchMastery();
  }, [isAr]);

  const radarData = subjects.map(s => ({
    subject: s.subject.length > 8 ? s.subject.slice(0, 8) + '..' : s.subject,
    mastery: s.mastery,
    fullMark: 100,
  }));

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'text-emerald-500';
    if (mastery >= 60) return 'text-blue-500';
    if (mastery >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getMasteryLabel = (mastery: number) => {
    if (mastery >= 80) return isAr ? '🏆 متفوق' : '🏆 Master';
    if (mastery >= 60) return isAr ? '⭐ متقدم' : '⭐ Advanced';
    if (mastery >= 40) return isAr ? '📈 متوسط' : '📈 Intermediate';
    return isAr ? '🌱 مبتدئ' : '🌱 Beginner';
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-64 flex items-center justify-center">
          <Sparkles className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {isAr ? '🎯 إتقان المواد' : '🎯 Subject Mastery'}
          </CardTitle>
          <Badge variant="secondary" className={`${getMasteryColor(overallMastery)} font-bold`}>
            {getMasteryLabel(overallMastery)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Radar Chart */}
          {radarData.length >= 3 && (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar
                    name="Mastery"
                    dataKey="mastery"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject List */}
          <div className="space-y-3">
            {subjects.sort((a, b) => b.mastery - a.mastery).map((s, i) => (
              <div key={s.subject} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                    <span className="font-medium truncate max-w-[120px]">{s.subject}</span>
                    {s.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                    {s.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                  </div>
                  <span className={`font-bold ${getMasteryColor(s.mastery)}`}>{s.mastery}%</span>
                </div>
                <Progress value={s.mastery} className="h-2" />
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span>{isAr ? `كويز: ${s.quizAvg}%` : `Quiz: ${s.quizAvg}%`}</span>
                  <span>{isAr ? `${s.studyHours}س دراسة` : `${s.studyHours}h study`}</span>
                  <span>{isAr ? `${s.tasksCompleted} مهمة` : `${s.tasksCompleted} tasks`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
