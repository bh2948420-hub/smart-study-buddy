import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLiveChallenge } from '@/hooks/useLiveChallenge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  Swords, Copy, Users, Clock, Trophy, Zap,
  Check, X, ArrowRight, Loader2, Crown, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

const Challenge = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const {
    room, questions, currentIndex, currentQuestion,
    myAnswers, opponentAnswers, loading, timeLeft,
    isHost, isFinished, myScore, opponentScore,
    myName, opponentName,
    createRoom, joinRoom, submitAnswer, nextQuestion, leaveRoom,
  } = useLiveChallenge();

  const [joinCode, setJoinCode] = useState('');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Load user's quizzes for room creation
  const loadQuizzes = async () => {
    setLoadingQuizzes(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('quizzes')
      .select('id, title, subject')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setQuizzes(data || []);
    setLoadingQuizzes(false);
  };

  // Trigger confetti on win
  useEffect(() => {
    if (isFinished && myScore > opponentScore) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [isFinished, myScore, opponentScore]);

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer) return; // Already answered
    setSelectedAnswer(answer);
    setShowResult(true);
    await submitAnswer(answer);
  };

  const handleNext = async () => {
    setSelectedAnswer(null);
    setShowResult(false);
    await nextQuestion();
  };

  const copyCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      toast.success(isAr ? 'تم نسخ الكود!' : 'Code copied!');
    }
  };

  // No room - show lobby
  if (!room) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Navbar />
        <main className="container py-8 max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Swords className="h-5 w-5 text-primary" />
              <span className="font-bold text-primary">
                {isAr ? 'تحدي مباشر' : 'Live Challenge'}
              </span>
            </div>
            <h1 className="text-3xl font-bold">
              {isAr ? 'تحدى أصدقاءك!' : 'Challenge Your Friends!'}
            </h1>
            <p className="text-muted-foreground">
              {isAr ? 'أنشئ غرفة أو انضم لتحدي كويز مباشر' : 'Create a room or join a live quiz battle'}
            </p>
          </div>

          {/* Create Room */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                {isAr ? 'إنشاء غرفة تحدي' : 'Create Challenge Room'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizzes.length === 0 ? (
                <Button onClick={loadQuizzes} disabled={loadingQuizzes} className="w-full">
                  {loadingQuizzes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isAr ? 'تحميل اختباراتي' : 'Load My Quizzes'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'اختر اختبار للتحدي:' : 'Choose a quiz for the battle:'}
                  </p>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {quizzes.map(q => (
                      <Button
                        key={q.id}
                        variant="outline"
                        className="justify-start gap-2"
                        onClick={() => createRoom(q.id)}
                        disabled={loading}
                      >
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="truncate">{q.title}</span>
                        {q.subject && <Badge variant="secondary" className="text-xs">{q.subject}</Badge>}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {isAr ? 'انضم لتحدي' : 'Join a Challenge'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder={isAr ? 'أدخل كود الغرفة...' : 'Enter room code...'}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                />
                <Button onClick={() => joinRoom(joinCode)} disabled={loading || joinCode.length < 4}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? 'انضم' : 'Join')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Waiting for opponent
  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Navbar />
        <main className="container py-8 max-w-lg">
          <Card className="text-center animate-fade-in">
            <CardContent className="py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {isAr ? 'في انتظار المنافس...' : 'Waiting for opponent...'}
                </h2>
                <p className="text-muted-foreground">
                  {isAr ? 'شارك الكود مع صاحبك' : 'Share this code with your friend'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold tracking-[0.3em] text-primary bg-primary/10 px-6 py-3 rounded-xl">
                  {room.room_code}
                </span>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={leaveRoom}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Finished
  if (isFinished) {
    const isWinner = myScore > opponentScore;
    const isTie = myScore === opponentScore;

    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Navbar />
        <main className="container py-8 max-w-lg">
          <Card className="text-center animate-scale-in overflow-hidden">
            {/* Winner banner */}
            <div className={cn(
              "py-8 px-4",
              isWinner ? "bg-gradient-to-r from-yellow-400 to-orange-400" :
              isTie ? "bg-gradient-to-r from-blue-400 to-cyan-400" :
              "bg-gradient-to-r from-gray-400 to-gray-500"
            )}>
              <Trophy className="h-16 w-16 text-white mx-auto mb-3" />
              <h2 className="text-3xl font-bold text-white">
                {isWinner ? (isAr ? '🎉 فزت!' : '🎉 You Won!') :
                 isTie ? (isAr ? '🤝 تعادل!' : '🤝 It\'s a Tie!') :
                 (isAr ? '😢 خسرت' : '😢 You Lost')}
              </h2>
            </div>
            <CardContent className="py-8 space-y-6">
              {/* Scores */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{myName || 'You'}</p>
                  <p className="text-4xl font-bold text-primary">{myScore}</p>
                </div>
                <span className="text-2xl font-bold text-muted-foreground">VS</span>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{opponentName || 'Opponent'}</p>
                  <p className="text-4xl font-bold text-destructive">{opponentScore}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAr ? `${questions.length} سؤال` : `${questions.length} questions`}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={leaveRoom}>
                  {isAr ? 'تحدي جديد' : 'New Challenge'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  {isAr ? 'لوحة التحكم' : 'Dashboard'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Active game
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const hasAnswered = selectedAnswer !== null;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      <main className="container py-8 max-w-2xl space-y-6">
        {/* Score bar */}
        <div className="flex items-center justify-between bg-card rounded-xl p-4 border animate-fade-in">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{myName || 'You'}</p>
            <p className="text-2xl font-bold text-primary">{myScore}</p>
          </div>
          <div className="text-center space-y-1">
            <Badge variant={timeLeft <= 5 ? 'destructive' : 'secondary'} className="text-lg px-3 py-1">
              <Clock className="h-4 w-4 mr-1" />
              {timeLeft}s
            </Badge>
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1}/{questions.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{opponentName || 'Opponent'}</p>
            <p className="text-2xl font-bold text-destructive">{opponentScore}</p>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Question */}
        {currentQuestion && (
          <Card className="animate-scale-in">
            <CardContent className="py-6 space-y-6">
              <h3 className="text-lg font-semibold text-center leading-relaxed">
                {currentQuestion.question_text}
              </h3>

              {/* Options */}
              <div className="grid gap-3">
                {(currentQuestion.options as string[])?.map((option: string, i: number) => {
                  const isMyAnswer = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.correct_answer;

                  return (
                    <Button
                      key={i}
                      variant="outline"
                      className={cn(
                        "w-full py-6 text-base justify-start gap-3 transition-all",
                        !hasAnswered && "hover:border-primary hover:bg-primary/5",
                        hasAnswered && isCorrect && "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20",
                        hasAnswered && isMyAnswer && !isCorrect && "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20",
                      )}
                      disabled={hasAnswered}
                      onClick={() => handleAnswer(option)}
                    >
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                      {hasAnswered && isCorrect && <Check className="h-5 w-5 ml-auto text-green-600" />}
                      {hasAnswered && isMyAnswer && !isCorrect && <X className="h-5 w-5 ml-auto text-red-600" />}
                    </Button>
                  );
                })}
              </div>

              {/* Explanation & Next */}
              {showResult && currentQuestion.explanation && (
                <div className="p-3 bg-muted rounded-lg text-sm animate-fade-in">
                  <p className="font-medium mb-1">{isAr ? 'التفسير:' : 'Explanation:'}</p>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}

              {hasAnswered && isHost && (
                <Button className="w-full gap-2" onClick={handleNext}>
                  {currentIndex + 1 >= questions.length
                    ? (isAr ? 'إنهاء التحدي' : 'Finish Challenge')
                    : (isAr ? 'السؤال التالي' : 'Next Question')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {hasAnswered && !isHost && (
                <p className="text-center text-sm text-muted-foreground animate-pulse">
                  {isAr ? 'في انتظار المستضيف للسؤال التالي...' : 'Waiting for host to continue...'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Opponent status */}
        {opponentAnswers[currentIndex] !== undefined && (
          <div className="text-center text-sm animate-fade-in">
            {opponentAnswers[currentIndex]
              ? <Badge className="bg-green-500">✓ {opponentName} {isAr ? 'جاوب صح' : 'answered correctly'}</Badge>
              : <Badge variant="destructive">✗ {opponentName} {isAr ? 'جاوب غلط' : 'answered wrong'}</Badge>
            }
          </div>
        )}
      </main>
    </div>
  );
};

export default Challenge;
