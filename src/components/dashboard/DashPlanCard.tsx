import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { CalendarCheck2, CheckCircle2, Circle, ChevronRight } from 'lucide-react';

interface TaskLike {
  id: number;
  title: string;
  completed: boolean;
}

// "My Study Plan" card from the reference design:
// today's tasks checklist + the date badge + link to the full planner.
export const DashPlanCard = ({ tasks }: { tasks: TaskLike[] }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';

  const today = new Date();
  const dayName = today.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { weekday: 'short' });
  const dateLabel = today.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });
  const shown = tasks.slice(0, 4);

  return (
    <div className="glass-card flex min-h-[220px] flex-col rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <CalendarCheck2 className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg font-extrabold text-navy">{ar ? 'خطة مذاكرتي' : 'My Study Plan'}</h3>
        </div>
        <button
          onClick={() => navigate('/study-hub?tab=plan')}
          className="flex items-center gap-1 text-xs font-extrabold text-primary transition-colors hover:text-primary/80"
        >
          {ar ? 'الخطة الكاملة' : 'View Plan'} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      <p className="mt-3 text-xs font-bold text-muted-foreground">{ar ? 'مهام النهاردة' : "Today's Tasks"}</p>
      <div className="mt-2 flex flex-1 flex-col justify-center gap-2.5">
        {shown.length === 0 && (
          <p className="text-sm font-bold text-muted-foreground/80">{ar ? 'مفيش مهام النهاردة — ضيف واحدة!' : 'No tasks today — add one!'}</p>
        )}
        {shown.map((t) => (
          <div key={t.id} className="flex items-center gap-2 text-sm font-bold text-navy">
            {t.completed ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-muted-foreground/60" />
            )}
            <span className={t.completed ? 'line-through opacity-60' : ''}>{t.title}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="rounded-2xl bg-primary/10 px-4 py-2 text-center">
          <p className="text-[11px] font-bold text-muted-foreground">{dayName}</p>
          <p className="font-display text-sm font-extrabold text-navy">{dateLabel}</p>
        </div>
        <span className="text-3xl">🗓️⏰</span>
      </div>
    </div>
  );
};
