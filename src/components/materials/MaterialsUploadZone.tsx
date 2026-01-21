import { useCallback, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Loader2, FileUp, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface MaterialsUploadZoneProps {
  uploading: boolean;
  onUpload: (file: File, subject?: string, description?: string) => Promise<unknown>;
}

const SUBJECTS = {
  ar: ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'لغة عربية', 'إنجليزي', 'تاريخ', 'جغرافيا', 'حاسوب', 'أخرى'],
  en: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Arabic', 'English', 'History', 'Geography', 'Computer', 'Other']
};

export function MaterialsUploadZone({ uploading, onUpload }: MaterialsUploadZoneProps) {
  const { language } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    dropzone: language === 'ar' ? 'اسحب الملفات هنا أو انقر للرفع' : 'Drag files here or click to upload',
    formats: language === 'ar' ? 'PDF، صور، فيديو، مستندات Word' : 'PDF, Images, Video, Word documents',
    browse: language === 'ar' ? 'تصفح الملفات' : 'Browse Files',
    uploading: language === 'ar' ? 'جاري الرفع...' : 'Uploading...',
    addDetails: language === 'ar' ? 'إضافة تفاصيل الملف' : 'Add File Details',
    subject: language === 'ar' ? 'المادة' : 'Subject',
    selectSubject: language === 'ar' ? 'اختر المادة' : 'Select Subject',
    description: language === 'ar' ? 'وصف (اختياري)' : 'Description (optional)',
    descPlaceholder: language === 'ar' ? 'مثال: الفصل الأول - الأعداد الحقيقية' : 'e.g., Chapter 1 - Real Numbers',
    upload: language === 'ar' ? 'رفع الملف' : 'Upload File',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
  };

  const subjects = language === 'ar' ? SUBJECTS.ar : SUBJECTS.en;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setDialogOpen(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await onUpload(selectedFile, subject || undefined, description || undefined);
      setDialogOpen(false);
      setSelectedFile(null);
      setSubject('');
      setDescription('');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setSelectedFile(null);
    setSubject('');
    setDescription('');
  };

  return (
    <>
      <Card 
        className={cn(
          'border-2 border-dashed transition-all duration-300 cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          dragActive && 'border-primary bg-primary/10 scale-[1.02]',
          uploading && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-10 px-4">
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">{t.uploading}</p>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-center">{t.dropzone}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.formats}</p>
              <Button variant="outline" className="mt-4" onClick={(e) => e.stopPropagation()}>
                <FileUp className="h-4 w-4 mr-2" />
                {t.browse}
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mp3,.doc,.docx,.ppt,.pptx"
          />
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              {t.addDetails}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Selected File Preview */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded bg-primary/10">
                  <FileUp className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Subject Selection */}
            <div className="space-y-2">
              <Label>{t.subject}</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectSubject} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{t.description}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descPlaceholder}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              {t.cancel}
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.upload}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
