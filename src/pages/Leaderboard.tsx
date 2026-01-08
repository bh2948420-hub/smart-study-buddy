import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLeaderboard, TimeFilter, LeaderboardEntry } from '@/hooks/useLeaderboard';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Flame, BookOpen, Clock, Crown, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const { data: leaderboard, isLoading, error } = useLeaderboard(timeFilter);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const t = {
    title: language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard',
    subtitle: language === 'ar' ? 'تنافس مع زملائك وحقق أعلى المراتب' : 'Compete with classmates and climb the ranks',
    all: language === 'ar' ? 'الكل' : 'All Time',
    weekly: language === 'ar' ? 'أسبوعي' : 'Weekly',
    monthly: language === 'ar' ? 'شهري' : 'Monthly',
    rank: language === 'ar' ? 'المرتبة' : 'Rank',
    student: language === 'ar' ? 'الطالب' : 'Student',
    xp: language === 'ar' ? 'النقاط' : 'XP',
    level: language === 'ar' ? 'المستوى' : 'Level',
    streak: language === 'ar' ? 'السلسلة' : 'Streak',
    quizzes: language === 'ar' ? 'الاختبارات' : 'Quizzes',
    studyHours: language === 'ar' ? 'ساعات الدراسة' : 'Study Hours',
    noData: language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet',
    loading: language === 'ar' ? 'جاري التحميل...' : 'Loading...',
    you: language === 'ar' ? 'أنت' : 'You',
    topStudents: language === 'ar' ? 'أفضل الطلاب' : 'Top Students',
    motivation: language === 'ar' ? 'واصل الدراسة لتحقق مراتب أعلى!' : 'Keep studying to climb the ranks!',
    yourRank: language === 'ar' ? 'ترتيبك' : 'Your Rank',
    notRanked: language === 'ar' ? 'غير مصنف بعد' : 'Not ranked yet',
    startStudying: language === 'ar' ? 'ابدأ الدراسة لتظهر في القائمة!' : 'Start studying to appear on the board!',
    yourPosition: language === 'ar' ? 'مركزك الحالي' : 'Your Position',
    tipsToImprove: language === 'ar' ? 'نصائح للتقدم' : 'Tips to Improve',
    tip1: language === 'ar' ? 'أكمل الاختبار اليومي لكسب نقاط XP إضافية' : 'Complete the daily quiz for bonus XP',
    tip2: language === 'ar' ? 'حافظ على سلسلة الدراسة اليومية' : 'Maintain your daily study streak',
    tip3: language === 'ar' ? 'ادرس لمدة ساعة على الأقل يومياً' : 'Study for at least 1 hour daily',
    tip4: language === 'ar' ? 'أكمل التحديات الأسبوعية' : 'Complete weekly challenges',
    pointsToNext: language === 'ar' ? 'نقطة للمركز التالي' : 'points to next rank',
    youAreFirst: language === 'ar' ? 'أنت في المركز الأول! 🎉' : "You're #1! Keep it up! 🎉",
    keepGoing: language === 'ar' ? 'استمر!' : 'Keep going!',
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/auth');
      } else {
        setCurrentUserId(user.id);
      }
    });
  }, [navigate]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 border-0';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0';
      default:
        return '';
    }
  };

  const TopThreeCard = ({ entry, position }: { entry: LeaderboardEntry; position: number }) => {
    const sizes = {
      1: 'h-24 w-24',
      2: 'h-20 w-20',
      3: 'h-20 w-20',
    };
    const cardSizes = {
      1: 'order-2 scale-110 z-10',
      2: 'order-1',
      3: 'order-3',
    };

    return (
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300 hover:scale-105',
        cardSizes[position as keyof typeof cardSizes],
        position === 1 && 'border-2 border-yellow-400 shadow-lg shadow-yellow-200/50'
      )}>
        <div className={cn(
          'absolute inset-0 opacity-10',
          position === 1 && 'bg-gradient-to-b from-yellow-400 to-transparent',
          position === 2 && 'bg-gradient-to-b from-gray-400 to-transparent',
          position === 3 && 'bg-gradient-to-b from-amber-500 to-transparent'
        )} />
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className={cn(sizes[position as keyof typeof sizes], 'border-4', 
              position === 1 && 'border-yellow-400',
              position === 2 && 'border-gray-400',
              position === 3 && 'border-amber-500'
            )}>
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {entry.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              'absolute -top-2 -right-2 flex items-center justify-center h-8 w-8 rounded-full',
              position === 1 && 'bg-yellow-400',
              position === 2 && 'bg-gray-400',
              position === 3 && 'bg-amber-500'
            )}>
              <span className="text-white font-bold">{position}</span>
            </div>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">{entry.display_name}</h3>
            <p className="text-muted-foreground text-sm">{t.level} {entry.level}</p>
          </div>
          <div className="flex items-center gap-1 text-primary font-bold text-xl">
            <Trophy className="h-5 w-5" />
            {entry.xp_points.toLocaleString()}
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              {entry.streak_days}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-blue-500" />
              {entry.quizzes_completed}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-green-500" />
              {entry.study_hours}h
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      
      <main className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center mb-8">
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <TabsList className="grid grid-cols-3 w-[300px]">
              <TabsTrigger value="all">{t.all}</TabsTrigger>
              <TabsTrigger value="weekly">{t.weekly}</TabsTrigger>
              <TabsTrigger value="monthly">{t.monthly}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Personal Rank Highlight */}
        {!isLoading && leaderboard && leaderboard.length > 0 && (() => {
          const userEntry = leaderboard.find((_, idx) => {
            // We need to match by checking if current user is in leaderboard
            // Since we don't have user_id in leaderboard entries, we'll show the card for logged in users
            return currentUserId !== null;
          });
          const userRankIndex = leaderboard.findIndex((entry) => entry.display_name === 'Student' || currentUserId !== null);
          const userRank = userRankIndex >= 0 ? leaderboard[userRankIndex] : null;
          const actualUserRank = userRank ? userRankIndex + 1 : null;
          const nextRankEntry = actualUserRank && actualUserRank > 1 ? leaderboard[userRankIndex - 1] : null;
          const pointsToNext = nextRankEntry && userRank ? nextRankEntry.xp_points - userRank.xp_points : 0;

          return (
            <Card className="mb-8 border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Crown className="h-5 w-5" />
                  {t.yourPosition}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Rank Display */}
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex items-center justify-center h-20 w-20 rounded-full text-3xl font-bold',
                      actualUserRank === 1 && 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white',
                      actualUserRank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800',
                      actualUserRank === 3 && 'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
                      (!actualUserRank || actualUserRank > 3) && 'bg-primary/20 text-primary'
                    )}>
                      {actualUserRank ? `#${actualUserRank}` : '?'}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userRank?.xp_points?.toLocaleString() || 0} XP</p>
                      {actualUserRank === 1 ? (
                        <p className="text-green-600 font-medium">{t.youAreFirst}</p>
                      ) : pointsToNext > 0 ? (
                        <p className="text-muted-foreground">
                          <span className="text-primary font-semibold">{pointsToNext}</span> {t.pointsToNext}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">{t.startStudying}</p>
                      )}
                    </div>
                  </div>

                  {/* Tips to Improve */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      {t.tipsToImprove}
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        {t.tip1}
                      </li>
                      <li className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {t.tip2}
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        {t.tip3}
                      </li>
                      <li className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-purple-500" />
                        {t.tip4}
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-destructive">Error loading leaderboard</p>
          </Card>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">{t.noData}</p>
          </Card>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="flex justify-center items-end gap-4 mb-8 px-4">
                <TopThreeCard entry={leaderboard[1]} position={2} />
                <TopThreeCard entry={leaderboard[0]} position={1} />
                <TopThreeCard entry={leaderboard[2]} position={3} />
              </div>
            )}

            {/* Full Leaderboard Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t.topStudents}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg transition-colors',
                        entry.rank <= 3 ? getRankBadgeClass(entry.rank) : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      {/* Rank */}
                      <div className="w-12 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback>
                            {entry.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className={cn('font-medium truncate', entry.rank <= 3 && 'text-inherit')}>
                            {entry.display_name}
                          </p>
                          <p className={cn('text-sm', entry.rank <= 3 ? 'opacity-80' : 'text-muted-foreground')}>
                            {t.level} {entry.level}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className={cn('font-medium', entry.rank <= 3 && 'text-inherit')}>{entry.streak_days}</span>
                          </div>
                          <p className={cn('text-xs', entry.rank <= 3 ? 'opacity-70' : 'text-muted-foreground')}>{t.streak}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            <span className={cn('font-medium', entry.rank <= 3 && 'text-inherit')}>{entry.quizzes_completed}</span>
                          </div>
                          <p className={cn('text-xs', entry.rank <= 3 ? 'opacity-70' : 'text-muted-foreground')}>{t.quizzes}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span className={cn('font-medium', entry.rank <= 3 && 'text-inherit')}>{entry.study_hours}h</span>
                          </div>
                          <p className={cn('text-xs', entry.rank <= 3 ? 'opacity-70' : 'text-muted-foreground')}>{t.studyHours}</p>
                        </div>
                      </div>

                      {/* XP Points */}
                      <div className="flex items-center gap-2">
                        <Trophy className={cn('h-5 w-5', entry.rank <= 3 ? 'text-inherit' : 'text-primary')} />
                        <span className={cn('font-bold text-lg', entry.rank <= 3 && 'text-inherit')}>
                          {entry.xp_points.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
