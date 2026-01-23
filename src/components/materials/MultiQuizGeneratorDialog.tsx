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
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, Loader2, Brain, Target, FileText, CheckCircle2, 
  Layers, X, BookOpen, File 
} from 'lucide-react';
import { Material } from '@/hooks/useMaterials';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuizzes } from '@/hooks/useQuizzes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MultiQuizGeneratorDialogProps {
  materials: Material[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearSelection: () => void;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return FileText;
    default: return File;
  }
};

export function MultiQuizGeneratorDialog({ 
  materials, 
  open, 
  onOpenChange,
  onClearSelection 
}: MultiQuizGeneratorDialogProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { generateQuiz, generating } = useQuizzes();
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState([15]);
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  const t = {
    title: language === 'ar' ? 'إنشاء اختبار شامل' : 'Generate Comprehensive Quiz',
    subtitle: language === 'ar' 
      ? 'سيقوم الذكاء الاصطناعي بدمج المحتوى من جميع الملفات المحددة'
      : 'AI will combine content from all selected files',
    quizTitle: language === 'ar' ? 'عنوان الاختبار' : 'Quiz Title',
    titlePlaceholder: language === 'ar' ? 'مثال: اختبار شامل' : 'e.g., Comprehensive Quiz',
    difficulty: language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty Level',
    easy: language === 'ar' ? 'سهل' : 'Easy',
    medium: language === 'ar' ? 'متوسط' : 'Medium',
    hard: language === 'ar' ? 'صعب' : 'Hard',
    questionCount: language === 'ar' ? 'عدد الأسئلة' : 'Number of Questions',
    questions: language === 'ar' ? 'سؤال' : 'questions',
    generate: language === 'ar' ? 'إنشاء الاختبار الشامل' : 'Generate Comprehensive Quiz',
    generating: language === 'ar' ? 'جاري الإنشاء...' : 'Generating...',
    extracting: language === 'ar' ? 'جاري استخراج المحتوى...' : 'Extracting content...',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    success: language === 'ar' ? 'تم إنشاء الاختبار الشامل!' : 'Comprehensive quiz created!',
    goToQuiz: language === 'ar' ? 'انتقل للاختبار' : 'Go to Quiz',
    error: language === 'ar' ? 'فشل في إنشاء الاختبار' : 'Failed to generate quiz',
    selectedFiles: language === 'ar' ? 'الملفات المحددة' : 'Selected Files',
    remove: language === 'ar' ? 'إزالة' : 'Remove',
    filesSelected: language === 'ar' ? 'ملفات محددة' : 'files selected',
    coveringTopics: language === 'ar' ? 'يغطي مواضيع من' : 'Covering topics from',
  };

  // Get unique subjects from selected materials
  const subjects = [...new Set(materials.map(m => m.subject).filter(Boolean))];

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
      return response.data.text;
    }

    return '';
  };

  const buildFallbackContent = (mat: Material): string => {
    let content = `عنوان الملف: ${mat.file_name}\n`;
    if (mat.subject) content += `المادة: ${mat.subject}\n`;
    if (mat.description) content += `الوصف: ${mat.description}\n`;
    return content;
  };

  const handleGenerate = async () => {
    if (materials.length === 0) return;

    try {
      setExtracting(true);
      setExtractionProgress(0);
      
      const contentParts: string[] = [];
      
      // Extract content from each material
      for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        setExtractionProgress(Math.round(((i + 1) / materials.length) * 100));
        
        let content = '';
        
        if (material.file_type === 'pdf') {
          const pdfText = await extractPdfText(material.file_path);
          if (pdfText && pdfText.length > 100) {
            content = `--- ${material.file_name} (${material.subject || 'General'}) ---\n${pdfText}`;
          } else {
            content = buildFallbackContent(material);
          }
        } else if (material.file_type === 'document' || material.file_name.endsWith('.txt')) {
          const { data, error } = await supabase.storage
            .from('study-materials')
            .download(material.file_path);

          if (!error && data) {
            const text = await data.text();
            content = `--- ${material.file_name} (${material.subject || 'General'}) ---\n${text}`;
          } else {
            content = buildFallbackContent(material);
          }
        } else {
          content = buildFallbackContent(material);
        }
        
        contentParts.push(content);
      }

      setExtracting(false);

      // Combine all content (limit to ~20k chars total to avoid token limits)
      const combinedContent = contentParts.join('\n\n').slice(0, 20000);
      
      // Build quiz title
      const quizTitle = title || (language === 'ar' 
        ? `اختبار شامل - ${materials.length} ملفات`
        : `Comprehensive Quiz - ${materials.length} files`);
      
      // Combine subjects for the quiz
      const combinedSubject = subjects.length > 0 
        ? subjects.join(', ')
        : (language === 'ar' ? 'متنوع' : 'Mixed');

      await generateQuiz(
        combinedContent,
        quizTitle,
        combinedSubject,
        difficulty,
        undefined, // No single material ID for combined quiz
        questionCount[0]
      );

      toast.success(t.success, {
        action: {
          label: t.goToQuiz,
          onClick: () => navigate('/quizzes')
        }
      });

      onOpenChange(false);
      onClearSelection();
      resetState();

    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(t.error);
      setExtracting(false);
    }
  };

  const resetState = () => {
    setTitle('');
    setDifficulty('medium');
    setQuestionCount([15]);
    setExtractionProgress(0);
  };

  const isProcessing = extracting || generating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Files Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t.selectedFiles}
              </Label>
              <Badge variant="secondary">
                {materials.length} {t.filesSelected}
              </Badge>
            </div>
            
            <ScrollArea className="h-32 rounded-lg border bg-muted/30 p-2">
              <div className="space-y-2">
                {materials.map(material => {
                  const Icon = getFileIcon(material.file_type);
                  return (
                    <div 
                      key={material.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-background"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{material.file_name}</span>
                      {material.subject && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {material.subject}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Subjects covered */}
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">{t.coveringTopics}:</span>
                {subjects.map(subject => (
                  <Badge key={subject} variant="secondary" className="text-xs">
                    {subject}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Quiz Title */}
          <div className="space-y-2">
            <Label htmlFor="multi-quiz-title">{t.quizTitle}</Label>
            <Input
              id="multi-quiz-title"
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

          {/* Question Count - Higher default for combined quiz */}
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
              min={10}
              max={50}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10</span>
              <span>30</span>
              <span>50</span>
            </div>
          </div>

          {/* Extraction Progress */}
          {extracting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.extracting} ({extractionProgress}%)
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${extractionProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            {t.cancel}
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isProcessing || materials.length === 0}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
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
