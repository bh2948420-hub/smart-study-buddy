import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useInsights, StudyInsight } from '@/hooks/useInsights';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Brain, 
  RefreshCw, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const InsightCard = ({ insight, language }: { insight: StudyInsight; language: string }) => {
  const locale = language === 'ar' ? ar : enUS;
  const weekRange = `${format(parseISO(insight.week_start), 'MMM d', { locale })} - ${format(parseISO(insight.week_end), 'MMM d, yyyy', { locale })}`;
  
  const t = {
    weeklyInsights: language === 'ar' ? 'تحليلات الدراسة الأسبوعية' : 'Weekly Study Insights',
    aiGenerated: language === 'ar' ? 'تم إنشاؤه بالذكاء الاصطناعي' : 'AI Generated',
    studyTime: language === 'ar' ? 'وقت الدراسة' : 'Study Time',
    tasksDone: language === 'ar' ? 'المهام المكتملة' : 'Tasks Done',
    quizzes: language === 'ar' ? 'الاختبارات' : 'Quizzes',
    avgScore: language === 'ar' ? 'متوسط الدرجات' : 'Avg Score',
    strongestSubject: language === 'ar' ? 'أقوى مادة' : 'Strongest Subject',
    needsImprovement: language === 'ar' ? 'تحتاج تحسين' : 'Needs Improvement',
    studyPatternAnalysis: language === 'ar' ? 'تحليل نمط الدراسة' : 'Study Pattern Analysis',
    improvementRecommendations: language === 'ar' ? 'توصيات التحسين' : 'Improvement Recommendations',
    hours: language === 'ar' ? 'س' : 'h',
    motivationTitle: language === 'ar' ? 'رسالة تحفيزية' : 'Motivation',
  };
  
  return (
    <div className="space-y-6">
      {/* Week Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t.weeklyInsights}</h2>
            <p className="text-sm text-muted-foreground">{weekRange}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {t.aiGenerated}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">{t.studyTime}</span>
            </div>
            <p className="text-2xl font-bold">{Math.round((insight.total_study_minutes || 0) / 60 * 10) / 10}{t.hours}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">{t.tasksDone}</span>
            </div>
            <p className="text-2xl font-bold">{insight.total_tasks_completed || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-medium">{t.quizzes}</span>
            </div>
            <p className="text-2xl font-bold">{insight.total_quizzes_completed || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium">{t.avgScore}</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(insight.average_quiz_score || 0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Analysis */}
      {(insight.strongest_subject || insight.weakest_subject) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insight.strongest_subject && (
            <Card className="border-green-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.strongestSubject}</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{insight.strongest_subject}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {insight.weakest_subject && insight.weakest_subject !== insight.strongest_subject && (
            <Card className="border-orange-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.needsImprovement}</p>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">{insight.weakest_subject}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pattern Analysis */}
      {insight.study_pattern_analysis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              {t.studyPatternAnalysis}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{insight.study_pattern_analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {insight.improvement_recommendations && insight.improvement_recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              {t.improvementRecommendations}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insight.improvement_recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <p className="text-muted-foreground pt-0.5">{rec}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Motivation Message */}
      {insight.motivation_message && (
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t.motivationTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-center">
            <p className="text-lg font-medium italic text-foreground">"{insight.motivation_message}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Insights = () => {
  const navigate = useNavigate();
  const { language, dir, t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const locale = language === 'ar' ? ar : enUS;
  
  const { insights, currentInsight, loading: insightsLoading, generating, generateInsight } = useInsights();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [navigate]);

  const handleGenerate = async () => {
    await generateInsight();
    setSelectedIndex(0);
  };

  const selectedInsight = insights[selectedIndex];

  const pageText = {
    title: language === 'ar' ? 'تحليلات الدراسة الذكية' : 'Smart Study Insights',
    subtitle: language === 'ar' ? 'تحليل ذكي لأنماط دراستك وتوصيات مخصصة' : 'AI-powered analysis of your study patterns and personalized recommendations',
    generateReport: language === 'ar' ? 'إنشاء تقرير جديد' : 'Generate New Report',
    generating: language === 'ar' ? 'جاري الإنشاء...' : 'Generating...',
    noInsightsYet: language === 'ar' ? 'لا توجد تحليلات بعد' : 'No Insights Yet',
    noInsightsDesc: language === 'ar' 
      ? 'أنشئ أول تقرير دراسي أسبوعي للحصول على توصيات مخصصة واكتشاف أنماط في رحلة تعلمك.'
      : 'Generate your first weekly study report to get personalized recommendations and discover patterns in your learning journey.',
    generateFirstReport: language === 'ar' ? 'إنشاء التقرير الأول' : 'Generate First Report',
    weekOf: language === 'ar' ? 'أسبوع' : 'Week of',
    whyUseInsights: language === 'ar' ? 'لماذا التحليلات مهمة؟' : 'Why Use Insights?',
    benefit1: language === 'ar' ? 'تحليل أنماط دراستك الأسبوعية' : 'Analyze your weekly study patterns',
    benefit2: language === 'ar' ? 'اكتشف نقاط قوتك وضعفك' : 'Discover your strengths and weaknesses',
    benefit3: language === 'ar' ? 'احصل على توصيات مخصصة للتحسين' : 'Get personalized improvement tips',
    benefit4: language === 'ar' ? 'تتبع تقدمك عبر الأسابيع' : 'Track your progress over weeks',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              {pageText.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {pageText.subtitle}
            </p>
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={generating}
            className="gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {pageText.generating}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {pageText.generateReport}
              </>
            )}
          </Button>
        </div>

        {/* Week Navigation */}
        {insights.length > 1 && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedIndex(Math.min(selectedIndex + 1, insights.length - 1))}
              disabled={selectedIndex >= insights.length - 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedInsight && (
                <>{pageText.weekOf} {format(parseISO(selectedInsight.week_start), 'MMM d, yyyy', { locale })}</>
              )}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedIndex(Math.max(selectedIndex - 1, 0))}
              disabled={selectedIndex <= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        {insightsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : selectedInsight ? (
          <InsightCard insight={selectedInsight} language={language} />
        ) : (
          <div className="space-y-6">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Brain className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{pageText.noInsightsYet}</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {pageText.noInsightsDesc}
                </p>
                <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {pageText.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {pageText.generateFirstReport}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Benefits Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {pageText.whyUseInsights}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    {pageText.benefit1}
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    {pageText.benefit2}
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    {pageText.benefit3}
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    {pageText.benefit4}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Insights;
