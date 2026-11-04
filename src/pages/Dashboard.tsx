import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useStats } from '@/hooks/useStats';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { useMaterials } from '@/hooks/useMaterials';
import { useSmartQuest } from '@/hooks/useSmartQuest';
import { useDataSync } from '@/hooks/useDataSync';
import { useStreakRecovery } from '@/hooks/useStreakRecovery';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { StreakRecoveryDialog } from '@/components/streak/StreakRecoveryDialog';
import { RankCelebration } from '@/components/celebrations/RankCelebration';
import { ScheduleReuploadButton } from '@/components/dashboard/ScheduleReuploadButton';
import { DashSidebar } from '@/components/dashboard/DashSidebar';
import { DashHeader } from '@/components/dashboard/DashHeader';
import { DashStatCards } from '@/components/dashboard/DashStatCards';
import { DashAssistantCard } from '@/components/dashboard/DashAssistantCard';
import { DashPlanCard } from '@/components/dashboard/DashPlanCard';
import { DashQuestCard } from '@/components/dashboard/DashQuestCard';
import { DashMaterialsCard, MaterialCounts } from '@/components/dashboard/DashMaterialsCard';
import { DashQuizCard } from '@/components/dashboard/DashQuizCard';
import { DashReportsCard } from '@/components/dashboard/DashReportsCard';
import { DashLeaderboardCard } from '@/components/dashboard/DashLeaderboardCard';
import { DashTipBar } from '@/components/dashboard/DashTipBar';
import { toast } from 'sonner';

const Dashboard = () => {
  const { dir, language } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks();
  const { stats } = useStats();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const { materials } = useMaterials();
  const { quests: sqQuests } = useSmartQuest();
  const { syncTaskComplete } = useDataSync();
  const {
    showRecoveryDialog,
    previousStreak,
    currentXP,
    recoverStreak,
    declineRecovery,
    closeDialog,
  } = useStreakRecovery();

  // Enhanced toggleTask with XP sync
  const handleToggleTask = async (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      await toggleTask(taskId);
      await syncTaskComplete(taskId);
      toast.success(language === 'ar' ? '+10 XP!' : '+10 XP!');
    } else {
      await toggleTask(taskId);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        // Check onboarding status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile && !(profile as any).onboarding_completed) {
          setShowOnboarding(true);
        }
        setOnboardingChecked(true);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Tasks due today — feed the "My Study Plan" card
  const todayTasks = tasks.filter((task) => isSameDay(new Date(task.due_date), new Date()));

  // Weekly goal: distinct days with at least one completed task this week (Sat → Fri)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 1) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const activeDays = new Set(
    tasks
      .filter((t) => t.completed && new Date(t.due_date) >= weekStart)
      .map((t) => new Date(t.due_date).toDateString())
  );
  const weeklyGoalDone = Math.min(7, activeDays.size);

  // Smart Quest treasure-map progress for the current week
  const sqDone = sqQuests.filter((q) => q.status === 'done').length;
  const questPercent = sqQuests.length > 0 ? (sqDone / sqQuests.length) * 100 : 0;

  // Material-type counts for the "My Materials" tile grid
  const materialCounts: MaterialCounts = {
    pdf: materials.filter((m) => m.file_type === 'pdf').length,
    video: materials.filter((m) => m.file_type === 'video').length,
    image: materials.filter((m) => m.file_type === 'image').length,
    audio: materials.filter((m) => m.file_type === 'audio').length,
    document: materials.filter((m) => ['document', 'other'].includes(m.file_type)).length,
  };

  const name = profile?.display_name || user?.email?.split('@')[0] || (language === 'ar' ? 'زميلتي' : 'Student');
  const streakDays = profile?.streak_days ?? stats.streakDays;
  const totalPoints = profile?.xp_points ?? 0;

  if (authLoading || !onboardingChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <DashSidebar />

      <div className="min-h-screen px-4 py-6 sm:px-6 lg:ps-[17.5rem] lg:pe-8">
        <DashHeader
          name={name}
          avatarUrl={profile?.avatar_url ?? null}
          unreadCount={unreadCount}
          onMenuClick={() => {}}
          actions={<ScheduleReuploadButton onTasksCreated={() => window.location.reload()} />}
        />

        {/* Streak Recovery Dialog */}
        <StreakRecoveryDialog
          open={showRecoveryDialog}
          onOpenChange={closeDialog}
          previousStreak={previousStreak}
          currentXP={currentXP}
          onRecover={recoverStreak}
          onDecline={declineRecovery}
        />

        {/* Rank up celebration overlay */}
        <RankCelebration />

        <div className="animate-fade-in">
          <DashStatCards weeklyGoalDone={weeklyGoalDone} streakDays={streakDays} totalPoints={totalPoints} />

          {/* Assistant + Study Plan + Treasure Map row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DashAssistantCard />
            <DashPlanCard
              tasks={todayTasks}
              onToggle={handleToggleTask}
              loading={loading}
              onAdd={(title) => addTask({ title, due_date: new Date().toISOString() })}
            />
            <DashQuestCard percent={questPercent} />
          </div>

          {/* Materials + Quizzes + Reports row */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DashMaterialsCard counts={materialCounts} />
            <DashQuizCard />
            <DashReportsCard />
          </div>

          {/* Leaderboard row */}
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <DashLeaderboardCard />
            </div>
            <DashTipCardMini />
          </div>

          <DashTipBar />
        </div>
      </div>
    </div>
  );
};

// Small companion card next to the leaderboard — quick jump to Focus Mode
// so the full-screen focus experience stays one tap away.
const DashTipCardMini = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const ar = language === 'ar';
  return (
    <button
      onClick={() => navigate('/focus')}
      className="glass-card flex min-h-[240px] flex-col items-start justify-between rounded-3xl p-5 text-start transition-transform hover:scale-[1.01]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">🎯</div>
      <div>
        <h3 className="font-display text-lg font-extrabold text-navy">{ar ? 'وضع التركيز' : 'Focus Mode'}</h3>
        <p className="mt-1 text-xs font-bold text-muted-foreground">
          {ar ? 'مؤقت بومودورو + أصوات هادية تساعدك تركز' : 'Pomodoro timer + calm sounds for deep focus'}
        </p>
        <span className="mt-3 inline-block rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-extrabold text-primary-foreground shadow-glow">
          {ar ? 'ابدأ جلسة' : 'Start a Session'}
        </span>
      </div>
    </button>
  );
};

export default Dashboard;
