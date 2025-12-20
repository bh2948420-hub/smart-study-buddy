import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CurriculumItem {
  id: number;
  user_id: string;
  file_name: string;
  file_path: string;
  content_text: string | null;
  subject: string | null;
  created_at: string;
}

export const useCurriculum = () => {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchCurriculum = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('curriculum_context')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCurriculum((data as CurriculumItem[]) || []);
    } catch (error) {
      console.error('Error fetching curriculum:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadCurriculum = async (file: File, subject?: string) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Extract text content (simplified - in production use edge function)
      let contentText = '';
      if (file.type === 'text/plain') {
        contentText = await file.text();
      }

      // Save to database
      const { data, error } = await supabase
        .from('curriculum_context')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          content_text: contentText || null,
          subject: subject || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCurriculum(prev => [data as CurriculumItem, ...prev]);
      toast({
        title: 'تم رفع المنهج',
        description: 'سيتم استخدامه كمرجع للإجابة على أسئلتك',
      });
      
      return data;
    } catch (error) {
      console.error('Error uploading curriculum:', error);
      toast({
        title: 'خطأ في الرفع',
        description: 'فشل رفع الملف، حاول مرة أخرى',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteCurriculum = async (id: number, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('study-materials')
        .remove([filePath]);

      if (storageError) console.error('Storage delete error:', storageError);

      const { error } = await supabase
        .from('curriculum_context')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCurriculum(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الملف بنجاح',
      });
    } catch (error) {
      console.error('Error deleting curriculum:', error);
    }
  };

  const getCurriculumContext = () => {
    return curriculum
      .filter(item => item.content_text)
      .map(item => `[ملف: ${item.file_name}]\n${item.content_text}`)
      .join('\n\n---\n\n');
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  return {
    curriculum,
    loading,
    uploading,
    uploadCurriculum,
    deleteCurriculum,
    getCurriculumContext,
    refetch: fetchCurriculum,
  };
};
