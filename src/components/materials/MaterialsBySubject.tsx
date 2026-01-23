import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  BookOpen, FileText, Image, Video, Music, File, 
  FolderOpen, Grid3X3, List, ChevronDown, ChevronUp,
  CheckSquare, Square, Layers, X
} from 'lucide-react';
import { Material } from '@/hooks/useMaterials';
import { MaterialCard } from './MaterialCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface MaterialsBySubjectProps {
  materials: Material[];
  onDownload: (material: Material) => void;
  onDelete: (id: number, filePath: string) => void;
  onGenerateQuiz: (material: Material) => void;
  onPreview: (material: Material) => void;
  selectionMode: boolean;
  selectedMaterials: Material[];
  onToggleSelect: (material: Material) => void;
  onToggleSelectionMode: () => void;
  onGenerateCombinedQuiz: () => void;
}

export function MaterialsBySubject({ 
  materials, 
  onDownload, 
  onDelete, 
  onGenerateQuiz,
  onPreview,
  selectionMode,
  selectedMaterials,
  onToggleSelect,
  onToggleSelectionMode,
  onGenerateCombinedQuiz
}: MaterialsBySubjectProps) {
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set(['all']));

  const t = {
    all: language === 'ar' ? 'الكل' : 'All',
    unorganized: language === 'ar' ? 'غير مصنف' : 'Uncategorized',
    files: language === 'ar' ? 'ملف' : 'files',
    noFiles: language === 'ar' ? 'لا توجد ملفات' : 'No files found',
    uploadFirst: language === 'ar' ? 'ارفع ملفاتك الدراسية للبدء' : 'Upload your study materials to get started',
    bySubject: language === 'ar' ? 'حسب المادة' : 'By Subject',
    byType: language === 'ar' ? 'حسب النوع' : 'By Type',
    selectFiles: language === 'ar' ? 'تحديد الملفات' : 'Select Files',
    cancelSelection: language === 'ar' ? 'إلغاء التحديد' : 'Cancel Selection',
    selected: language === 'ar' ? 'محدد' : 'selected',
    generateCombinedQuiz: language === 'ar' ? 'إنشاء اختبار شامل' : 'Generate Combined Quiz',
    selectMultiple: language === 'ar' ? 'حدد عدة ملفات لإنشاء اختبار شامل' : 'Select multiple files to create a combined quiz',
  };

  const materialsBySubject = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    
    materials.forEach(material => {
      const subject = material.subject || t.unorganized;
      if (!grouped[subject]) {
        grouped[subject] = [];
      }
      grouped[subject].push(material);
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === t.unorganized) return 1;
      if (b === t.unorganized) return -1;
      return a.localeCompare(b);
    });

    return sortedKeys.map(key => ({
      subject: key,
      materials: grouped[key]
    }));
  }, [materials, t.unorganized]);

  const materialsByType = useMemo(() => {
    const types = {
      pdf: { icon: FileText, label: 'PDF', color: 'text-red-500' },
      image: { icon: Image, label: language === 'ar' ? 'صور' : 'Images', color: 'text-green-500' },
      video: { icon: Video, label: language === 'ar' ? 'فيديو' : 'Video', color: 'text-purple-500' },
      audio: { icon: Music, label: language === 'ar' ? 'صوت' : 'Audio', color: 'text-blue-500' },
      document: { icon: File, label: language === 'ar' ? 'مستندات' : 'Documents', color: 'text-orange-500' },
    };

    return Object.entries(types).map(([type, config]) => ({
      type,
      ...config,
      materials: materials.filter(m => m.file_type === type)
    })).filter(t => t.materials.length > 0);
  }, [materials, language]);

  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  const isSelected = (material: Material) => {
    return selectedMaterials.some(m => m.id === material.id);
  };

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-muted mb-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">{t.noFiles}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.uploadFirst}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Selection Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm">
            {materials.length} {t.files}
          </Badge>
          
          {selectionMode && selectedMaterials.length > 0 && (
            <Badge variant="default" className="text-sm bg-primary">
              {selectedMaterials.length} {t.selected}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selection Mode Toggle */}
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
            className="gap-2"
          >
            {selectionMode ? (
              <>
                <X className="h-4 w-4" />
                {t.cancelSelection}
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                {t.selectFiles}
              </>
            )}
          </Button>

          {/* Generate Combined Quiz Button */}
          {selectionMode && selectedMaterials.length >= 2 && (
            <Button
              onClick={onGenerateCombinedQuiz}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              <Layers className="h-4 w-4" />
              {t.generateCombinedQuiz}
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Selection Mode Hint */}
      {selectionMode && selectedMaterials.length < 2 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Layers className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">{t.selectMultiple}</p>
        </div>
      )}

      <Tabs defaultValue="subject" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="subject">
            <BookOpen className="h-4 w-4 mr-2" />
            {t.bySubject}
          </TabsTrigger>
          <TabsTrigger value="type">
            <File className="h-4 w-4 mr-2" />
            {t.byType}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subject" className="mt-6 space-y-4">
          {materialsBySubject.map(({ subject, materials: subjectMaterials }) => (
            <Card key={subject} className="overflow-hidden">
              <CardHeader 
                className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSubject(subject)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{subject}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {subjectMaterials.length} {t.files}
                      </p>
                    </div>
                  </div>
                  {expandedSubjects.has(subject) ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              
              {expandedSubjects.has(subject) && (
                <CardContent className="pt-0 pb-4">
                  <div className={cn(
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
                      : 'space-y-2'
                  )}>
                    {subjectMaterials.map(material => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        onDownload={onDownload}
                        onDelete={onDelete}
                        onGenerateQuiz={onGenerateQuiz}
                        onPreview={onPreview}
                        selectionMode={selectionMode}
                        isSelected={isSelected(material)}
                        onToggleSelect={onToggleSelect}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="type" className="mt-6">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-4">
              {materialsByType.map(({ type, icon: TypeIcon, label, color }) => (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className="shrink-0 cursor-pointer hover:bg-muted"
                >
                  <TypeIcon className={cn('h-3 w-3 mr-1', color)} />
                  {label}
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          
          <div className="space-y-6 mt-4">
            {materialsByType.map(({ type, icon: TypeIcon, label, color, materials: typeMaterials }) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-4">
                  <TypeIcon className={cn('h-5 w-5', color)} />
                  <h3 className="font-semibold">{label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {typeMaterials.length}
                  </Badge>
                </div>
                <div className={cn(
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                    : 'space-y-2'
                )}>
                  {typeMaterials.map(material => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onDownload={onDownload}
                      onDelete={onDelete}
                      onGenerateQuiz={onGenerateQuiz}
                      onPreview={onPreview}
                      selectionMode={selectionMode}
                      isSelected={isSelected(material)}
                      onToggleSelect={onToggleSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
