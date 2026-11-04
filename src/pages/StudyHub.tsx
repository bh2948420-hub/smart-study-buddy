import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { useDataSync } from '@/hooks/useDataSync';
import { Button } from '@/components/ui/button';
import { TaskList, AddTaskForm, TaskCalendar } from '@/components/tasks';
import { PomodoroTimer } from '@/components/study/PomodoroTimer';
import { DailyQuizWidget } from '@/components/dashboard/DailyQuizWidget';
import { WeeklyChallenges } from '@/components/challenges/WeeklyChallenges';
import { RecentQuizResults } from '@/components/dashboard/RecentQuizResults';
import { FocusSessionSummary } from '@/components/dashboard/FocusSessionSummary';
import { StreakWinnersPanel } from '@/components/dashboard/StreakWinnersPanel';
import { SmartDailyChallenge } from '@/components/dashboard/SmartDailyChallenge';
import { TodayStudyPlan } from '@/components/dashboard/TodayStudyPlan';
import { SubjectMasteryRadar } from '@/components/dashboard/SubjectMasteryRadar';
import { AIPerformancePredictor } from '@/components/dashboard/AIPerformancePredictor';
import { StreakBadges } from '@/components/streak/StreakBadges';
import { DashSidebar } from '@/components/dashboard/DashSidebar';
import { DashHeader } from '@/components/dashboard/DashHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CalendarDays,
  List,
  Play,
  Square,
  CalendarCheck2,
  Timer,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';

type HubTab = 'plan' | 'focus' | 'practice' | 'progress';

// Study Hub: the full working toolbox (planner, focus timer, practice and
// progress widgets) inside the same glass sidebar layout as the dashboard.
const StudyHub = () => {
  const { dir, language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showTimer, setShowTimer] = useState(false);
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tabParam = searchParams.get('tab') as HubTab | null;
  const tab: HubTab = ['plan', 'focus', 'practice', 'progress'].includes(tabParam ?? '') ? (tabParam as HubTab) : 'plan';

  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks();
  const { sessions, activeSession, startSession, endSession, getTodayStats } = useStudySessions();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const { syncTaskComplete, syncFocusSession } = useDataSync();

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
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

  const handleStartStudy = async () => {
    if (activeSession) {
      const duration = await endSession();
      await syncFocusSession(duration ?? 0);
      setShowTimer(false);
    } else {
      setShowTimer(true);
      await startSession();
    }
  };

  const handleSessionComplete = async (duration: number) => {
    if (activeSession) {
      const ended = await endSession();
      await syncFocusSession(ended ?? duration);
    }
  };

  const todayTasks = tasks.filter((task) => isSameDay(new Date(task.due_date), new Date()));
  const selectedDateTasks = selectedDate
    ? tasks.filter((task) => isSameDay(new Date(task.due_date), selectedDate))
    : [];

  const name = profile?.display_name || user?.email?.split('@')[0] || (language === 'ar' ? 'زميلتي' : 'Student');

  const tabs: { id: HubTab; label: string; icon: React.ElementType }[] = [
    { id: 'plan', label: ar('خطة المذاكرة', 'Study Plan'), icon: CalendarCheck2 },
    { id: 'focus', label: ar('التركيز والمؤقت', 'Focus & Timer'), icon: Timer },
    { id: 'practice', label: ar('التمرين والتحدّيات', 'Practice & Challenges'), icon: ClipboardCheck },
    { id: 'progress', label: ar('تقدمي', 'My Progress'), icon: BarChart3 },
  ];

  function ar(text: string, en: string) {
    return language === 'ar' ? text : en;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
        />

        <div className="animate-fade-in">
          {/* Tab switcher */}
          <div className="mb-5 flex flex-wrap gap-2">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setSearchParams(tb.id === 'plan' ? {} : { tab: tb.id })}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-all',
                  tab === tb.id
                    ? 'bg-gradient-sidebar text-white shadow-glow'
                    : 'glass-card text-navy hover:scale-[1.03]'
                )}
              >
                <tb.icon className="h-4 w-4" />
                {tb.label}
              </button>
            ))}
          </div>

          {/* Study Plan tab */}
          {tab === 'plan' && (
            <div className="space-y-6">
              <TodayStudyPlan />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                  <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')} className="gap-2">
                    <List className="h-4 w-4" /> {t('viewList')}
                  </Button>
                  <Button variant={view === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setView('calendar')} className="gap-2">
                    <CalendarDays className="h-4 w-4" /> {t('viewCalendar')}
                  </Button>
                </div>
                <AddTaskForm onAddTask={addTask} selectedDate={selectedDate} />
              </div>
              {view === 'calendar' && (
                <TaskCalendar tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              )}
              <TaskList
                tasks={view === 'calendar' ? selectedDateTasks : todayTasks}
                loading={loading}
                onToggle={handleToggleTask}
                onDelete={deleteTask}
                title={
                  view === 'calendar'
                    ? (language === 'ar' ? 'مهام التاريخ المحدد' : 'Tasks for Selected Date')
                    : t('todayTasks')
                }
              />
            </div>
          )}

          {/* Focus & Timer tab */}
          {tab === 'focus' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Button
                  onClick={handleStartStudy}
                  className="w-full gap-2 rounded-full bg-gradient-primary py-6 font-extrabold text-primary-foreground shadow-glow"
                >
                  {activeSession ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {activeSession
                    ? (language === 'ar' ? 'إنهاء جلسة المذاكرة' : 'End Study Session')
                    : (language === 'ar' ? 'ابدأ جلسة مذاكرة' : 'Start Study Session')}
                </Button>
                {(showTimer || activeSession) && (
                  <PomodoroTimer onSessionComplete={handleSessionComplete} />
                )}
              </div>
              <div className="space-y-6">
                <FocusSessionSummary />
                <Button
                  onClick={() => navigate('/focus')}
                  variant="outline"
                  className="w-full gap-2 rounded-full font-extrabold"
                >
                  <Timer className="h-4 w-4" />
                  {language === 'ar' ? 'افتح وضع التركيز الكامل' : 'Open Full Focus Mode'}
                </Button>
              </div>
            </div>
          )}

          {/* Practice & Challenges tab */}
          {tab === 'practice' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <DailyQuizWidget />
                <SmartDailyChallenge />
              </div>
              <div className="space-y-6">
                <WeeklyChallenges />
                <RecentQuizResults />
                <StreakBadges />
              </div>
            </div>
          )}

          {/* Progress tab */}
          {tab === 'progress' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <SubjectMasteryRadar />
                <StreakWinnersPanel />
              </div>
              <div className="space-y-6">
                <AIPerformancePredictor />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyHub;
