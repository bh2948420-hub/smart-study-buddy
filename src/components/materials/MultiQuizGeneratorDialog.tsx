import { useState, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Sparkles, Loader2, Brain, Target, FileText, CheckCircle2, 
  Layers, BookOpen, File, Eye, ArrowLeft, ArrowRight, ListChecks,
  X, Pencil, Check, Plus, GripVertical
} from 'lucide-react';
import { Material } from '@/hooks/useMaterials';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuizzes } from '@/hooks/useQuizzes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MultiQuizGeneratorDialogProps {
  materials: Material[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearSelection: () => void;
}

interface TopicItem {
  id: string;
  text: string;
  included: boolean;
}

interface ExtractedContent {
  materialId: number;
  fileName: string;
  subject: string | null;
  content: string;
  topics: TopicItem[];
  wordCount: number;
  included: boolean;
}

type Step = 'configure' | 'preview' | 'generating';

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return FileText;
    default: return File;
  }
};

// Topic Editor Card Component
interface TopicEditorCardProps {
  extractedContent: ExtractedContent;
  onToggleFile: (materialId: number) => void;
  onToggleTopic: (materialId: number, topicId: string) => void;
  onEditTopic: (materialId: number, topicId: string, newText: string) => void;
  onRemoveTopic: (materialId: number, topicId: string) => void;
  onAddTopic: (materialId: number, text: string) => void;
  onReorderTopics: (materialId: number, oldIndex: number, newIndex: number) => void;
  t: Record<string, string>;
}

// Sortable Topic Item Component
interface SortableTopicItemProps {
  topic: TopicItem;
  materialId: number;
  editingTopicId: string | null;
  editText: string;
  onToggleTopic: (materialId: number, topicId: string) => void;
  onStartEdit: (topicId: string, currentText: string) => void;
  onSaveEdit: (topicId: string) => void;
  onCancelEdit: () => void;
  onSetEditText: (text: string) => void;
  onRemoveTopic: (materialId: number, topicId: string) => void;
  t: Record<string, string>;
}

function SortableTopicItem({
  topic,
  materialId,
  editingTopicId,
  editText,
  onToggleTopic,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSetEditText,
  onRemoveTopic,
  t,
}: SortableTopicItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 p-1.5 rounded-md bg-muted/50 group",
        !topic.included && "opacity-50",
        isDragging && "opacity-70 shadow-md bg-muted z-50"
      )}
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab active:cursor-grabbing touch-none p-0.5 hover:bg-muted rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>

      <Checkbox
        checked={topic.included}
        onCheckedChange={() => onToggleTopic(materialId, topic.id)}
        className="h-3.5 w-3.5"
      />
      
      {editingTopicId === topic.id ? (
        <div className="flex-1 flex items-center gap-1">
          <Input
            value={editText}
            onChange={(e) => onSetEditText(e.target.value)}
            className="h-6 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit(topic.id);
              if (e.key === 'Escape') onCancelEdit();
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onSaveEdit(topic.id)}
          >
            <Check className="h-3 w-3 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onCancelEdit}
          >
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ) : (
        <>
          <span className={cn(
            "text-xs flex-1 truncate",
            !topic.included && "line-through"
          )}>
            {topic.text}
          </span>
          <div className="hidden group-hover:flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => onStartEdit(topic.id, topic.text)}
              title={t.editTopic}
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => onRemoveTopic(materialId, topic.id)}
              title={t.removeTopic}
            >
              <X className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function TopicEditorCard({ 
  extractedContent: ec, 
  onToggleFile, 
  onToggleTopic, 
  onEditTopic, 
  onRemoveTopic,
  onAddTopic,
  onReorderTopics,
  t 
}: TopicEditorCardProps) {
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTopicText, setNewTopicText] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const handleStartEdit = (topicId: string, currentText: string) => {
    setEditingTopicId(topicId);
    setEditText(currentText);
  };

  const handleSaveEdit = (topicId: string) => {
    if (editText.trim()) {
      onEditTopic(ec.materialId, topicId, editText.trim());
    }
    setEditingTopicId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingTopicId(null);
    setEditText('');
  };

  const handleAddNew = () => {
    if (newTopicText.trim()) {
      onAddTopic(ec.materialId, newTopicText.trim());
      setNewTopicText('');
      setShowAddInput(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ec.topics.findIndex(t => t.id === active.id);
      const newIndex = ec.topics.findIndex(t => t.id === over.id);
      onReorderTopics(ec.materialId, oldIndex, newIndex);
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      !ec.included && "opacity-50"
    )}>
      <CardContent className="p-3 space-y-3">
        {/* File Header with Toggle */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={ec.included}
            onCheckedChange={() => onToggleFile(ec.materialId)}
            aria-label={ec.included ? t.excludeFile : t.includeFile}
          />
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className={cn(
            "text-sm font-medium truncate flex-1",
            !ec.included && "line-through"
          )}>
            {ec.fileName}
          </span>
          <Badge variant="outline" className="text-xs shrink-0">
            {ec.wordCount.toLocaleString()} {t.words}
          </Badge>
        </div>
        
        {ec.subject && (
          <Badge variant="secondary" className="text-xs">
            {ec.subject}
          </Badge>
        )}
        
        {/* Topics Section */}
        {ec.included && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ListChecks className="h-3 w-3" />
                {t.topicsFound}:
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowAddInput(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {t.addTopic}
              </Button>
            </div>
            
            {/* Topic Items with Drag & Drop */}
            {ec.topics.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={ec.topics.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {ec.topics.map((topic) => (
                      <SortableTopicItem
                        key={topic.id}
                        topic={topic}
                        materialId={ec.materialId}
                        editingTopicId={editingTopicId}
                        editText={editText}
                        onToggleTopic={onToggleTopic}
                        onStartEdit={handleStartEdit}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onSetEditText={setEditText}
                        onRemoveTopic={onRemoveTopic}
                        t={t}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {t.noTopicsFound} - {t.usingMetadata}
              </p>
            )}

            {/* Add New Topic Input */}
            {showAddInput && (
              <div className="flex items-center gap-1 mt-2">
                <Input
                  value={newTopicText}
                  onChange={(e) => setNewTopicText(e.target.value)}
                  placeholder={t.newTopic}
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNew();
                    if (e.key === 'Escape') {
                      setShowAddInput(false);
                      setNewTopicText('');
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleAddNew}
                >
                  <Check className="h-3.5 w-3.5 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setShowAddInput(false);
                    setNewTopicText('');
                  }}
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Extract key topics from content using simple NLP heuristics
const extractTopics = (content: string, fileName: string): TopicItem[] => {
  const topicTexts: string[] = [];
  
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
        topicTexts.push(match[1].trim().slice(0, 60));
      }
      if (topicTexts.length >= 5) break;
    }
    if (topicTexts.length >= 5) break;
  }
  
  // If no topics found, create generic ones from filename
  if (topicTexts.length === 0) {
    const cleanName = fileName.replace(/\.(pdf|docx?|txt)$/i, '').replace(/[_-]/g, ' ');
    topicTexts.push(cleanName);
  }
  
  // Convert to TopicItem with unique IDs
  return [...new Set(topicTexts)].slice(0, 5).map((text, index) => ({
    id: `topic-${Date.now()}-${index}`,
    text,
    included: true,
  }));
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
    editTopic: language === 'ar' ? 'تعديل الموضوع' : 'Edit topic',
    removeTopic: language === 'ar' ? 'إزالة الموضوع' : 'Remove topic',
    addTopic: language === 'ar' ? 'إضافة موضوع' : 'Add topic',
    newTopic: language === 'ar' ? 'موضوع جديد...' : 'New topic...',
    excludeFile: language === 'ar' ? 'استبعاد الملف' : 'Exclude file',
    includeFile: language === 'ar' ? 'تضمين الملف' : 'Include file',
    includedTopics: language === 'ar' ? 'المواضيع المضمنة' : 'Included topics',
    excludedTopics: language === 'ar' ? 'المواضيع المستبعدة' : 'Excluded topics',
    dragToReorder: language === 'ar' ? 'اسحب لإعادة الترتيب' : 'Drag to reorder',
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
          included: true,
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

  // Topic management handlers
  const handleToggleFile = useCallback((materialId: number) => {
    setExtractedContents(prev => prev.map(ec => 
      ec.materialId === materialId ? { ...ec, included: !ec.included } : ec
    ));
  }, []);

  const handleToggleTopic = useCallback((materialId: number, topicId: string) => {
    setExtractedContents(prev => prev.map(ec => 
      ec.materialId === materialId 
        ? { 
            ...ec, 
            topics: ec.topics.map(t => 
              t.id === topicId ? { ...t, included: !t.included } : t
            )
          } 
        : ec
    ));
  }, []);

  const handleEditTopic = useCallback((materialId: number, topicId: string, newText: string) => {
    setExtractedContents(prev => prev.map(ec => 
      ec.materialId === materialId 
        ? { 
            ...ec, 
            topics: ec.topics.map(t => 
              t.id === topicId ? { ...t, text: newText } : t
            )
          } 
        : ec
    ));
  }, []);

  const handleRemoveTopic = useCallback((materialId: number, topicId: string) => {
    setExtractedContents(prev => prev.map(ec => 
      ec.materialId === materialId 
        ? { ...ec, topics: ec.topics.filter(t => t.id !== topicId) } 
        : ec
    ));
  }, []);

  const handleAddTopic = useCallback((materialId: number, text: string) => {
    if (!text.trim()) return;
    const newTopic: TopicItem = {
      id: `topic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: text.trim(),
      included: true,
    };
    setExtractedContents(prev => prev.map(ec => 
      ec.materialId === materialId 
        ? { ...ec, topics: [...ec.topics, newTopic] } 
        : ec
    ));
  }, []);

  const handleReorderTopics = useCallback((materialId: number, oldIndex: number, newIndex: number) => {
    setExtractedContents(prev => prev.map(ec => 
      ec.materialId === materialId 
        ? { ...ec, topics: arrayMove(ec.topics, oldIndex, newIndex) } 
        : ec
    ));
  }, []);

  const handleGenerate = async () => {
    const includedContents = extractedContents.filter(ec => ec.included);
    if (includedContents.length === 0) return;

    try {
      setStep('generating');
      
      // Combine content only from included files and topics
      const contentParts = includedContents.map(ec => {
        const includedTopics = ec.topics.filter(t => t.included).map(t => t.text);
        const topicContext = includedTopics.length > 0 
          ? `\nTopics to focus on: ${includedTopics.join(', ')}\n` 
          : '';
        return `--- ${ec.fileName} (${ec.subject || 'General'}) ---${topicContext}\n${ec.content}`;
      });
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

  const includedContents = extractedContents.filter(ec => ec.included);
  const totalWords = includedContents.reduce((sum, ec) => sum + ec.wordCount, 0);
  const includedTopics = includedContents.flatMap(ec => ec.topics.filter(t => t.included));
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
                        {t.totalContent}: {totalWords.toLocaleString()} {t.words} • {includedTopics.length} {t.includedTopics.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extracted Content per File */}
              <ScrollArea className="h-72">
                <div className="space-y-3 pr-2">
                  {extractedContents.map((ec) => (
                    <TopicEditorCard
                      key={ec.materialId}
                      extractedContent={ec}
                      onToggleFile={handleToggleFile}
                      onToggleTopic={handleToggleTopic}
                      onEditTopic={handleEditTopic}
                      onRemoveTopic={handleRemoveTopic}
                      onAddTopic={handleAddTopic}
                      onReorderTopics={handleReorderTopics}
                      t={t}
                    />
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
