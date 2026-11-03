import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart3, ChevronRight, TrendingUp } from 'lucide-react';

// "My Reports" card from the reference design: a 7-day mini bar chart of study
// minutes, a "+X% this week" badge and a motivational footer.
export const DashReportsCard = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const [days, setDays] = useState<number[]>(Array(7).fill(0));
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const from = new Date();
      from.setDate(from.getDate() - 13);
      from.setHours(0, 0, 0, 0);
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('start_time, duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', from.toISOString());
      if (!active) return;
      const buckets: number[] = Array(14).fill(0);
      (sessions || []).forEach((s: any) => {
        const d = new Date(s.start_time);
        d.setHours(0, 0, 0, 0);
        const idx = Math.floor((d.getTime() - from.getTime()) / 86400000);
        if (idx >= 0 && idx < 14) buckets[idx] += Number(s.duration_minutes) || 0;
      });
      setDays(buckets.slice(7));
      const prev = buckets.slice(0, 7).reduce((a, b) => a + b, 0);
      const cur = buckets.slice(7).reduce((a, b) => a + b, 0);
      if (prev > 0) setDiff(Math.round(((cur - prev) / prev) * 100));
      else if (cur > 0) setDiff(100);
    })();
    return () => {
      active = false;
    };
  }, []);

  const max = Math.max(...days, 1);
  const labels = ar ? ['س', 'ج', 'خ', 'ر', 'ث', 'ن', 'ح'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIdx = (new Date().getDay() + 1) % 7; // days[] starts 7 days ago; aligns with en labels

  return (
    <div className="glass-card flex min-h-[240px] flex-col rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg font-extrabold text-navy">{ar ? 'تقاريري' : 'My Reports'}</h3>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1 text-xs font-extrabold text-primary transition-colors hover:text-primary/80"
        >
          {ar ? 'الكل' : 'View All'} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      <div className="mt-4 flex flex-1 items-end justify-between gap-2 px-1">
        {days.map((m, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-muted-foreground">{m > 0 ? m : ''}</span>
            <div
              className={`w-full rounded-t-lg transition-all duration-700 ${i === todayIdx ? 'bg-gradient-gold' : 'bg-gradient-primary'}`}
              style={{ height: `${Math.max(8, (m / max) * 72)}px` }}
            />
            <span className="text-[10px] font-bold text-muted-foreground">{labels[i]}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {diff !== null && (
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-extrabold text-success">
            <TrendingUp className="h-3.5 w-3.5" /> {diff >= 0 ? '+' : ''}{diff}% {ar ? 'الأسبوع ده' : 'This Week'}
          </span>
        )}
        <span className="ms-auto rounded-full bg-gradient-gold px-3 py-1 text-xs font-extrabold text-primary-foreground shadow">
          {ar ? 'تقدم رائع! 🏆' : 'Great progress! 🏆'}
        </span>
      </div>
    </div>
  );
};
