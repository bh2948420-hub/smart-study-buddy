import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trophy, ChevronRight, Star } from 'lucide-react';
import { useLeaderboard, LeaderboardEntry } from '@/hooks/useLeaderboard';

// "Leaderboard" card from the reference design: the top 3 students of the week,
// with the signed-in student highlighted in purple.
export const DashLeaderboardCard = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const { data: entries, isLoading } = useLeaderboard('weekly', 'xp');
  const [myName, setMyName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      setMyName((data as any)?.display_name ?? null);
    })();
  }, []);

  const top = (entries || []).slice(0, 3);
  const medal = ['🥇', '🥈', '🥉'];

  return (
    <div className="glass-card flex min-h-[240px] flex-col rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-extrabold text-navy">{ar ? 'لوحة المتصدرين' : 'Leaderboard'}</h3>
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-warning" />
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-1 text-xs font-extrabold text-primary transition-colors hover:text-primary/80"
          >
            {ar ? 'الكل' : 'View All'} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col justify-center gap-2">
        {isLoading && <p className="text-sm font-bold text-muted-foreground">{ar ? 'جاري التحميل...' : 'Loading...'}</p>}
        {!isLoading && top.length === 0 && (
          <p className="text-sm font-bold text-muted-foreground">{ar ? 'اكتسب XP من الكويزات علشان تتصدري!' : 'Earn XP to climb the board!'}</p>
        )}
        {top.map((e: LeaderboardEntry, i: number) => (
          <div
            key={`${e.rank}-${e.display_name}`}
            className={`flex items-center justify-between gap-2 rounded-2xl px-3 py-2 ${e.rank === 1 ? 'bg-gradient-sidebar text-white shadow-glow' : 'bg-background/70'}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-lg">{medal[i]}</span>
              <span className={`truncate text-sm font-extrabold ${e.rank === 1 ? 'text-white' : 'text-navy'}`}>
                {e.display_name}
                {myName && e.display_name === myName ? (ar ? ' (أنتِ)' : ' (You)') : ''}
              </span>
            </div>
            <span className={`flex shrink-0 items-center gap-1 text-xs font-extrabold ${e.rank === 1 ? 'text-white' : 'text-warning'}`}>
              <Star className="h-3.5 w-3.5 fill-current" /> {e.xp_points.toLocaleString('en-US')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
