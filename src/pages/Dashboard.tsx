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
import dashboardHero from '@/assets/dashboard-hero.jpg';

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

      <div className="relative isolate min-h-screen px-3 py-4 sm:px-5 lg:ps-[17.5rem] lg:pe-8">
        <section className="relative mb-5 overflow-hidden rounded-3xl border border-border/60 shadow-card">
          <img
            src={dashboardHero}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-background/10" />
          <div className="relative z-10 p-4 sm:p-6">
            <DashHeader
              name={name}
              avatarUrl={profile?.avatar_url ?? null}
              unreadCount={unreadCount}
              actions={<ScheduleReuploadButton onTasksCreated={() => window.location.reload()} />}
            />
            <DashStatCards weeklyGoalDone={weeklyGoalDone} streakDays={streakDays} totalPoints={totalPoints} />
          </div>
        </section>

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
          {/* Assistant + Study Plan + Treasure Map row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DashAssistantCard />
            <DashPlanCard
              tasks={todayTasks}
              onToggle={handleToggleTask}
              loading={loading}
              onAdd={(title) => addTask({ title, due_date: new Date().toISOString(), priority: 'medium' })}
            />
            <DashQuestCard percent={questPercent} />
          </div>

          {/* Materials + Quizzes + Reports row */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashMaterialsCard counts={materialCounts} />
            <DashQuizCard />
            <DashReportsCard />
            <DashLeaderboardCard />
          </div>

          <DashTipBar />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
