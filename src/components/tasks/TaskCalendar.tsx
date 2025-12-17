import { Task } from '@/hooks/useTasks';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isSameDay } from 'date-fns';

interface TaskCalendarProps {
  tasks: Task[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

const TaskCalendar = ({ tasks, selectedDate, onSelectDate }: TaskCalendarProps) => {
  // Get dates that have tasks
  const taskDates = tasks.reduce((acc, task) => {
    const dateKey = new Date(task.due_date).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = { high: 0, medium: 0, low: 0 };
    }
    acc[dateKey][task.priority]++;
    return acc;
  }, {} as Record<string, { high: number; medium: number; low: number }>);

  return (
    <Card className="animate-scale-in">
      <CardContent className="pt-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          className="rounded-md border mx-auto pointer-events-auto"
          modifiers={{
            hasHighPriority: (date) => {
              const dateKey = date.toDateString();
              return taskDates[dateKey]?.high > 0;
            },
            hasMediumPriority: (date) => {
              const dateKey = date.toDateString();
              return taskDates[dateKey]?.medium > 0 && !taskDates[dateKey]?.high;
            },
            hasLowPriority: (date) => {
              const dateKey = date.toDateString();
              return taskDates[dateKey]?.low > 0 && !taskDates[dateKey]?.high && !taskDates[dateKey]?.medium;
            },
          }}
          modifiersStyles={{
            hasHighPriority: {
              backgroundColor: 'hsl(var(--destructive) / 0.2)',
              fontWeight: 'bold',
            },
            hasMediumPriority: {
              backgroundColor: 'hsl(var(--warning) / 0.2)',
              fontWeight: 'bold',
            },
            hasLowPriority: {
              backgroundColor: 'hsl(var(--accent) / 0.2)',
              fontWeight: 'bold',
            },
          }}
        />
        
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive/20" />
            <span className="text-muted-foreground">عالي</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-warning/20" />
            <span className="text-muted-foreground">متوسط</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-accent/20" />
            <span className="text-muted-foreground">منخفض</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCalendar;
