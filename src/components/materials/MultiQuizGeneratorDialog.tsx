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
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, Loader2, Brain, Target, FileText, CheckCircle2, 
  Layers, BookOpen, File, Eye, ArrowLeft, ArrowRight, ListChecks
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

interface ExtractedContent {
  materialId: number;
  fileName: string;
  subject: string | null;
  content: string;
  topics: string[];
  wordCount: number;
}

type Step = 'configure' | 'preview' | 'generating';

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return FileText;
    default: return File;
  }
};

// Extract key topics from content using simple NLP heuristics
const extractTopics = (content: string, fileName: string): string[] => {
  const topics: string[] = [];
  
  // Look for chapter/section headers
  const headerPatterns = [
    /(?:chapter|الفصل|الباب|الوحدة|unit|section|درس|lesson)\s*[:\d]+\s*([^\n]+)/gi,
    /^#+\s*(.+)$/gm, // Markdown headers
    /^([A-Z][^.!?\n]{10,50})$/gm, // Title-case lines
  ];
  
  for (const pattern of headerPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 3) {
        topics.push(match[1].trim().slice(0, 60));
      }
      if (topics.length >= 5) break;
    }
    if (topics.length >= 5) break;
  }
  
  // If no topics found, create generic ones from filename
  if (topics.length === 0) {
    const cleanName = fileName.replace(/\.(pdf|docx?|txt)$/i, '').replace(/[_-]/g, ' ');
    topics.push(cleanName);
  }
  
  return [...new Set(topics)].slice(0, 5);
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
  
  // Form state
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState([15]);
  
  // Step state
  const [step, setStep] = useState<Step>('configure');
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedContents, setExtractedContents] = useState<ExtractedContent[]>([]);

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
    generate: language === 'ar' ? 'إنشاء الاختبار' : 'Generate Quiz',
    generating: language === 'ar' ? 'جاري الإنشاء...' : 'Generating...',
    extracting: language === 'ar' ? 'جاري استخراج المحتوى...' : 'Extracting content...',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    back: language === 'ar' ? 'رجوع' : 'Back',
    success: language === 'ar' ? 'تم إنشاء الاختبار الشامل!' : 'Comprehensive quiz created!',
    goToQuiz: language === 'ar' ? 'انتقل للاختبار' : 'Go to Quiz',
    error: language === 'ar' ? 'فشل في إنشاء الاختبار' : 'Failed to generate quiz',
    selectedFiles: language === 'ar' ? 'الملفات المحددة' : 'Selected Files',
    filesSelected: language === 'ar' ? 'ملفات محددة' : 'files selected',
    coveringTopics: language === 'ar' ? 'يغطي مواضيع من' : 'Covering topics from',
    previewTopics: language === 'ar' ? 'معاينة المواضيع' : 'Preview Topics',
    previewSubtitle: language === 'ar' 
      ? 'راجع المحتوى المستخرج قبل إنشاء الاختبار'
      : 'Review extracted content before generating the quiz',
    topicsFound: language === 'ar' ? 'المواضيع المكتشفة' : 'Topics Found',
    words: language === 'ar' ? 'كلمة' : 'words',
    contentSummary: language === 'ar' ? 'ملخص المحتوى' : 'Content Summary',
    totalContent: language === 'ar' ? 'إجمالي المحتوى' : 'Total Content',
    readyToGenerate: language === 'ar' 
      ? 'المحتوى جاهز! يمكنك الآن إنشاء الاختبار.'
      : 'Content ready! You can now generate the quiz.',
    noTopicsFound: language === 'ar' 
      ? 'لم يتم العثور على مواضيع محددة'
      : 'No specific topics found',
    usingMetadata: language === 'ar' 
      ? 'سيتم استخدام بيانات الملف'
      : 'Will use file metadata',
    next: language === 'ar' ? 'التالي' : 'Next',
    confirmGenerate: language === 'ar' ? 'تأكيد وإنشاء' : 'Confirm & Generate',
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

  const handlePreviewTopics = async () => {
    if (materials.length === 0) return;

    try {
      setExtracting(true);
      setExtractionProgress(0);
      setExtractedContents([]);
      
      const extracted: ExtractedContent[] = [];
      
      // Extract content from each material
      for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        setExtractionProgress(Math.round(((i + 1) / materials.length) * 100));
        
        let content = '';
        
        if (material.file_type === 'pdf') {
          const pdfText = await extractPdfText(material.file_path);
          if (pdfText && pdfText.length > 100) {
            content = pdfText;
          } else {
            content = buildFallbackContent(material);
          }
        } else if (material.file_type === 'document' || material.file_name.endsWith('.txt')) {
          const { data, error } = await supabase.storage
            .from('study-materials')
            .download(material.file_path);

          if (!error && data) {
            content = await data.text();
          } else {
            content = buildFallbackContent(material);
          }
        } else {
          content = buildFallbackContent(material);
        }
        
        const topics = extractTopics(content, material.file_name);
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
        
        extracted.push({
          materialId: material.id,
          fileName: material.file_name,
          subject: material.subject,
          content,
          topics,
          wordCount,
        });
      }

      setExtractedContents(extracted);
      setExtracting(false);
      setStep('preview');

    } catch (error) {
      console.error('Error extracting content:', error);
      toast.error(t.error);
      setExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (extractedContents.length === 0) return;

    try {
      setStep('generating');
      
      // Combine all content
      const contentParts = extractedContents.map(ec => 
        `--- ${ec.fileName} (${ec.subject || 'General'}) ---\n${ec.content}`
      );
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
        undefined,
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
      setStep('preview');
    }
  };

  const resetState = () => {
    setTitle('');
    setDifficulty('medium');
    setQuestionCount([15]);
    setExtractionProgress(0);
    setExtractedContents([]);
    setStep('configure');
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(resetState, 200);
  };

  const totalWords = extractedContents.reduce((sum, ec) => sum + ec.wordCount, 0);
  const allTopics = extractedContents.flatMap(ec => ec.topics);
  const isProcessing = extracting || generating;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              {step === 'preview' ? (
                <Eye className="h-5 w-5 text-primary" />
              ) : (
                <Layers className="h-5 w-5 text-primary" />
              )}
            </div>
            {step === 'preview' ? t.previewTopics : t.title}
          </DialogTitle>
          <DialogDescription>
            {step === 'preview' ? t.previewSubtitle : t.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Configure */}
          {step === 'configure' && (
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
          )}

          {/* Step 2: Preview Topics */}
          {step === 'preview' && (
            <div className="space-y-4 py-4">
              {/* Summary Card */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{t.readyToGenerate}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.totalContent}: {totalWords.toLocaleString()} {t.words} • {allTopics.length} {t.topicsFound.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extracted Content per File */}
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-2">
                  {extractedContents.map((ec, index) => (
                    <Card key={ec.materialId} className="overflow-hidden">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate flex-1">{ec.fileName}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {ec.wordCount.toLocaleString()} {t.words}
                          </Badge>
                        </div>
                        
                        {ec.subject && (
                          <Badge variant="secondary" className="text-xs">
                            {ec.subject}
                          </Badge>
                        )}
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ListChecks className="h-3 w-3" />
                            {t.topicsFound}:
                          </div>
                          {ec.topics.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {ec.topics.map((topic, i) => (
                                <Badge 
                                  key={i} 
                                  variant="outline" 
                                  className="text-xs bg-background"
                                >
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              {t.noTopicsFound} - {t.usingMetadata}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <Loader2 className="absolute inset-0 h-16 w-16 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium">{t.generating}</p>
                <p className="text-sm text-muted-foreground">
                  {questionCount[0]} {t.questions}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-between pt-4 border-t">
          {step === 'configure' && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                {t.cancel}
              </Button>
              <Button 
                onClick={handlePreviewTopics} 
                disabled={isProcessing || materials.length === 0}
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.extracting}
                  </>
                ) : (
                  <>
                    {t.next}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('configure')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.back}
              </Button>
              <Button 
                onClick={handleGenerate}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t.confirmGenerate}
              </Button>
            </>
          )}
          
          {step === 'generating' && (
            <div className="w-full text-center text-sm text-muted-foreground">
              {t.generating}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
