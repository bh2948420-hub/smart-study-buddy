import { Task } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trash2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

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

const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => {
  const { t, language } = useLanguage();
  
  const formattedTime = format(new Date(task.due_date), 'HH:mm');
  const formattedDate = format(
    new Date(task.due_date), 
    'dd MMM', 
    { locale: language === 'ar' ? ar : undefined }
  );

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border-l-4 transition-all hover:shadow-soft group',
        priorityColors[task.priority],
        task.completed && 'opacity-60'
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          'h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
          task.completed
            ? 'bg-accent border-accent text-accent-foreground'
            : 'border-muted-foreground hover:border-primary'
        )}
      >
        {task.completed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4 opacity-0 group-hover:opacity-50" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-medium truncate',
            task.completed && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate">
            {task.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formattedDate} - {formattedTime}
        </p>
      </div>

      <span
        className={cn(
          'px-2 py-1 rounded-full text-xs font-medium shrink-0',
          priorityBadgeColors[task.priority]
        )}
      >
        {t(task.priority)}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default TaskItem;
