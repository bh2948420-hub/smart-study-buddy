import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Upload, Clock, BookOpen, Target, Sparkles, Loader2, 
  ChevronLeft, ChevronRight, CheckCircle2, GraduationCap,
  Image, X
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const STEPS = 4;

const subjectOptions = [
  { en: 'Math', ar: 'رياضيات', emoji: '📐' },
  { en: 'Physics', ar: 'فيزياء', emoji: '⚡' },
  { en: 'Chemistry', ar: 'كيمياء', emoji: '🧪' },
  { en: 'Biology', ar: 'أحياء', emoji: '🧬' },
  { en: 'English', ar: 'إنجليزي', emoji: '🇬🇧' },
  { en: 'Arabic', ar: 'عربي', emoji: '📖' },
  { en: 'History', ar: 'تاريخ', emoji: '🏛️' },
  { en: 'Geography', ar: 'جغرافيا', emoji: '🌍' },
  { en: 'Computer Science', ar: 'حاسب آلي', emoji: '💻' },
  { en: 'Science', ar: 'علوم', emoji: '🔬' },
];

const studyHourOptions = [
  { value: '1', en: '1 hour', ar: 'ساعة واحدة', emoji: '⏰' },
  { value: '2', en: '2 hours', ar: 'ساعتين', emoji: '⏰' },
  { value: '3', en: '3 hours', ar: '3 ساعات', emoji: '⏰' },
  { value: '4+', en: '4+ hours', ar: '4+ ساعات', emoji: '🔥' },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [studyHours, setStudyHours] = useState('');
  const [goals, setGoals] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savingTasks, setSavingTasks] = useState(false);
  const [scheduleImage, setScheduleImage] = useState<string | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [autoTasksCount, setAutoTasksCount] = useState(0);

  const progress = ((step + 1) / STEPS) * 100;

  const toggleSubject = (subject: string) => {
    setWeakSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isAr ? 'من فضلك ارفع صورة فقط' : 'Please upload an image file only');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(isAr ? 'حجم الصورة كبير جداً (الحد الأقصى 10MB)' : 'Image too large (max 10MB)');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setScheduleImage(base64);
        setSchedulePreview(base64);
        toast.success(isAr ? '✅ تم رفع صورة الجدول!' : '✅ Schedule image uploaded!');
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error(isAr ? 'حصل خطأ في رفع الصورة' : 'Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setScheduleImage(null);
    setSchedulePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const autoCreateTasks = async (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const tasksToInsert = tasks.map((t: any) => ({
        user_id: user.id,
        title: t.title,
        description: t.description || null,
        due_date: new Date(t.due_date).toISOString(),
        priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
        completed: false,
      }));

      const { error } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (error) {
        console.error('Error inserting tasks:', error);
        return 0;
      }

      return tasksToInsert.length;
    } catch (err) {
      console.error('Error creating tasks:', err);
      return 0;
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: {
          weakSubjects: weakSubjects.join(', '),
          studyHoursPerDay: studyHours,
          goals,
          language,
          scheduleImageBase64: scheduleImage || undefined,
        },
      });

      if (error) throw error;
      setGeneratedPlan(data.plan);

      // Save plan to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('study_plans').insert({
          user_id: user.id,
          plan_markdown: data.plan,
          weak_subjects: weakSubjects,
          study_hours: studyHours,
          goals: goals || null,
          schedule_image_used: !!scheduleImage,
        } as any);
      }

      // Auto-create tasks from AI plan
      if (data.tasks && data.tasks.length > 0) {
        setSavingTasks(true);
        const count = await autoCreateTasks(data.tasks);
        setAutoTasksCount(count);
        setSavingTasks(false);
      }

      setStep(3);
    } catch (err) {
      console.error('Plan generation error:', err);
      toast.error(isAr ? 'حصل خطأ في توليد الخطة، حاول تاني' : 'Error generating plan, try again');
    } finally {
      setGenerating(false);
    }
  };

  const finishOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({ onboarding_completed: true } as any)
        .eq('user_id', user.id);

      toast.success(isAr ? '🎉 مبروك! خطتك جاهزة!' : '🎉 Congrats! Your plan is ready!');
      onComplete();
    } catch (err) {
      console.error('Error finishing onboarding:', err);
      onComplete();
    }
  };

  const canGoNext = () => {
    if (step === 0) return true;
    if (step === 1) return weakSubjects.length > 0;
    if (step === 2) return studyHours !== '';
    return true;
  };

  const handleNext = () => {
    if (step === 2) {
      generatePlan();
    } else if (step === 3) {
      finishOnboarding();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {isAr ? `الخطوة ${step + 1} من ${STEPS}` : `Step ${step + 1} of ${STEPS}`}
            </span>
            <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-2xl border-2 animate-fade-in">
          {/* Step 0: Welcome + Schedule Upload */}
          {step === 0 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <GraduationCap className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  {isAr ? '👋 أهلاً بيك في SmartEdu!' : '👋 Welcome to SmartEdu!'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {isAr
                    ? 'هنساعدك تعمل خطة دراسية ذكية مخصصة ليك! كل اللي عليك تجاوب على كام سؤال بسيط وهنعملك خطة بالـ AI 🤖✨'
                    : "We'll help you create a smart personalized study plan! Just answer a few simple questions and AI will build your plan 🤖✨"}
                </p>
                <div className="grid grid-cols-3 gap-3 pt-4">
                  {[
                    { icon: '📚', label: isAr ? 'حدد موادك' : 'Set Subjects' },
                    { icon: '⏰', label: isAr ? 'حدد وقتك' : 'Set Time' },
                    { icon: '🎯', label: isAr ? 'خطة ذكية' : 'Smart Plan' },
                  ].map((item, i) => (
                    <div key={i} className="bg-muted/50 rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <p className="text-xs font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Schedule Image Upload */}
                <div className="border-2 border-dashed border-border rounded-xl p-4 mt-4 space-y-3">
                  <p className="text-sm font-medium">
                    <Image className="h-4 w-4 inline me-1" />
                    {isAr ? 'ارفع صورة جدول المدرسة (اختياري)' : 'Upload school schedule image (optional)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr 
                      ? 'الـ AI هيحلل الصورة ويستخرج المواد والأوقات ويوزع المهام تلقائياً' 
                      : 'AI will analyze the image, extract subjects & times, and auto-create tasks'}
                  </p>

                  {schedulePreview ? (
                    <div className="relative inline-block">
                      <img src={schedulePreview} alt="Schedule" className="max-h-40 rounded-lg border" />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-xs text-green-600 mt-1">
                        {isAr ? '✅ تم رفع الصورة بنجاح' : '✅ Image uploaded successfully'}
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin me-2" />
                      ) : (
                        <Upload className="h-4 w-4 me-2" />
                      )}
                      {isAr ? 'اختار صورة الجدول' : 'Choose schedule image'}
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 1: Weak Subjects */}
          {step === 1 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {isAr ? 'إيه المواد اللي محتاج تحسنها؟' : 'Which subjects need improvement?'}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? 'اختار مادة أو أكتر' : 'Select one or more subjects'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {subjectOptions.map(sub => {
                    const label = isAr ? sub.ar : sub.en;
                    const selected = weakSubjects.includes(label);
                    return (
                      <button
                        key={sub.en}
                        onClick={() => toggleSubject(label)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-start",
                          selected
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <span className="text-xl">{sub.emoji}</span>
                        <span className="font-medium text-sm">{label}</span>
                        {selected && <CheckCircle2 className="h-4 w-4 text-primary ms-auto" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Study Time & Goals */}
          {step === 2 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Clock className="h-8 w-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl">
                  {isAr ? 'كام ساعة بتذاكر في اليوم؟' : 'How many hours do you study daily?'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {studyHourOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setStudyHours(opt.value)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-center",
                        studyHours === opt.value
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <p className="font-medium text-sm mt-1">{isAr ? opt.ar : opt.en}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Target className="h-4 w-4 inline me-1" />
                    {isAr ? 'إيه هدفك من الدراسة؟ (اختياري)' : 'What is your study goal? (optional)'}
                  </label>
                  <Textarea
                    value={goals}
                    onChange={e => setGoals(e.target.value)}
                    placeholder={isAr ? 'مثلاً: عايز أجيب مجموع عالي، أحسن في الرياضيات...' : 'e.g., Get higher grades, improve in Math...'}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: AI Generated Plan */}
          {step === 3 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-3">
                  <Sparkles className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl">
                  {isAr ? '🎉 خطتك الدراسية جاهزة!' : '🎉 Your Study Plan is Ready!'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Auto tasks notification */}
                {autoTasksCount > 0 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-primary">
                      {isAr 
                        ? `✅ تم إضافة ${autoTasksCount} مهمة تلقائياً في قائمة مهامك!`
                        : `✅ ${autoTasksCount} tasks were automatically added to your task list!`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr 
                        ? 'هتلاقيهم في الداشبورد جاهزين ليك'
                        : 'You\'ll find them ready in your dashboard'}
                    </p>
                  </div>
                )}

                {savingTasks && (
                  <div className="flex items-center justify-center gap-2 p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {isAr ? 'بيضيف المهام تلقائياً...' : 'Auto-creating tasks...'}
                    </span>
                  </div>
                )}

                <div className="bg-muted/50 rounded-xl p-4 max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{generatedPlan}</ReactMarkdown>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <div className="p-6 pt-2 flex items-center justify-between">
            {step > 0 && !generating ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
                {isAr ? <ChevronRight className="h-4 w-4 me-1" /> : <ChevronLeft className="h-4 w-4 me-1" />}
                {isAr ? 'رجوع' : 'Back'}
              </Button>
            ) : (
              <div />
            )}

            <Button
              onClick={handleNext}
              disabled={!canGoNext() || generating || savingTasks}
              className="min-w-[140px] gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAr ? 'بيحضر خطتك...' : 'Generating...'}
                </>
              ) : step === 3 ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {isAr ? 'يلا نبدأ!' : "Let's Start!"}
                </>
              ) : step === 2 ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  {isAr ? 'اعملي خطة بالـ AI' : 'Generate AI Plan'}
                </>
              ) : (
                <>
                  {isAr ? 'التالي' : 'Next'}
                  {isAr ? <ChevronLeft className="h-4 w-4 ms-1" /> : <ChevronRight className="h-4 w-4 ms-1" />}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Skip option */}
        {step < 3 && (
          <button
            onClick={finishOnboarding}
            className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isAr ? 'تخطي وابدأ مباشرة ←' : 'Skip and start directly →'}
          </button>
        )}
      </div>
    </div>
  );
};
