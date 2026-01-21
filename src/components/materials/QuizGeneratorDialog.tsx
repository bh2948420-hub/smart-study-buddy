import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Loader2, BookOpen, Brain, Target } from 'lucide-react';
import { Material } from '@/hooks/useMaterials';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuizzes } from '@/hooks/useQuizzes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface QuizGeneratorDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuizGeneratorDialog({ material, open, onOpenChange }: QuizGeneratorDialogProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { generateQuiz, generating } = useQuizzes();
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState([10]);
  const [extracting, setExtracting] = useState(false);

  const t = {
    title: language === 'ar' ? 'إنشاء اختبار ذكي' : 'Generate Smart Quiz',
    subtitle: language === 'ar' 
      ? 'سيقوم الذكاء الاصطناعي بتحليل الملف وإنشاء أسئلة تفاعلية'
      : 'AI will analyze the file and create interactive questions',
    quizTitle: language === 'ar' ? 'عنوان الاختبار' : 'Quiz Title',
    titlePlaceholder: language === 'ar' ? 'مثال: اختبار الفصل الأول' : 'e.g., Chapter 1 Quiz',
    difficulty: language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty Level',
    easy: language === 'ar' ? 'سهل' : 'Easy',
    medium: language === 'ar' ? 'متوسط' : 'Medium',
    hard: language === 'ar' ? 'صعب' : 'Hard',
    questionCount: language === 'ar' ? 'عدد الأسئلة' : 'Number of Questions',
    questions: language === 'ar' ? 'سؤال' : 'questions',
    generate: language === 'ar' ? 'إنشاء الاختبار' : 'Generate Quiz',
    generating: language === 'ar' ? 'جاري الإنشاء...' : 'Generating...',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    success: language === 'ar' ? 'تم إنشاء الاختبار بنجاح!' : 'Quiz created successfully!',
    goToQuiz: language === 'ar' ? 'انتقل للاختبار' : 'Go to Quiz',
    error: language === 'ar' ? 'فشل في إنشاء الاختبار' : 'Failed to generate quiz',
    extracting: language === 'ar' ? 'جاري تحليل الملف...' : 'Analyzing file...',
  };

  const handleGenerate = async () => {
    if (!material) return;

    try {
      setExtracting(true);
      
      // Get file content - for text/pdf files, download and extract
      let content = '';
      
      // Download the file to extract content
      const { data, error } = await supabase.storage
        .from('study-materials')
        .download(material.file_path);

      if (error) throw error;

      // For text-based files, extract content
      if (material.file_type === 'document' || material.file_name.endsWith('.txt')) {
        content = await data.text();
      } else {
        // For PDFs and other files, use file name and description as context
        content = `عنوان الملف: ${material.file_name}\n`;
        if (material.subject) content += `المادة: ${material.subject}\n`;
        if (material.description) content += `الوصف: ${material.description}\n`;
        content += `\nيرجى إنشاء أسئلة عامة مناسبة لهذه المادة بناءً على المعلومات المتوفرة.`;
      }

      setExtracting(false);

      const quizTitle = title || `${language === 'ar' ? 'اختبار' : 'Quiz'}: ${material.file_name}`;
      
      await generateQuiz(
        content,
        quizTitle,
        material.subject || '',
        difficulty,
        material.id,
        questionCount[0]
      );

      toast.success(t.success, {
        action: {
          label: t.goToQuiz,
          onClick: () => navigate('/quizzes')
        }
      });

      onOpenChange(false);
      setTitle('');
      setDifficulty('medium');
      setQuestionCount([10]);

    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(t.error);
      setExtracting(false);
    }
  };

  if (!material) return null;

  const isProcessing = extracting || generating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Source File */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{material.file_name}</p>
              {material.subject && (
                <p className="text-xs text-muted-foreground">{material.subject}</p>
              )}
            </div>
          </div>

          {/* Quiz Title */}
          <div className="space-y-2">
            <Label htmlFor="quiz-title">{t.quizTitle}</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t.difficulty}
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">🟢 {t.easy}</SelectItem>
                <SelectItem value="medium">🟡 {t.medium}</SelectItem>
                <SelectItem value="hard">🔴 {t.hard}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question Count */}
          <div className="space-y-3">
            <Label className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                {t.questionCount}
              </span>
              <span className="text-primary font-medium">
                {questionCount[0]} {t.questions}
              </span>
            </Label>
            <Slider
              value={questionCount}
              onValueChange={setQuestionCount}
              min={5}
              max={30}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            {t.cancel}
          </Button>
          <Button onClick={handleGenerate} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {extracting ? t.extracting : t.generating}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t.generate}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
