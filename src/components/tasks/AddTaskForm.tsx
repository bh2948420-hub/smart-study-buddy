import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { NewTask } from '@/hooks/useTasks';

interface AddTaskFormProps {
  onAddTask: (task: NewTask) => Promise<any>;
  selectedDate?: Date;
}

const AddTaskForm = ({ onAddTask, selectedDate }: AddTaskFormProps) => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.time) return;

    setLoading(true);
    const date = selectedDate || new Date();
    const [hours, minutes] = formData.time.split(':');
    date.setHours(parseInt(hours), parseInt(minutes));

    const result = await onAddTask({
      title: formData.title,
      description: formData.description || undefined,
      due_date: date.toISOString(),
      priority: formData.priority,
    });

    setLoading(false);
    if (result) {
      setFormData({ title: '', description: '', time: '', priority: 'medium' });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}</Label>
            <Textarea
              placeholder={
                language === 'ar' ? 'أضف تفاصيل المهمة...' : 'Add task details...'
              }
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t('taskTime')}</Label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t('priority')}</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'high' | 'medium' | 'low') =>
                setFormData({ ...formData, priority: value })
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!formData.title || !formData.time || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('save')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskForm;
