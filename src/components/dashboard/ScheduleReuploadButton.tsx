import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarClock, Upload, Loader2, X, Image, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ScheduleReuploadButtonProps {
  onTasksCreated?: () => void;
}

export const ScheduleReuploadButton = ({ onTasksCreated }: ScheduleReuploadButtonProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [scheduleImage, setScheduleImage] = useState<string | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ plan: string; tasksCount: number } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(isAr ? 'من فضلك ارفع صورة فقط' : 'Please upload an image only');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isAr ? 'حجم الصورة كبير (الحد 10MB)' : 'Image too large (max 10MB)');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setScheduleImage(reader.result as string);
      setSchedulePreview(reader.result as string);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setScheduleImage(null);
    setSchedulePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!scheduleImage) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: {
          weakSubjects: '',
          studyHoursPerDay: '',
          goals: '',
          language,
          scheduleImageBase64: scheduleImage,
        },
      });

      if (error) throw error;

      // Auto-create tasks
      let tasksCount = 0;
      if (data.tasks && data.tasks.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const tasksToInsert = data.tasks.map((t: any) => ({
            user_id: user.id,
            title: t.title,
            description: t.description || null,
            due_date: new Date(t.due_date).toISOString(),
            priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
            completed: false,
          }));
          const { error: insertError } = await supabase.from('tasks').insert(tasksToInsert);
          if (!insertError) tasksCount = tasksToInsert.length;
        }
      }

      // Save plan to database
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from('study_plans').insert({
          user_id: currentUser.id,
          plan_markdown: data.plan,
          schedule_image_used: true,
        } as any);
      }

      setResult({ plan: data.plan, tasksCount });
      toast.success(isAr
        ? `✅ تم تحديث الجدول وإضافة ${tasksCount} مهمة جديدة!` 
        : `✅ Schedule updated with ${tasksCount} new tasks!`);
      onTasksCreated?.();
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'حصل خطأ، حاول تاني' : 'Error occurred, try again');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setScheduleImage(null);
    setSchedulePreview(null);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <CalendarClock className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {isAr ? 'تحديث جدول المدرسة' : 'Update school schedule'}
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            {isAr ? 'تحديث جدول المدرسة' : 'Update School Schedule'}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <p className="font-medium">
              {isAr ? 'تم التحديث بنجاح!' : 'Updated successfully!'}
            </p>
            {result.tasksCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {isAr 
                  ? `تم إضافة ${result.tasksCount} مهمة جديدة` 
                  : `${result.tasksCount} new tasks added`}
              </p>
            )}
            <Button onClick={handleClose} className="w-full">
              {isAr ? 'تمام' : 'Done'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isAr 
                ? 'ارفع صورة جدول المدرسة الجديد والـ AI هيحلله ويضيف مهام تلقائياً' 
                : 'Upload your new school schedule image and AI will analyze it and auto-create tasks'}
            </p>

            {schedulePreview ? (
              <div className="relative inline-block w-full">
                <img src={schedulePreview} alt="Schedule" className="w-full max-h-48 object-contain rounded-lg border" />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-24 border-dashed border-2 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Image className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm">{isAr ? 'اختار صورة الجدول' : 'Choose schedule image'}</span>
                  </>
                )}
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <Button
              onClick={handleGenerate}
              disabled={!scheduleImage || generating}
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAr ? 'بيحلل الجدول...' : 'Analyzing schedule...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {isAr ? 'حلل وأضف المهام' : 'Analyze & Add Tasks'}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
