import { useState, useCallback, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, FileText, Image, Video, Music, File, 
  Trash2, Download, Search, Filter, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Materials = () => {
  const { language, dir } = useLanguage();
  const { materials, loading, uploading, uploadMaterial, deleteMaterial, downloadFile } = useMaterials();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'لغة عربية', 'إنجليزي', 'تاريخ', 'جغرافيا'];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      default: return File;
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || m.file_type === filterType;
    const matchesSubject = filterSubject === 'all' || m.subject === filterSubject;
    return matchesSearch && matchesType && matchesSubject;
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      try {
        await uploadMaterial(file);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }, [uploadMaterial]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await uploadMaterial(file);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const handleDownload = async (material: Material) => {
    try {
      await downloadFile(material.file_path, material.file_name);
    } catch (error) {
      // Error already handled in downloadFile
      console.error('Download failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      
      <main className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'المواد الدراسية' : 'Study Materials'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'ارفع وأدر ملفاتك الدراسية' : 'Upload and manage your study files'}
          </p>
        </div>

        {/* Upload Area */}
        <Card 
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            uploading && 'opacity-50 pointer-events-none'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-10">
            {uploading ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            )}
            <p className="text-lg font-medium">
              {language === 'ar' ? 'اسحب الملفات هنا أو انقر للرفع' : 'Drag files here or click to upload'}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'PDF، صور، فيديو، صوت' : 'PDF, Images, Video, Audio'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.doc,.docx"
            />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={language === 'ar' ? 'النوع' : 'Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="image">{language === 'ar' ? 'صور' : 'Images'}</SelectItem>
              <SelectItem value="video">{language === 'ar' ? 'فيديو' : 'Video'}</SelectItem>
              <SelectItem value="audio">{language === 'ar' ? 'صوت' : 'Audio'}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={language === 'ar' ? 'المادة' : 'Subject'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <File className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {language === 'ar' ? 'لا توجد ملفات' : 'No files found'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'ارفع ملفاتك الدراسية للبدء' : 'Upload your study materials to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMaterials.map((material) => {
              const Icon = getFileIcon(material.file_type);
              return (
                <Card key={material.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={material.file_name}>
                          {material.file_name}
                        </p>
                        {material.subject && (
                          <p className="text-sm text-muted-foreground">{material.subject}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(material.uploaded_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(material)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {language === 'ar' ? 'تحميل' : 'Download'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMaterial(material.id, material.file_path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Materials;
