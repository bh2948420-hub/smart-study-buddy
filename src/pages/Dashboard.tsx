import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import AddUserButton from '@/components/AddUserButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarDays,
  List,
  Plus,
  Brain,
  Coffee,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  date: Date;
  time: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

const Dashboard = () => {
  const { t, dir, language } = useLanguage();
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: language === 'ar' ? 'مراجعة الرياضيات' : 'Math Review',
      date: new Date(),
      time: '10:00',
      priority: 'high',
      completed: false,
    },
    {
      id: '2',
      title: language === 'ar' ? 'قراءة الفصل الثالث' : 'Read Chapter 3',
      date: new Date(),
      time: '14:00',
      priority: 'medium',
      completed: false,
    },
    {
      id: '3',
      title: language === 'ar' ? 'تمارين الفيزياء' : 'Physics Exercises',
      date: new Date(),
      time: '16:00',
      priority: 'low',
      completed: true,
    },
  ]);

  const [newTask, setNewTask] = useState({
    title: '',
    time: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  const priorityColors = {
    high: 'border-l-destructive bg-destructive/5',
    medium: 'border-l-warning bg-warning/5',
    low: 'border-l-accent bg-accent/5',
  };

  const priorityBadgeColors = {
    high: 'bg-destructive/10 text-destructive',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-accent/10 text-accent',
  };

  const handleAddTask = () => {
    if (!newTask.title || !newTask.time) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      date: selectedDate || new Date(),
      time: newTask.time,
      priority: newTask.priority,
      completed: false,
    };

    setTasks([...tasks, task]);
    setNewTask({ title: '', time: '', priority: 'medium' });
    setDialogOpen(false);
    toast.success(language === 'ar' ? 'تمت إضافة المهمة' : 'Task added successfully');
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
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

  const todayTasks = tasks.filter(
    (task) => task.date.toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">
            {t('welcomeBack')}, <span className="text-primary">{t('student')}!</span>
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'إليك نظرة عامة على مهامك لليوم'
              : "Here's an overview of your tasks for today"}
          </p>
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

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('addTask')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('addTask')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>{t('taskTitle')}</Label>
                      <Input
                        placeholder={
                          language === 'ar' ? 'مثال: مراجعة الرياضيات' : 'e.g., Math Review'
                        }
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('taskTime')}</Label>
                      <Input
                        type="time"
                        value={newTask.time}
                        onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('priority')}</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value: 'high' | 'medium' | 'low') =>
                          setNewTask({ ...newTask, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">{t('high')}</SelectItem>
                          <SelectItem value="medium">{t('medium')}</SelectItem>
                          <SelectItem value="low">{t('low')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                        {t('cancel')}
                      </Button>
                      <Button className="flex-1" onClick={handleAddTask}>
                        {t('save')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Calendar View */}
            {view === 'calendar' && (
              <Card className="animate-scale-in">
                <CardContent className="pt-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border mx-auto"
                  />
                </CardContent>
              </Card>
            )}

            {/* Task List */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t('todayTasks')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('noTasks')}</p>
                  </div>
                ) : (
                  todayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskComplete(task.id)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-soft',
                        priorityColors[task.priority],
                        task.completed && 'opacity-60'
                      )}
                    >
                      <div
                        className={cn(
                          'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
                          task.completed
                            ? 'bg-accent border-accent text-accent-foreground'
                            : 'border-muted-foreground'
                        )}
                      >
                        {task.completed && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium truncate',
                            task.completed && 'line-through text-muted-foreground'
                          )}
                        >
                          {task.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{task.time}</p>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          priorityBadgeColors[task.priority]
                        )}
                      >
                        {t(task.priority)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
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
                <AddUserButton />
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {t('upcomingSessions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="font-medium text-sm">
                    {language === 'ar' ? 'الرياضيات - الجبر' : 'Mathematics - Algebra'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'اليوم، 10:00 صباحاً' : 'Today, 10:00 AM'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="font-medium text-sm">
                    {language === 'ar' ? 'الفيزياء - الميكانيكا' : 'Physics - Mechanics'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'غداً، 2:00 مساءً' : 'Tomorrow, 2:00 PM'}
                  </p>
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
