import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuizResult {
  id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
  quiz_title?: string;
  quiz_subject?: string;
}

export const RecentQuizResults = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentResults = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch recent quiz results with quiz info
        const { data, error } = await supabase
          .from('quiz_results')
          .select(`
            id,
            quiz_id,
            score,
            total_questions,
            percentage,
            completed_at
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        // Fetch quiz titles
        if (data && data.length > 0) {
          const quizIds = [...new Set(data.map(r => r.quiz_id))];
          const { data: quizzes } = await supabase
            .from('quizzes')
            .select('id, title, subject')
            .in('id', quizIds);

          const resultsWithTitles = data.map(result => ({
            ...result,
            quiz_title: quizzes?.find(q => q.id === result.quiz_id)?.title || 'Quiz',
            quiz_subject: quizzes?.find(q => q.id === result.quiz_id)?.subject || '',
          }));

          setResults(resultsWithTitles);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentResults();
  }, []);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500 bg-green-500/10';
    if (percentage >= 70) return 'text-blue-500 bg-blue-500/10';
    if (percentage >= 50) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return language === 'ar' ? 'منذ قليل' : 'Just now';
    } else if (diffHours < 24) {
      return language === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return language === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {language === 'ar' ? 'نتائج الاختبارات الأخيرة' : 'Recent Quiz Results'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/quizzes')}>
            {language === 'ar' ? 'عرض الكل' : 'View All'}
            <ChevronRight className="h-4 w-4 mr-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">
              {language === 'ar' ? 'لا توجد نتائج بعد' : 'No results yet'}
            </p>
            <p className="text-sm">
              {language === 'ar' ? 'أكمل اختباراً لرؤية نتائجك هنا' : 'Complete a quiz to see your results here'}
            </p>
          </div>
        ) : (
          results.map((result) => (
            <div
              key={result.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{result.quiz_title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {result.quiz_subject && (
                    <Badge variant="outline" className="text-xs">
                      {result.quiz_subject}
                    </Badge>
                  )}
                  <span>{formatDate(result.completed_at)}</span>
                </div>
              </div>
              <div className={cn('px-3 py-1 rounded-full font-bold text-sm', getScoreColor(result.percentage))}>
                {result.score}/{result.total_questions}
                <span className="text-xs ml-1">({Math.round(result.percentage)}%)</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
