import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Material {
  id: number;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  subject: string | null;
  description: string | null;
  uploaded_at: string;
}

export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileName: string): Material['file_type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return 'audio';
    return 'document';
  };

  const uploadMaterial = async (file: File, subject?: string, description?: string) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata
      const { data, error } = await supabase
        .from('materials')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: getFileType(file.name),
          subject,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      
      setMaterials(prev => [data, ...prev]);
      toast({
        title: 'تم رفع الملف',
        description: `تم رفع "${file.name}" بنجاح`,
      });
      
      return data;
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({
        title: 'خطأ في الرفع',
        description: 'فشل في رفع الملف',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = async (id: number, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('study-materials')
        .remove([filePath]);

      if (storageError) console.error('Storage delete error:', storageError);

      // Delete metadata
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMaterials(prev => prev.filter(m => m.id !== id));
      toast({
        title: 'تم حذف الملف',
        description: 'تم حذف الملف بنجاح',
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'فشل في حذف الملف',
        variant: 'destructive',
      });
    }
  };

  const getDownloadUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('study-materials')
      .createSignedUrl(filePath, 3600);
    
    if (error) throw error;
    return data.signedUrl;
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return {
    materials,
    loading,
    uploading,
    uploadMaterial,
    deleteMaterial,
    getDownloadUrl,
    fetchMaterials,
  };
};
