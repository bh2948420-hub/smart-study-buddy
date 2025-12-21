import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, Target, Calendar, TrendingUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  totalStudyMinutes: number;
  completedTasks: number;
  totalTasks: number;
  focusPercentage: number;
  upcomingTests?: number;
  streakDays?: number;
  averageScore?: number;
}

export const StatsCards = ({ 
  totalStudyMinutes, 
  completedTasks, 
  totalTasks, 
  focusPercentage,
  upcomingTests = 0,
  streakDays = 0,
  averageScore = 0,
}: StatsCardsProps) => {
  const { language } = useLanguage();

  const stats = [
    {
      label: language === 'ar' ? 'وقت الدراسة اليوم' : 'Study Time Today',
      value: `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: language === 'ar' ? 'ساعات الدراسة' : 'hours studied',
    },
    {
      label: language === 'ar' ? 'المهام المكتملة' : 'Tasks Done',
      value: `${completedTasks}/${totalTasks}`,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: language === 'ar' ? 'من المهام' : 'tasks complete',
    },
    {
      label: language === 'ar' ? 'نسبة التركيز' : 'Focus Rate',
      value: `${focusPercentage}%`,
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      description: language === 'ar' ? 'معدل الإنتاجية' : 'productivity rate',
    },
    {
      label: language === 'ar' ? 'أيام التتابع' : 'Streak Days',
      value: streakDays.toString(),
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      description: language === 'ar' ? 'يوم متتالي' : 'consecutive days',
    },
    {
      label: language === 'ar' ? 'متوسط الدرجات' : 'Avg Score',
      value: averageScore > 0 ? `${averageScore}%` : '-',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      description: language === 'ar' ? 'في الاختبارات' : 'in quizzes',
    },
    {
      label: language === 'ar' ? 'اختبارات قادمة' : 'Upcoming Tests',
      value: upcomingTests.toString(),
      icon: Calendar,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      description: language === 'ar' ? 'هذا الأسبوع' : 'this week',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-all duration-300 hover:scale-105">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className={cn('p-2 rounded-lg w-fit', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
