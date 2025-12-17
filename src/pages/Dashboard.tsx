import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTasks } from '@/hooks/useTasks';
import { TaskList, AddTaskForm, TaskCalendar } from '@/components/tasks';
import {
  CalendarDays,
  List,
  Brain,
  Coffee,
  LogOut,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { isSameDay } from 'date-fns';

const Dashboard = () => {
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks();

  useEffect(() => {
    // Check auth state
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleStartQuiz = () => {
    toast.info(language === 'ar' ? 'قريباً! ميزة الاختبارات' : 'Coming soon! Quiz feature');
  };

  const handleTakeBreak = () => {
    toast.success(
      language === 'ar'
        ? 'استمتع باستراحتك! عد بعد 5 دقائق'
        : 'Enjoy your break! Come back in 5 minutes'
    );
  };

  // Filter tasks for today
  const todayTasks = tasks.filter((task) =>
    isSameDay(new Date(task.due_date), new Date())
  );

  // Filter tasks for selected date
  const selectedDateTasks = selectedDate
    ? tasks.filter((task) => isSameDay(new Date(task.due_date), selectedDate))
    : [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in flex items-center justify-between">
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
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            {language === 'ar' ? 'خروج' : 'Logout'}
          </Button>
        </div>

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
              onToggle={toggleTask}
              onDelete={deleteTask}
              title={view === 'calendar' 
                ? (language === 'ar' ? 'مهام التاريخ المحدد' : 'Tasks for Selected Date')
                : t('todayTasks')
              }
            />
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
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
                  variant="outline"
                  onClick={handleStartQuiz}
                >
                  <Brain className="h-5 w-5 text-primary" />
                  {t('startQuiz')}
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  onClick={handleTakeBreak}
                >
                  <Coffee className="h-5 w-5 text-accent" />
                  {t('takeBreak')}
                </Button>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'إحصائيات' : 'Statistics'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-sm font-medium">
                    {language === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}
                  </span>
                  <span className="text-lg font-bold text-primary">{tasks.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <span className="text-sm font-medium">
                    {language === 'ar' ? 'المكتملة' : 'Completed'}
                  </span>
                  <span className="text-lg font-bold text-accent">
                    {tasks.filter(t => t.completed).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <span className="text-sm font-medium">
                    {language === 'ar' ? 'مهام اليوم' : "Today's Tasks"}
                  </span>
                  <span className="text-lg font-bold text-warning">{todayTasks.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
