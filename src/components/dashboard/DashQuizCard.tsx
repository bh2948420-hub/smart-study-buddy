import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// "Quizzes & Practice" card from the reference design: a colored progress ring
// showing the user's most recent quiz score and a button to start a new quiz.
export const DashQuizCard = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data } = await supabase
        .from('quiz_results')
        .select('score, total_questions')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (active && data && data.length > 0) {
        const r = data[0] as any;
        const total = Number(r.total_questions) || 0;
        setLastScore(total > 0 ? Math.round((Number(r.score) / total) * 100) : Number(r.score) || 0);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const pct = lastScore ?? 0;
  const size = 84;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  const verdict =
    lastScore === null
      ? ar ? 'ابدأ أول كويز ليك!' : 'Take your first quiz!'
      : pct >= 85
        ? ar ? 'أداء ممتاز!' : 'Excellent!'
        : pct >= 60
          ? ar ? 'أداء جيد!' : 'Good job!'
          : ar ? 'محتاج مراجعة' : 'Needs review';

  return (
    <div className="glass-card flex min-h-[240px] flex-col rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <h3 className="font-display text-lg font-extrabold text-navy">{ar ? 'الاختبارات والتدريب' : 'Quizzes & Practice'}</h3>
      </div>

      <div className="flex flex-1 items-center justify-center gap-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              className="stroke-success transition-all duration-700"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-display text-lg font-extrabold text-navy">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : `${pct}%`}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground">{ar ? 'آخر اختبار ليك' : 'Your Last Quiz'}</p>
          <p className="font-display text-lg font-extrabold text-navy">{verdict}</p>
        </div>
      </div>

      <Button onClick={() => navigate('/quizzes')} className="mx-auto rounded-full bg-gradient-primary px-6 font-extrabold text-primary-foreground shadow-glow">
        ✨ {ar ? 'ابدأ كويز جديد' : 'Take New Quiz'}
      </Button>
    </div>
  );
};
