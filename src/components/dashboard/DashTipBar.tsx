import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lightbulb, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TIPS = {
  ar: [
    'خذ استراحة قصيرة كل 25 دقيقة ذاكرتها!',
    'راجع درسك قبل النوم علشان تثبت المعلومة.',
    'اشرب مياه كتير وقت المذاكرة بيتحسن التركيز.',
    'ابدأ بالمادة الأصعب لما طاقتك في أعلى مستوى.',
    'لخّص الدرس بكلامك أنتِ — دي أقوى طريقة للحفظ.',
  ],
  en: [
    'Take short breaks every 25 minutes of studying!',
    'Review your lesson before bed to lock it in.',
    'Drink water while studying — focus loves it.',
    'Start with the hardest subject while your energy is high.',
    'Summarize the lesson in your own words — the strongest way to memorize.',
  ],
};

// Bottom bar from the reference design: a rotating study tip + "Dream Bigger" button.
export const DashTipBar = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const tips = ar ? TIPS.ar : TIPS.en;
  const [i, setI] = useState(0);

  useEffect(() => {
    const id: ReturnType<typeof setInterval> = setInterval(() => setI((p) => (p + 1) % tips.length), 7000);
    return () => clearInterval(id);
  }, [tips.length]);

  return (
    <div className="glass-card mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground shadow">
          <Lightbulb className="h-5 w-5" />
        </div>
        <p key={i} className="animate-fade-in truncate text-sm font-bold text-navy">
          <span className="text-primary">{ar ? 'نصيحة المذاكرة:' : 'Study Tip:'}</span> {tips[i]}
        </p>
      </div>
      <Button onClick={() => navigate('/insights')} className="rounded-full bg-gradient-primary px-5 font-extrabold text-primary-foreground shadow-glow">
        <Rocket className="h-4 w-4" /> {ar ? 'احلمي أكبر ✦' : 'Dream Bigger ✦'}
      </Button>
    </div>
  );
};
