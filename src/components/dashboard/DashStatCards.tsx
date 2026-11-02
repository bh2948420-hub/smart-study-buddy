import { Target, Flame, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashStatCardsProps {
  weeklyGoalDone: number;
  streakDays: number;
  totalPoints: number;
}

// The three hero stat cards from the reference design:
// Weekly Goal (x/7), Study Streak (days), Total Points (XP).
export const DashStatCards = ({ weeklyGoalDone, streakDays, totalPoints }: DashStatCardsProps) => {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const cards = [
    {
      icon: Target,
      iconClass: 'bg-primary/15 text-primary',
      label: ar ? 'هدف الأسبوع' : 'Weekly Goal',
      value: `${weeklyGoalDone} / 7`,
      bar: Math.min(100, Math.round((weeklyGoalDone / 7) * 100)),
      barClass: 'bg-gradient-primary',
    },
    {
      icon: Flame,
      iconClass: 'bg-warning/15 text-warning',
      label: ar ? 'سلسلة المذاكرة' : 'Study Streak',
      value: `${streakDays} ${ar ? 'يوم 🔥' : 'Days 🔥'}`,
    },
    {
      icon: Star,
      iconClass: 'bg-warning/15 text-warning',
      label: ar ? 'مجموع النقاط' : 'Total Points',
      value: totalPoints.toLocaleString('en-US'),
      star: true,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconClass}`}>
              <c.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-muted-foreground">{c.label}</p>
              <p className="font-display text-2xl font-extrabold text-navy leading-tight">{c.value}</p>
            </div>
          </div>
          {typeof c.bar === 'number' && (
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full transition-all duration-700 ${c.barClass}`} style={{ width: `${c.bar}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
