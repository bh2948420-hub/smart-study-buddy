import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, Sparkles, ExternalLink, FileText, 
  Image, Video, Music, File, Loader2, X
} from 'lucide-react';
import { Material } from '@/hooks/useMaterials';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface MaterialPreviewDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (material: Material) => void;
  onGenerateQuiz: (material: Material) => void;
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

export function MaterialPreviewDialog({
  material,
  open,
  onOpenChange,
  onDownload,
  onGenerateQuiz
}: MaterialPreviewDialogProps) {
  const { language } = useLanguage();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = {
    preview: language === 'ar' ? 'معاينة الملف' : 'File Preview',
    download: language === 'ar' ? 'تحميل' : 'Download',
    generateQuiz: language === 'ar' ? 'إنشاء اختبار' : 'Generate Quiz',
    openInNew: language === 'ar' ? 'فتح في نافذة جديدة' : 'Open in New Tab',
    noPreview: language === 'ar' ? 'لا يمكن معاينة هذا الملف' : 'Cannot preview this file',
    uploadedOn: language === 'ar' ? 'تم الرفع في' : 'Uploaded on',
  };

  useEffect(() => {
    if (material && open) {
      loadPreview();
    } else {
      setPreviewUrl(null);
    }
  }, [material, open]);

  const loadPreview = async () => {
    if (!material) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('study-materials')
        .createSignedUrl(material.file_path, 3600);

      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!material) return null;

  const Icon = getFileIcon(material.file_type);
  const canPreview = ['image', 'pdf', 'video', 'audio'].includes(material.file_type);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
          <Icon className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t.noPreview}</p>
        </div>
      );
    }

    switch (material.file_type) {
      case 'image':
        return (
          <div className="relative rounded-lg overflow-hidden bg-muted">
            <img 
              src={previewUrl} 
              alt={material.file_name}
              className="max-h-[60vh] w-auto mx-auto object-contain"
            />
          </div>
        );
      case 'pdf':
        return (
          <iframe
            src={previewUrl}
            className="w-full h-[60vh] rounded-lg border"
            title={material.file_name}
          />
        );
      case 'video':
        return (
          <video 
            src={previewUrl} 
            controls 
            className="w-full max-h-[60vh] rounded-lg"
          >
            Your browser does not support video playback.
          </video>
        );
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center py-12 bg-muted rounded-lg">
            <Music className="h-16 w-16 text-primary mb-4" />
            <audio src={previewUrl} controls className="w-full max-w-md">
              Your browser does not support audio playback.
            </audio>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <Icon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t.noPreview}</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate">{material.file_name}</p>
              <div className="flex items-center gap-2 mt-1">
                {material.subject && (
                  <Badge variant="secondary" className="text-xs">
                    {material.subject}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {t.uploadedOn} {new Date(material.uploaded_at).toLocaleDateString(
                    language === 'ar' ? 'ar-EG' : 'en-US'
                  )}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Preview Area */}
        <div className="mt-4">
          {renderPreview()}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={() => onDownload(material)}>
            <Download className="h-4 w-4 mr-2" />
            {t.download}
          </Button>
          <Button variant="secondary" onClick={() => {
            onGenerateQuiz(material);
            onOpenChange(false);
          }}>
            <Sparkles className="h-4 w-4 mr-2" />
            {t.generateQuiz}
          </Button>
          {previewUrl && canPreview && (
            <Button variant="outline" onClick={() => window.open(previewUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {t.openInNew}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
