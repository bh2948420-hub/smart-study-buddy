import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  totalStudyMinutes: number;
  completedTasks: number;
  totalTasks: number;
  focusPercentage: number;
  upcomingTests?: number;
}

export const StatsCards = ({ 
  totalStudyMinutes, 
  completedTasks, 
  totalTasks, 
  focusPercentage,
  upcomingTests = 0 
}: StatsCardsProps) => {
  const { language } = useLanguage();

  const stats = [
    {
      label: language === 'ar' ? 'وقت الدراسة' : 'Study Time',
      value: `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: language === 'ar' ? 'المهام المكتملة' : 'Tasks Done',
      value: `${completedTasks}/${totalTasks}`,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: language === 'ar' ? 'نسبة التركيز' : 'Focus Rate',
      value: `${focusPercentage}%`,
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: language === 'ar' ? 'اختبارات قادمة' : 'Upcoming Tests',
      value: upcomingTests.toString(),
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', stat.bgColor)}>
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
