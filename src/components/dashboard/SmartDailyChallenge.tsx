import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { celebrationService } from '@/services/celebrationService';

interface DailyGoal {
  subject: string | null;
  minutes: number;
  questions: number;
  xp: number;
}

const storageKey = (userId: string) => `smartedu-daily-challenge-${userId}-${new Date().toISOString().split('T')[0]}`;

export const SmartDailyChallenge = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<DailyGoal | null>(null);
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        setUserId(user.id);
        setClaimed(localStorage.getItem(storageKey(user.id)) === 'claimed');

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [quizRes, sessionsRes] = await Promise.all([
          supabase
            .from('quiz_results')
            .select('percentage, quiz_id, quizzes(subject)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('study_sessions')
            .select('duration_minutes')
            .eq('user_id', user.id)
            .gte('start_time', startOfDay.toISOString()),
        ]);

        if (cancelled) return;

        // find weakest subject by average percentage
        const bySubject = new Map<string, { total: number; count: number }>();
        (quizRes.data || []).forEach((r: any) => {
          const subject = r.quizzes?.subject;
          if (!subject) return;
          const entry = bySubject.get(subject) || { total: 0, count: 0 };
          entry.total += Number(r.percentage) || 0;
          entry.count += 1;
          bySubject.set(subject, entry);
        });

        let weakest: string | null = null;
        let weakestAvg = 101;
        bySubject.forEach((v, k) => {
          const avg = v.total / v.count;
          if (avg < weakestAvg) {
            weakestAvg = avg;
            weakest = k;
          }
        });

        const minutes = weakest ? (weakestAvg < 50 ? 25 : weakestAvg < 75 ? 20 : 15) : 15;
        const questions = weakest ? (weakestAvg < 50 ? 5 : 3) : 3;

        setGoal({
          subject: weakest,
          minutes,
          questions,
          xp: 30 + questions * 5,
        });

        setStudyMinutes(
          (sessionsRes.data || []).reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0)
        );
      } catch (err) {
        console.error('Daily challenge error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const progress = useMemo(() => {
    if (!goal) return 0;
    return Math.min(100, Math.round((studyMinutes / goal.minutes) * 100));
  }, [goal, studyMinutes]);

  const completed = progress >= 100;

  const handleClaim = async () => {
    if (!goal || !userId || claimed) return;
    setClaiming(true);
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('xp_points')
        .eq('user_id', userId)
        .maybeSingle();

      await supabase
        .from('user_profiles')
        .update({ xp_points: (profile?.xp_points || 0) + goal.xp, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      localStorage.setItem(storageKey(userId), 'claimed');
      setClaimed(true);
      celebrationService.celebrate({ type: 'challenge_complete' });
      toast.success(isAr ? `+${goal.xp} XP! تحدي اليوم اتحقق 🎉` : `+${goal.xp} XP! Daily challenge complete 🎉`);
    } catch (err) {
      console.error('Claim error:', err);
      toast.error(isAr ? 'حصلت مشكلة، جرب تاني' : 'Something went wrong, try again');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!goal) return null;

  return (
    <Card className="animate-fade-in border-primary/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {isAr ? '🎯 تحدي اليوم الذكي' : '🎯 Smart Daily Challenge'}
        </CardTitle>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          +{goal.xp} XP
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {goal.subject
            ? (isAr
                ? `ذاكر ${goal.minutes} دقيقة في مادة "${goal.subject}" (أضعف مادة عندك) وحل ${goal.questions} أسئلة عليها.`
                : `Study ${goal.minutes} minutes of "${goal.subject}" (your weakest subject) and answer ${goal.questions} questions.`)
            : (isAr
                ? `ابدأ بـ ${goal.minutes} دقيقة تركيز النهارده وحل ${goal.questions} أسئلة سريعة.`
                : `Start with ${goal.minutes} focus minutes today and answer ${goal.questions} quick questions.`)}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{isAr ? 'تقدم اليوم' : "Today's progress"}</span>
            <span>{studyMinutes} / {goal.minutes} {isAr ? 'دقيقة' : 'min'}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/focus')}>
            {isAr ? 'ابدأ التركيز' : 'Start focus'}
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/quizzes')}>
            {isAr ? 'حل أسئلة' : 'Solve questions'}
          </Button>
          {completed && (
            <Button size="sm" className="gap-2" onClick={handleClaim} disabled={claimed || claiming}>
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {claimed
                ? (isAr ? 'تم الاستلام' : 'Claimed')
                : (isAr ? `استلم ${goal.xp} XP` : `Claim ${goal.xp} XP`)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
