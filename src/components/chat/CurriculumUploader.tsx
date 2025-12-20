import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, File, Trash2, Loader2, BookOpen } from 'lucide-react';
import { useCurriculum, CurriculumItem } from '@/hooks/useCurriculum';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface CurriculumUploaderProps {
  onUploadComplete?: () => void;
}

export function CurriculumUploader({ onUploadComplete }: CurriculumUploaderProps) {
  const { language } = useLanguage();
  const { curriculum, uploading, uploadCurriculum, deleteCurriculum } = useCurriculum();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadCurriculum(file, subject || undefined);
      setSubject('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDelete = async (item: CurriculumItem) => {
    await deleteCurriculum(item.id, item.file_path);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return '🖼️';
    return '📁';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">
            {language === 'ar' ? 'رفع المنهج' : 'Upload Curriculum'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {language === 'ar' ? 'إدارة ملفات المنهج' : 'Manage Curriculum Files'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Section */}
          <Card className="p-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="subject">
                  {language === 'ar' ? 'المادة (اختياري)' : 'Subject (optional)'}
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: الرياضيات' : 'e.g., Mathematics'}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="file">
                  {language === 'ar' ? 'اختر ملف' : 'Choose File'}
                </Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="mt-1"
                />
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                </div>
              )}
            </div>
          </Card>

          {/* Files List */}
          <div>
            <Label className="mb-2 block">
              {language === 'ar' ? 'الملفات المرفوعة' : 'Uploaded Files'} ({curriculum.length})
            </Label>
            <ScrollArea className="h-48 rounded-md border">
              {curriculum.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <File className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    {language === 'ar' ? 'لا توجد ملفات' : 'No files yet'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {curriculum.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg',
                        'bg-muted/50 hover:bg-muted transition-colors'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{getFileIcon(item.file_name)}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.file_name}
                          </p>
                          {item.subject && (
                            <p className="text-xs text-muted-foreground">
                              {item.subject}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? '💡 الملفات المرفوعة ستستخدم كمرجع لمساعدك الذكي للإجابة على أسئلتك'
              : '💡 Uploaded files will be used as reference for your AI assistant to answer questions'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
