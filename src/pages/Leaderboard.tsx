import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLeaderboard, TimeFilter, SortBy, LeaderboardEntry } from '@/hooks/useLeaderboard';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Award, Flame, BookOpen, Clock, Crown, TrendingUp, Users, Target, Zap, Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RankCelebration } from '@/components/celebrations/RankCelebration';
import { StreakProgressChart } from '@/components/leaderboard/StreakProgressChart';

export default function Leaderboard() {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('weekly');
  const [sortBy, setSortBy] = useState<SortBy>('xp');
  const { data: leaderboard, isLoading, error } = useLeaderboard(timeFilter, sortBy);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

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
    topStudents: language === 'ar' ? 'جميع الطلاب' : 'All Students',
    yourRank: language === 'ar' ? 'ترتيبك' : 'Your Rank',
    notRanked: language === 'ar' ? 'غير مصنف بعد' : 'Not ranked yet',
    startStudying: language === 'ar' ? 'ابدأ الدراسة لتظهر في القائمة!' : 'Start studying to appear on the board!',
    yourPosition: language === 'ar' ? 'مركزك الحالي' : 'Your Position',
    tipsToImprove: language === 'ar' ? 'كيف ترفع ترتيبك؟' : 'How to Climb Higher?',
    tip1: language === 'ar' ? 'أكمل الاختبار اليومي (+25 XP)' : 'Complete daily quiz (+25 XP)',
    tip2: language === 'ar' ? 'حافظ على سلسلة الدراسة (+10 XP يومياً)' : 'Maintain study streak (+10 XP daily)',
    tip3: language === 'ar' ? 'أكمل جلسات التركيز (+15 XP لكل 25 دقيقة)' : 'Complete focus sessions (+15 XP per 25 min)',
    tip4: language === 'ar' ? 'أكمل التحديات الأسبوعية (+50 XP)' : 'Complete weekly challenges (+50 XP)',
    pointsToNext: language === 'ar' ? 'نقطة للمركز التالي' : 'points to next rank',
    youAreFirst: language === 'ar' ? 'أنت في المركز الأول! 🎉' : "You're #1! Keep it up! 🎉",
    howRanksWork: language === 'ar' ? 'كيف تعمل التصنيفات؟' : 'How Rankings Work',
    rankExplanation: language === 'ar' 
      ? 'يتم حساب ترتيبك بناءً على نقاط XP التي تكسبها من إكمال المهام والاختبارات وجلسات التركيز والتحديات الأسبوعية.'
      : 'Your rank is calculated based on XP points earned from completing tasks, quizzes, focus sessions, and weekly challenges.',
    yourStats: language === 'ar' ? 'إحصائياتك' : 'Your Stats',
    progressToNextLevel: language === 'ar' ? 'التقدم للمستوى التالي' : 'Progress to Next Level',
    days: language === 'ar' ? 'يوم' : 'days',
    hours: language === 'ar' ? 'ساعة' : 'h',
    sortBy: language === 'ar' ? 'ترتيب حسب' : 'Sort by',
    sortByXP: language === 'ar' ? 'النقاط' : 'XP',
    sortByStreak: language === 'ar' ? 'السلسلة' : 'Streak',
    completed: language === 'ar' ? 'مكتمل' : 'completed',
    streakChampions: language === 'ar' ? 'أبطال الالتزام' : 'Streak Champions',
    streakTier100: language === 'ar' ? 'أسطورة' : 'Legend',
    streakTier30: language === 'ar' ? 'محترف' : 'Pro',
    streakTier7: language === 'ar' ? 'مبتدئ' : 'Rising',
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(user.id);
      
      // Fetch user profile to get their display name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
      }
    };
    fetchUserData();
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

  // Find current user in leaderboard
  const findUserInLeaderboard = () => {
    if (!userProfile || !leaderboard) return null;
    const userEntry = leaderboard.find(entry => 
      entry.display_name === userProfile.display_name
    );
    return userEntry || null;
  };

  const userEntry = findUserInLeaderboard();
  const userRankIndex = userEntry ? leaderboard?.findIndex(e => e.display_name === userProfile?.display_name) ?? -1 : -1;
  const actualUserRank = userRankIndex >= 0 ? userRankIndex + 1 : null;
  const nextRankEntry = actualUserRank && actualUserRank > 1 && leaderboard ? leaderboard[userRankIndex - 1] : null;
  const pointsToNext = nextRankEntry && userEntry ? nextRankEntry.xp_points - userEntry.xp_points : 0;

  // Calculate XP progress to next level
  const xpForLevel = (level: number) => level * 100;
  const currentXP = userEntry?.xp_points || userProfile?.xp_points || 0;
  const currentLevel = userEntry?.level || userProfile?.level || 1;
  const xpForCurrentLevel = xpForLevel(currentLevel);
  const xpProgress = Math.min((currentXP % xpForCurrentLevel) / xpForCurrentLevel * 100, 100);

  // Streak badge helper
  const getStreakBadges = (streakDays: number) => {
    const badges: { icon: string; label: string; color: string; animate?: boolean }[] = [];
    if (streakDays >= 100) {
      badges.push({ icon: '🔥', label: '100', color: 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]', animate: true });
    } else if (streakDays >= 30) {
      badges.push({ icon: '⚡', label: '30', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' });
    } else if (streakDays >= 7) {
      badges.push({ icon: '✨', label: '7', color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' });
    }
    return badges;
  };

  const StreakBadgeDisplay = ({ streakDays }: { streakDays: number }) => {
    const badges = getStreakBadges(streakDays);
    if (badges.length === 0) return null;
    
    return (
      <div className="flex gap-1">
        {badges.map((badge, idx) => (
          <span
            key={idx}
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold',
              badge.color,
              badge.animate && 'animate-pulse'
            )}
            title={`${badge.label} ${language === 'ar' ? 'يوم سلسلة' : 'day streak'}`}
          >
            {badge.icon}{badge.label}
          </span>
        ))}
      </div>
    );
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

    const isCurrentUser = userProfile?.display_name === entry.display_name;

    return (
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300 hover:scale-105',
        cardSizes[position as keyof typeof cardSizes],
        position === 1 && 'border-2 border-yellow-400 shadow-lg shadow-yellow-200/50',
        isCurrentUser && 'ring-2 ring-primary'
      )}>
        {isCurrentUser && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
            {t.you}
          </Badge>
        )}
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
            <div className="flex items-center justify-center gap-2">
              <h3 className="font-semibold text-lg">{entry.display_name}</h3>
              <StreakBadgeDisplay streakDays={entry.streak_days} />
            </div>
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
              {entry.study_hours}{t.hours}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      <RankCelebration />
      <main className="container py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Time Filter */}
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <TabsList className="grid grid-cols-3 w-[300px]">
              <TabsTrigger value="weekly">{t.weekly}</TabsTrigger>
              <TabsTrigger value="monthly">{t.monthly}</TabsTrigger>
              <TabsTrigger value="all">{t.all}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sort Filter */}
          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="xp" className="gap-1">
                <Trophy className="h-4 w-4" />
                {t.sortByXP}
              </TabsTrigger>
              <TabsTrigger value="streak" className="gap-1">
                <Flame className="h-4 w-4" />
                {t.sortByStreak}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Personal Stats Card - Only show if user has data */}
        {!isLoading && userProfile && (
          <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Crown className="h-5 w-5" />
                {t.yourPosition}
              </CardTitle>
              <CardDescription>
                {actualUserRank === 1 ? t.youAreFirst : t.rankExplanation}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
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
                    <p className="text-2xl font-bold">{(userEntry?.xp_points || userProfile?.xp_points || 0).toLocaleString()} XP</p>
                    {actualUserRank && actualUserRank > 1 && pointsToNext > 0 && (
                      <p className="text-muted-foreground text-sm">
                        <span className="text-primary font-semibold">{pointsToNext}</span> {t.pointsToNext}
                      </p>
                    )}
                    {!actualUserRank && (
                      <p className="text-muted-foreground text-sm">{t.startStudying}</p>
                    )}
                  </div>
                </div>

                {/* Your Stats */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {t.yourStats}
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                      <p className="font-bold">{userEntry?.streak_days || userProfile?.streak_days || 0}</p>
                      <p className="text-xs text-muted-foreground">{t.days}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <BookOpen className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                      <p className="font-bold">{userEntry?.quizzes_completed || 0}</p>
                      <p className="text-xs text-muted-foreground">{t.quizzes}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Clock className="h-5 w-5 mx-auto text-green-500 mb-1" />
                      <p className="font-bold">{userEntry?.study_hours || 0}{t.hours}</p>
                      <p className="text-xs text-muted-foreground">{t.studyHours}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{t.progressToNextLevel}</span>
                      <span>{t.level} {currentLevel + 1}</span>
                    </div>
                    <Progress value={xpProgress} className="h-2" />
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
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>{t.tip1}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>{t.tip2}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{t.tip3}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
                      <span>{t.tip4}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How Rankings Work - Educational */}
        {!isLoading && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 shrink-0">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t.howRanksWork}</h4>
                  <p className="text-sm text-muted-foreground">{t.rankExplanation}</p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>{language === 'ar' ? 'اختبار: +25 XP' : 'Quiz: +25 XP'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{language === 'ar' ? 'مهمة: +10 XP' : 'Task: +10 XP'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span>{language === 'ar' ? 'تركيز 25د: +15 XP' : 'Focus 25m: +15 XP'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>{language === 'ar' ? 'تحدي: +50 XP' : 'Challenge: +50 XP'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Streak Progress Chart */}
        {!isLoading && <StreakProgressChart />}

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
            <p className="text-sm text-muted-foreground mt-2">{t.startStudying}</p>
          </Card>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="flex justify-center items-end gap-4 px-4">
                <TopThreeCard entry={leaderboard[1]} position={2} />
                <TopThreeCard entry={leaderboard[0]} position={1} />
                <TopThreeCard entry={leaderboard[2]} position={3} />
              </div>
            )}

            {/* Streak-focused view when sorting by streak */}
            {sortBy === 'streak' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    {t.streakChampions}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.map((entry) => {
                      const isCurrentUser = userProfile?.display_name === entry.display_name;
                      const streakTier = entry.streak_days >= 100 ? 'legend' : entry.streak_days >= 30 ? 'pro' : entry.streak_days >= 7 ? 'rising' : 'none';
                      const tierLabel = streakTier === 'legend' ? t.streakTier100 : streakTier === 'pro' ? t.streakTier30 : streakTier === 'rising' ? t.streakTier7 : '';
                      const tierColors = {
                        legend: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/10 to-orange-500/5',
                        pro: 'border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-500/10 to-pink-500/5',
                        rising: 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/10 to-cyan-500/5',
                        none: 'border-l-4 border-l-muted bg-muted/30',
                      };

                      return (
                        <div
                          key={entry.rank}
                          className={cn(
                            'group rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]',
                            tierColors[streakTier],
                            isCurrentUser && 'ring-2 ring-primary'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className="w-10 text-center">
                              <span className="text-lg font-bold text-muted-foreground">#{entry.rank}</span>
                            </div>

                            {/* Avatar */}
                            <Avatar className="h-11 w-11 transition-transform duration-300 group-hover:scale-110">
                              <AvatarImage src={entry.avatar_url || undefined} />
                              <AvatarFallback>{entry.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            {/* Name + tier badge */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate">{entry.display_name}</p>
                                {isCurrentUser && (
                                  <Badge variant="secondary" className="text-xs">{t.you}</Badge>
                                )}
                                {tierLabel && (
                                  <span className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                                    streakTier === 'legend' && 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse',
                                    streakTier === 'pro' && 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
                                    streakTier === 'rising' && 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
                                  )}>
                                    {streakTier === 'legend' ? '🔥' : streakTier === 'pro' ? '⚡' : '✨'} {tierLabel}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{t.level} {entry.level}</p>
                            </div>

                            {/* Streak count - bold and prominent */}
                            <div className={cn(
                              'flex flex-col items-center justify-center min-w-[80px] py-2 px-3 rounded-xl',
                              streakTier === 'legend' && 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.5)]',
                              streakTier === 'pro' && 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
                              streakTier === 'rising' && 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white',
                              streakTier === 'none' && 'bg-muted text-muted-foreground',
                            )}>
                              <Flame className={cn('h-5 w-5 mb-0.5', streakTier === 'none' && 'text-muted-foreground')} />
                              <span className="text-xl font-extrabold leading-none">{entry.streak_days}</span>
                              <span className="text-[10px] opacity-80">{t.days}</span>
                            </div>

                            {/* XP secondary */}
                            <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                              <Trophy className="h-4 w-4" />
                              <span className="text-sm font-medium">{entry.xp_points.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Standard XP leaderboard table */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t.topStudents}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.map((entry) => {
                      const isCurrentUser = userProfile?.display_name === entry.display_name;
                      const xpPerHour = entry.study_hours > 0 ? Math.round(entry.xp_points / entry.study_hours) : 0;
                      const quizAvg = entry.quizzes_completed > 0 ? Math.round(entry.xp_points / entry.quizzes_completed) : 0;
                      
                      return (
                        <div
                          key={entry.rank}
                          className={cn(
                            'group relative rounded-lg transition-all duration-300',
                            entry.rank <= 3 ? getRankBadgeClass(entry.rank) : 'bg-muted/50 hover:bg-muted',
                            isCurrentUser && entry.rank > 3 && 'ring-2 ring-primary bg-primary/5',
                            'hover:shadow-lg hover:scale-[1.01]'
                          )}
                        >
                          <div className="flex items-center gap-4 p-4">
                            <div className="w-12 flex justify-center">
                              {getRankIcon(entry.rank)}
                            </div>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 transition-transform duration-300 group-hover:scale-110">
                                <AvatarImage src={entry.avatar_url || undefined} />
                                <AvatarFallback>{entry.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={cn('font-medium truncate', entry.rank <= 3 && 'text-inherit')}>{entry.display_name}</p>
                                  {isCurrentUser && (
                                    <Badge variant="secondary" className="text-xs">{t.you}</Badge>
                                  )}
                                  <StreakBadgeDisplay streakDays={entry.streak_days} />
                                </div>
                                <p className={cn('text-sm', entry.rank <= 3 ? 'opacity-80' : 'text-muted-foreground')}>{t.level} {entry.level}</p>
                              </div>
                            </div>
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
                                  <span className={cn('font-medium', entry.rank <= 3 && 'text-inherit')}>{entry.study_hours}{t.hours}</span>
                                </div>
                                <p className={cn('text-xs', entry.rank <= 3 ? 'opacity-70' : 'text-muted-foreground')}>{t.studyHours}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className={cn('h-5 w-5', entry.rank <= 3 ? 'text-inherit' : 'text-primary')} />
                              <span className={cn('font-bold text-lg', entry.rank <= 3 && 'text-inherit')}>{entry.xp_points.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className={cn(
                            'overflow-hidden transition-all duration-300 max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100',
                            entry.rank <= 3 ? 'border-t border-white/20' : 'border-t border-border'
                          )}>
                            <div className="px-4 py-3 flex items-center justify-center gap-8 text-sm">
                              <div className="flex items-center gap-2">
                                <Zap className={cn('h-4 w-4', entry.rank <= 3 ? 'text-inherit opacity-80' : 'text-yellow-500')} />
                                <span className={cn(entry.rank <= 3 ? 'text-inherit opacity-90' : 'text-muted-foreground')}>
                                  {language === 'ar' ? 'معدل XP/ساعة:' : 'XP/hour:'}{' '}
                                  <span className={cn('font-semibold', entry.rank <= 3 ? 'text-inherit' : 'text-foreground')}>{xpPerHour}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Target className={cn('h-4 w-4', entry.rank <= 3 ? 'text-inherit opacity-80' : 'text-purple-500')} />
                                <span className={cn(entry.rank <= 3 ? 'text-inherit opacity-90' : 'text-muted-foreground')}>
                                  {language === 'ar' ? 'معدل XP/اختبار:' : 'XP/quiz:'}{' '}
                                  <span className={cn('font-semibold', entry.rank <= 3 ? 'text-inherit' : 'text-foreground')}>{quizAvg}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className={cn('h-4 w-4', entry.rank <= 3 ? 'text-inherit opacity-80' : 'text-green-500')} />
                                <span className={cn(entry.rank <= 3 ? 'text-inherit opacity-90' : 'text-muted-foreground')}>
                                  {language === 'ar' ? 'الكفاءة:' : 'Efficiency:'}{' '}
                                  <span className={cn('font-semibold', entry.rank <= 3 ? 'text-inherit' : 'text-foreground')}>
                                    {entry.study_hours > 0 ? (entry.quizzes_completed / entry.study_hours).toFixed(1) : '0'} {language === 'ar' ? 'اختبار/ساعة' : 'quiz/h'}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
