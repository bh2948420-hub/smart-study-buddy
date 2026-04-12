import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain, Loader2, Sparkles, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Shield, Zap, RotateCcw, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface SubjectPrediction {
  subject: string;
  predicted_grade: string;
  predicted_percentage: number;
  risk_level: 'low' | 'medium' | 'high';
  key_insight: string;
  action_item: string;
}

interface PredictionData {
  overall_prediction: {
    grade: string;
    percentage: number;
    confidence: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  subject_predictions: SubjectPrediction[];
  strengths: string[];
  warnings: string[];
  motivational_message: string;
  study_efficiency_score: number;
  predicted_rank_change: 'up' | 'same' | 'down';
}

export const AIPerformancePredictor = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const gatherStudentData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [quizResults, tasks, sessions, profile] = await Promise.all([
      supabase.from('quiz_results').select('*').eq('user_id', user.id).gte('completed_at', thirtyDaysAgo),
      supabase.from('tasks').select('*').eq('user_id', user.id).gte('created_at', thirtyDaysAgo),
      supabase.from('study_sessions').select('*').eq('user_id', user.id).gte('created_at', thirtyDaysAgo),
      supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    const quizzes = quizResults.data || [];
    const tasksList = tasks.data || [];
    const sessionsList = sessions.data || [];
    const profileData = profile.data;

    // Get quiz details with subjects
    const quizIds = [...new Set(quizzes.map(q => q.quiz_id))];
    let quizSubjects: any[] = [];
    if (quizIds.length > 0) {
      const { data } = await supabase.from('quizzes').select('id, subject, title').in('id', quizIds);
      quizSubjects = data || [];
    }

    return {
      quiz_results: quizzes.map(q => {
        const quiz = quizSubjects.find(qs => qs.id === q.quiz_id);
        return {
          subject: quiz?.subject || quiz?.title || 'Unknown',
          score: q.score,
          total: q.total_questions,
          percentage: q.percentage,
          date: q.completed_at,
        };
      }),
      tasks: {
        total: tasksList.length,
        completed: tasksList.filter(t => t.completed).length,
        completion_rate: tasksList.length > 0 
          ? Math.round((tasksList.filter(t => t.completed).length / tasksList.length) * 100) 
          : 0,
        by_priority: {
          high: tasksList.filter(t => t.priority === 'high').length,
          medium: tasksList.filter(t => t.priority === 'medium').length,
          low: tasksList.filter(t => t.priority === 'low').length,
        },
      },
      study_sessions: {
        total_sessions: sessionsList.length,
        total_minutes: sessionsList.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
        avg_session_minutes: sessionsList.length > 0 
          ? Math.round(sessionsList.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessionsList.length) 
          : 0,
      },
      profile: {
        streak_days: profileData?.streak_days || 0,
        xp_points: profileData?.xp_points || 0,
        level: profileData?.level || 1,
      },
      period: 'last_30_days',
    };
  };

  const generatePrediction = async () => {
    setLoading(true);
    try {
      const studentData = await gatherStudentData();
      if (!studentData) {
        toast.error(isAr ? 'مش قادر أجمع بياناتك' : 'Could not gather your data');
        return;
      }

      const { data, error } = await supabase.functions.invoke('predict-performance', {
        body: { studentData, language },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPrediction(data);
      setExpanded(true);
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'حصل خطأ في التحليل' : 'Error generating prediction');
    } finally {
      setLoading(false);
    }
  };

  const trendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const riskColor = (risk: string) => {
    if (risk === 'high') return 'destructive';
    if (risk === 'medium') return 'secondary';
    return 'default';
  };

  const gradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-500';
    if (grade.startsWith('B')) return 'text-blue-500';
    if (grade.startsWith('C')) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!prediction && !loading) {
    return (
      <Card className="animate-fade-in border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="text-center py-6 space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-base">
              {isAr ? '🔮 تنبؤ الأداء بالـ AI' : '🔮 AI Performance Prophecy'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? 'الذكاء الاصطناعي هيحلل بياناتك ويتنبأ بدرجاتك في الامتحانات الجاية!'
                : 'AI will analyze your data and predict your upcoming exam grades!'}
            </p>
          </div>
          <Button onClick={generatePrediction} className="gap-2" size="sm">
            <Sparkles className="h-4 w-4" />
            {isAr ? 'اعرف مستقبلك الدراسي' : 'Reveal My Prophecy'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="text-center py-8 space-y-3">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Brain className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-medium">
            {isAr ? '🔮 بيحلل بياناتك ويتنبأ بأدائك...' : '🔮 Analyzing your data & predicting performance...'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'بيراجع الكويزات والمهام ووقت المذاكرة' : 'Reviewing quizzes, tasks & study time'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) return null;

  const p = prediction;

  return (
    <Card className="animate-fade-in overflow-hidden">
      {/* Header with overall grade */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-background shadow-lg flex items-center justify-center">
              <span className={`text-2xl font-black ${gradeColor(p.overall_prediction.grade)}`}>
                {p.overall_prediction.grade}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1">
                {isAr ? '🔮 تنبؤ الأداء' : '🔮 Performance Prophecy'}
                {trendIcon(p.overall_prediction.trend)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isAr ? `ثقة التنبؤ: ${p.overall_prediction.confidence}%` : `Confidence: ${p.overall_prediction.confidence}%`}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-primary">{p.overall_prediction.percentage}%</div>
            <p className="text-[10px] text-muted-foreground">
              {isAr ? 'متوقع' : 'predicted'}
            </p>
          </div>
        </div>

        {/* Efficiency Score */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              {isAr ? 'كفاءة المذاكرة' : 'Study Efficiency'}
            </span>
            <span className="font-bold">{p.study_efficiency_score}%</span>
          </div>
          <Progress value={p.study_efficiency_score} className="h-1.5" />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Toggle details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          <Eye className="h-3 w-3" />
          {expanded
            ? (isAr ? 'إخفاء التفاصيل' : 'Hide Details')
            : (isAr ? 'عرض التفاصيل' : 'Show Details')}
        </Button>

        {expanded && (
          <ScrollArea className="max-h-[350px]">
            <div className="space-y-4">
              {/* Subject Predictions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {isAr ? 'تنبؤات المواد' : 'Subject Predictions'}
                </h4>
                {p.subject_predictions.map((sp, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{sp.subject}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={riskColor(sp.risk_level) as any} className="text-[10px] px-1.5 py-0">
                          {sp.risk_level === 'high' 
                            ? (isAr ? 'خطر' : 'Risk') 
                            : sp.risk_level === 'medium' 
                              ? (isAr ? 'متوسط' : 'Medium') 
                              : (isAr ? 'آمن' : 'Safe')}
                        </Badge>
                        <span className={`text-sm font-black ${gradeColor(sp.predicted_grade)}`}>
                          {sp.predicted_grade}
                        </span>
                      </div>
                    </div>
                    <Progress value={sp.predicted_percentage} className="h-1" />
                    <p className="text-[11px] text-muted-foreground">{sp.key_insight}</p>
                    <p className="text-[11px] text-primary font-medium">💡 {sp.action_item}</p>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {p.strengths.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1 mb-1">
                    <Shield className="h-3 w-3 text-green-500" />
                    {isAr ? 'نقاط قوتك' : 'Your Strengths'}
                  </h4>
                  {p.strengths.map((s, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">✅ {s}</p>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {p.warnings.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    {isAr ? 'انتبه!' : 'Watch Out!'}
                  </h4>
                  {p.warnings.map((w, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">⚠️ {w}</p>
                  ))}
                </div>
              )}

              {/* Motivational Message */}
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-xs font-medium">💪 {p.motivational_message}</p>
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Refresh */}
        <Button variant="outline" size="sm" onClick={generatePrediction} className="w-full gap-2 text-xs" disabled={loading}>
          <RotateCcw className="h-3 w-3" />
          {isAr ? 'تحديث التنبؤ' : 'Refresh Prediction'}
        </Button>
      </CardContent>
    </Card>
  );
};
