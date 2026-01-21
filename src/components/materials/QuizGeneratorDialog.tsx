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
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, BookOpen, Brain, Target, FileText, CheckCircle2 } from 'lucide-react';
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
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'extracting' | 'success' | 'fallback'>('idle');
  const [extractedChars, setExtractedChars] = useState(0);

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
    extractingPdf: language === 'ar' ? 'جاري استخراج النص من PDF...' : 'Extracting text from PDF...',
    extracting: language === 'ar' ? 'جاري تحليل الملف...' : 'Analyzing file...',
    pdfExtracted: language === 'ar' ? 'تم استخراج النص بنجاح' : 'Text extracted successfully',
    chars: language === 'ar' ? 'حرف' : 'chars',
    usingMetadata: language === 'ar' ? 'استخدام بيانات الملف' : 'Using file metadata',
  };

  // Extract text from PDF using edge function
  const extractPdfText = async (filePath: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await supabase.functions.invoke('extract-pdf-text', {
      body: { filePath }
    });

    if (response.error) {
      console.error('PDF extraction error:', response.error);
      return '';
    }

    if (response.data?.extracted && response.data?.text) {
      setExtractedChars(response.data.charCount || response.data.text.length);
      return response.data.text;
    }

    return '';
  };

  const handleGenerate = async () => {
    if (!material) return;

    try {
      setExtracting(true);
      setExtractionStatus('extracting');
      
      let content = '';
      
      // Handle different file types
      if (material.file_type === 'pdf') {
        // Extract text from PDF using edge function
        const pdfText = await extractPdfText(material.file_path);
        
        if (pdfText && pdfText.length > 100) {
          content = pdfText;
          setExtractionStatus('success');
        } else {
          // Fallback to metadata-based generation
          setExtractionStatus('fallback');
          content = buildFallbackContent(material);
        }
      } else if (material.file_type === 'document' || material.file_name.endsWith('.txt')) {
        // Download and read text files directly
        const { data, error } = await supabase.storage
          .from('study-materials')
          .download(material.file_path);

        if (error) throw error;
        content = await data.text();
        setExtractedChars(content.length);
        setExtractionStatus('success');
      } else {
        // For images, videos, etc., use fallback
        setExtractionStatus('fallback');
        content = buildFallbackContent(material);
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
      resetState();

    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(t.error);
      setExtracting(false);
      setExtractionStatus('idle');
    }
  };

  const buildFallbackContent = (mat: Material): string => {
    let content = `عنوان الملف: ${mat.file_name}\n`;
    if (mat.subject) content += `المادة: ${mat.subject}\n`;
    if (mat.description) content += `الوصف: ${mat.description}\n`;
    content += `\nيرجى إنشاء أسئلة عامة مناسبة لهذه المادة بناءً على المعلومات المتوفرة.`;
    return content;
  };

  const resetState = () => {
    setTitle('');
    setDifficulty('medium');
    setQuestionCount([10]);
    setExtractionStatus('idle');
    setExtractedChars(0);
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
          {/* Source File with Extraction Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {material.file_type === 'pdf' ? (
              <FileText className="h-5 w-5 text-red-500" />
            ) : (
              <BookOpen className="h-5 w-5 text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{material.file_name}</p>
              <div className="flex items-center gap-2 mt-1">
                {material.subject && (
                  <Badge variant="secondary" className="text-xs">
                    {material.subject}
                  </Badge>
                )}
                {extractionStatus === 'success' && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t.pdfExtracted} ({extractedChars.toLocaleString()} {t.chars})
                  </Badge>
                )}
                {extractionStatus === 'fallback' && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                    {t.usingMetadata}
                  </Badge>
                )}
              </div>
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
                {extracting ? (material.file_type === 'pdf' ? t.extractingPdf : t.extracting) : t.generating}
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
