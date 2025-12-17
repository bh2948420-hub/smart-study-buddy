import { Task } from '@/hooks/useTasks';
import TaskItem from './TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  title?: string;
  showIcon?: boolean;
}

const TaskList = ({ 
  tasks, 
  loading, 
  onToggle, 
  onDelete, 
  title,
  showIcon = true 
}: TaskListProps) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {showIcon && <Clock className="h-5 w-5 text-primary" />}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('noTasks')}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TaskList;
