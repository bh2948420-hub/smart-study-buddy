import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText, Image, Video, Music, File, Download, Trash2,
  MoreVertical, Sparkles, Eye, BookOpen, Brain
} from 'lucide-react';
import { Material } from '@/hooks/useMaterials';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface MaterialCardProps {
  material: Material;
  onDownload: (material: Material) => void;
  onDelete: (id: number, filePath: string) => void;
  onGenerateQuiz: (material: Material) => void;
  onPreview: (material: Material) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (material: Material) => void;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return FileText;
    case 'image': return Image;
    case 'video': return Video;
    case 'audio': return Music;
    default: return File;
  }
};

const getFileColor = (type: string) => {
  switch (type) {
    case 'pdf': return 'bg-red-500/10 text-red-600 dark:text-red-400';
    case 'image': return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'video': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'audio': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function MaterialCard({ 
  material, 
  onDownload, 
  onDelete, 
  onGenerateQuiz,
  onPreview,
  selectionMode = false,
  isSelected = false,
  onToggleSelect
}: MaterialCardProps) {
  const { language } = useLanguage();
  const Icon = getFileIcon(material.file_type);
  const colorClass = getFileColor(material.file_type);

  const t = {
    download: language === 'ar' ? 'تحميل' : 'Download',
    delete: language === 'ar' ? 'حذف' : 'Delete',
    generateQuiz: language === 'ar' ? 'إنشاء اختبار' : 'Generate Quiz',
    preview: language === 'ar' ? 'معاينة' : 'Preview',
    actions: language === 'ar' ? 'الإجراءات' : 'Actions',
  };

  const handleCardClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(material);
    }
  };

  return (
    <Card 
      className={cn(
        "group hover:shadow-lg transition-all duration-300 overflow-hidden",
        selectionMode && "cursor-pointer",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
          : "hover:border-primary/50"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Visual Header with Selection Checkbox */}
        <div className={cn('p-4 flex items-center justify-center relative', colorClass)}>
          {selectionMode && (
            <div 
              className="absolute top-2 left-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect?.(material)}
                className="h-5 w-5 border-2 bg-background"
              />
            </div>
          )}
          <Icon className="h-10 w-10" />
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate text-sm" title={material.file_name}>
                {material.file_name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(material.uploaded_at).toLocaleDateString(
                  language === 'ar' ? 'ar-EG' : 'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                )}
              </p>
            </div>
            
            {/* Actions Dropdown - Only show when not in selection mode */}
            {!selectionMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPreview(material)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t.preview}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDownload(material)}>
                    <Download className="h-4 w-4 mr-2" />
                    {t.download}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onGenerateQuiz(material)}
                    className="text-primary"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t.generateQuiz}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(material.id, material.file_path)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Subject Badge */}
          {material.subject && (
            <Badge variant="secondary" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              {material.subject}
            </Badge>
          )}

          {/* Quick Actions - Only show when not in selection mode */}
          {!selectionMode && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(material);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                {t.preview}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateQuiz(material);
                }}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {t.generateQuiz}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}