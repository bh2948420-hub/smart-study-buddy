import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDailyQuiz } from '@/hooks/useDailyQuiz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, CheckCircle2, XCircle, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUIZ_TIME_LIMIT = 120; // 2 minutes in seconds

export const DailyQuizWidget = () => {
  const { language } = useLanguage();
  const { questions, todayAttempt, loading, hasCompletedToday, submitDailyQuiz } = useDailyQuiz();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME_LIMIT);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [correctness, setCorrectness] = useState<Record<number, boolean>>({});
  const startTimeRef = useRef<number>(0);


  // Timer effect
  useEffect(() => {
    if (!isPlaying || showResults) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, showResults]);

  const startQuiz = () => {
    setIsPlaying(true);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(QUIZ_TIME_LIMIT);
    setShowResults(false);
    setScore(0);
    startTimeRef.current = Date.now();
  };

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: answer }));
    
    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 300);
    }
  };

  const handleSubmit = async () => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const questionIds = questions.map((q) => q.id);
    const answerArr = questions.map((_, idx) => answers[idx] ?? '');

    const result: any = await submitDailyQuiz(0, questions.length, timeSpent, questionIds, answerArr);

    const map: Record<number, boolean> = {};
    let correctCount = 0;
    (result?.details || []).forEach((d: any, i: number) => {
      map[i] = !!d.correct;
      if (d.correct) correctCount++;
    });
    setCorrectness(map);
    setScore(result?.score ?? correctCount);
    setShowResults(true);
    setIsPlaying(false);
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            {language === 'ar' ? 'الاختبار اليومي' : 'Daily Quiz'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Already completed today
  if (hasCompletedToday && todayAttempt) {
    const percentage = (todayAttempt.score / todayAttempt.total_questions) * 100;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            {language === 'ar' ? 'الاختبار اليومي' : 'Daily Quiz'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">
              {language === 'ar' ? 'أحسنت! أكملت اختبار اليوم' : 'Great job! You completed today\'s quiz'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? `نتيجتك: ${todayAttempt.score}/${todayAttempt.total_questions}`
                : `Your score: ${todayAttempt.score}/${todayAttempt.total_questions}`}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              +{todayAttempt.xp_earned} XP
            </Badge>
            <Badge variant="outline">
              {percentage >= 80 ? '🌟' : percentage >= 60 ? '👍' : '💪'} 
              {Math.round(percentage)}%
            </Badge>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {language === 'ar' 
              ? 'عد غداً لاختبار جديد!'
              : 'Come back tomorrow for a new quiz!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // No questions available
  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            {language === 'ar' ? 'الاختبار اليومي' : 'Daily Quiz'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground mb-4">
            {language === 'ar' 
              ? 'لا توجد أسئلة متاحة. ارفع بعض المواد وأنشئ اختبارات أولاً!'
              : 'No questions available. Upload materials and create quizzes first!'}
          </p>
          <Button variant="outline" asChild>
            <a href="/materials">
              {language === 'ar' ? 'رفع المواد' : 'Upload Materials'}
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show results
  if (showResults) {
    const percentage = (score / questions.length) * 100;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            {language === 'ar' ? 'نتيجة الاختبار' : 'Quiz Results'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className={cn(
              'text-5xl font-bold mb-2',
              percentage >= 80 ? 'text-green-500' : 
              percentage >= 60 ? 'text-yellow-500' : 'text-red-500'
            )}>
              {score}/{questions.length}
            </div>
            <p className="text-muted-foreground">
              {percentage >= 80 
                ? (language === 'ar' ? 'ممتاز! 🌟' : 'Excellent! 🌟')
                : percentage >= 60 
                  ? (language === 'ar' ? 'جيد جداً! 👍' : 'Great job! 👍')
                  : (language === 'ar' ? 'استمر في المحاولة! 💪' : 'Keep practicing! 💪')}
            </p>
          </div>

          {/* Review answers */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {questions.map((q, idx) => {
              const isCorrect = correctness[idx] ?? false;
              return (
                <div 
                  key={idx}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded text-sm',
                    isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <span className="truncate">{q.question_text}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz not started
  if (!isPlaying) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            {language === 'ar' ? 'الاختبار اليومي' : 'Daily Quiz'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-semibold mb-1">
              {language === 'ar' ? '5 أسئلة سريعة' : '5 Quick Questions'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'ar' 
                ? 'لديك دقيقتان لإكمال الاختبار واكسب XP إضافي!'
                : '2 minutes to complete and earn bonus XP!'}
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                2:00
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                10-50 XP
              </Badge>
            </div>

            <Button onClick={startQuiz} className="gap-2">
              <Zap className="h-4 w-4" />
              {language === 'ar' ? 'ابدأ الآن' : 'Start Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Playing quiz
  const currentQuestion = questions[currentIndex];
  const options = currentQuestion?.options || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            {language === 'ar' ? 'الاختبار اليومي' : 'Daily Quiz'}
          </CardTitle>
          <Badge 
            variant={timeLeft < 30 ? 'destructive' : 'secondary'}
            className="gap-1"
          >
            <Clock className="h-3 w-3" />
            {formatTime(timeLeft)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-2">
          <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>

        {/* Question */}
        <div className="py-2">
          <p className="font-medium mb-4">{currentQuestion?.question_text}</p>
          
          <div className="space-y-2">
            {options.map((option: string, idx: number) => (
              <Button
                key={idx}
                variant={answers[currentIndex] === option ? 'default' : 'outline'}
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleAnswer(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Submit button on last question */}
        {currentIndex === questions.length - 1 && answers[currentIndex] && (
          <Button onClick={handleSubmit} className="w-full gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {language === 'ar' ? 'إنهاء الاختبار' : 'Submit Quiz'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
