import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTasks } from '@/hooks/useTasks';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useStats } from '@/hooks/useStats';
import { useDataSync } from '@/hooks/useDataSync';
import { useStreakRecovery } from '@/hooks/useStreakRecovery';
import { TaskList, AddTaskForm, TaskCalendar } from '@/components/tasks';
import { PomodoroTimer } from '@/components/study/PomodoroTimer';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { DailyQuizWidget } from '@/components/dashboard/DailyQuizWidget';
import { WeeklyChallenges } from '@/components/challenges/WeeklyChallenges';
import { RecentQuizResults } from '@/components/dashboard/RecentQuizResults';
import { FocusSessionSummary } from '@/components/dashboard/FocusSessionSummary';
import { StreakRecoveryDialog } from '@/components/streak/StreakRecoveryDialog';
import { StreakWinnersPanel } from '@/components/dashboard/StreakWinnersPanel';
import {
  CalendarDays,
  List,
  Brain,
  LogOut,
  Loader2,
  Play,
  FolderOpen,
  MessageSquare,
  Focus,
} from 'lucide-react';
import { toast } from 'sonner';
import { isSameDay } from 'date-fns';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { ScheduleReuploadButton } from '@/components/dashboard/ScheduleReuploadButton';
import { TodayStudyPlan } from '@/components/dashboard/TodayStudyPlan';
import { SubjectMasteryRadar } from '@/components/dashboard/SubjectMasteryRadar';
import { AIPerformancePredictor } from '@/components/dashboard/AIPerformancePredictor';
import { RankCelebration } from '@/components/celebrations/RankCelebration';
import { StreakBadges } from '@/components/streak/StreakBadges';

const Dashboard = () => {
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showTimer, setShowTimer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  
  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks();
  const { sessions, activeSession, startSession, endSession, getTodayStats } = useStudySessions();
  const { stats } = useStats();
  const { syncTaskComplete, syncFocusSession } = useDataSync();
  const {
    showRecoveryDialog,
    previousStreak,
    currentXP,
    recoverStreak,
    declineRecovery,
    closeDialog,
  } = useStreakRecovery();

  const todayStats = getTodayStats();
  const completedTasks = tasks.filter(t => t.completed).length;
  const focusPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Enhanced toggleTask with XP sync
  const handleToggleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      // Task is being completed
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleStartQuiz = () => {
    navigate('/quizzes');
  };

  const handleStartStudy = async () => {
    if (activeSession) {
      await endSession();
      setShowTimer(false);
    } else {
      setShowTimer(true);
      await startSession();
    }
  };

  const handleSessionComplete = async (duration: number) => {
    if (activeSession) {
      await endSession();
    }
  };

  // Filter tasks for today
  const todayTasks = tasks.filter((task) =>
    isSameDay(new Date(task.due_date), new Date())
  );

  // Filter tasks for selected date
  const selectedDateTasks = selectedDate
    ? tasks.filter((task) => isSameDay(new Date(task.due_date), selectedDate))
    : [];

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
      <Navbar />

      {/* Streak Recovery Dialog */}
      <StreakRecoveryDialog
        open={showRecoveryDialog}
        onOpenChange={closeDialog}
        previousStreak={previousStreak}
        currentXP={currentXP}
        onRecover={recoverStreak}
        onDecline={declineRecovery}
      />

      <main className="container py-8 space-y-6">
        {/* Welcome Section */}
        <div className="animate-fade-in flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('welcomeBack')}, <span className="text-primary">{user?.email?.split('@')[0] || t('student')}!</span>
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'إليك نظرة عامة على مهامك لليوم'
                : "Here's an overview of your tasks for today"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ScheduleReuploadButton onTasksCreated={() => { /* tasks will refresh via useTasks */ window.location.reload(); }} />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              {language === 'ar' ? 'خروج' : 'Logout'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalStudyMinutes={todayStats.totalMinutes}
          completedTasks={completedTasks}
          totalTasks={tasks.length}
          focusPercentage={focusPercentage}
          upcomingTests={0}
          streakDays={stats.streakDays}
          averageScore={stats.averageScore}
        />

        {/* Rank Celebration */}
        <RankCelebration />

        {/* Subject Mastery Radar */}
        <SubjectMasteryRadar />

        {/* Streak Badges */}
        <StreakBadges />
        {/* Study Plan */}
        <TodayStudyPlan />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Study Planner */}
          <div className="lg:col-span-2 space-y-6">
            {/* View Toggle & Add Task */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  {t('viewList')}
                </Button>
                <Button
                  variant={view === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('calendar')}
                  className="gap-2"
                >
                  <CalendarDays className="h-4 w-4" />
                  {t('viewCalendar')}
                </Button>
              </div>

              <AddTaskForm onAddTask={addTask} selectedDate={selectedDate} />
            </div>

            {/* Calendar View */}
            {view === 'calendar' && (
              <TaskCalendar
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            )}

            {/* Task List */}
            <TaskList
              tasks={view === 'calendar' ? selectedDateTasks : todayTasks}
              loading={loading}
              onToggle={handleToggleTask}
              onDelete={deleteTask}
              title={view === 'calendar' 
                ? (language === 'ar' ? 'مهام التاريخ المحدد' : 'Tasks for Selected Date')
                : t('todayTasks')
              }
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Performance Predictor */}
            <AIPerformancePredictor />

            {/* Streak Winners */}
            <StreakWinnersPanel />

            {/* Focus Session Summary - Links to Focus Mode */}
            <FocusSessionSummary />

            {/* Recent Quiz Results - Links to Quizzes */}
            <RecentQuizResults />

            {/* Daily Quiz Widget */}
            <DailyQuizWidget />

            {/* Pomodoro Timer */}
            {showTimer && (
              <PomodoroTimer onSessionComplete={handleSessionComplete} />
            )}

            {/* Weekly Challenges */}
            <WeeklyChallenges />

            {/* Quick Actions */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>
                  {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full gap-2 justify-start"
                  variant="default"
                  onClick={() => navigate('/focus')}
                >
                  <Focus className="h-5 w-5" />
                  {language === 'ar' ? 'وضع التركيز' : 'Focus Mode'}
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant={activeSession ? 'destructive' : 'outline'}
                  onClick={handleStartStudy}
                >
                  <Play className="h-5 w-5" />
                  {activeSession 
                    ? (language === 'ar' ? 'إنهاء الجلسة' : 'End Session')
                    : (language === 'ar' ? 'ابدأ الدراسة' : 'Start Study')
                  }
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  onClick={handleStartQuiz}
                >
                  <Brain className="h-5 w-5 text-primary" />
                  {t('startQuiz')}
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  onClick={() => navigate('/materials')}
                >
                  <FolderOpen className="h-5 w-5 text-accent" />
                  {language === 'ar' ? 'المواد الدراسية' : 'Study Materials'}
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  onClick={() => navigate('/chat')}
                >
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'مساعد الدراسة' : 'Study Assistant'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
