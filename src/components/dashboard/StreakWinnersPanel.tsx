import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, Trophy, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const StreakWinnersPanel = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: leaderboard, isLoading } = useLeaderboard('all', 'streak');

  const t = {
    title: language === 'ar' ? '🔥 أبطال الالتزام' : '🔥 Streak Champions',
    days: language === 'ar' ? 'يوم' : 'days',
    viewAll: language === 'ar' ? 'عرض الكل' : 'View All',
    noData: language === 'ar' ? 'لا توجد بيانات' : 'No data yet',
  };

  const top5 = (leaderboard || []).slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (top5.length === 0) {
    return null;
  }

  const tierStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/10 to-gray-300/5 border-gray-400/20';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/10 to-orange-500/5 border-amber-600/20';
    return 'bg-muted/30 border-transparent';
  };

  return (
    <Card className="animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-5 w-5 text-orange-500" />
            {t.title}
          </CardTitle>
          <button
            onClick={() => navigate('/leaderboard')}
            className="text-xs text-primary hover:underline font-medium"
          >
            {t.viewAll} →
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {top5.map((entry, idx) => {
          const rank = idx + 1;
          const streakTier = entry.streak_days >= 100 ? 'legend' : entry.streak_days >= 30 ? 'pro' : entry.streak_days >= 7 ? 'rising' : 'none';

          return (
            <div
              key={idx}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:scale-[1.02]',
                tierStyle(rank)
              )}
            >
              {/* Rank */}
              <div className="w-6 text-center shrink-0">
                {rank === 1 ? (
                  <Crown className="h-4 w-4 text-yellow-500 mx-auto" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{entry.display_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.display_name}</p>
              </div>

              {/* Streak badge */}
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shrink-0',
                streakTier === 'legend' && 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse',
                streakTier === 'pro' && 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
                streakTier === 'rising' && 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
                streakTier === 'none' && 'bg-muted text-muted-foreground',
              )}>
                <Flame className="h-3 w-3" />
                {entry.streak_days} {t.days}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
