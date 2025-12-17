import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

const AddTestTaskButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddTask = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const testTask = {
        user_id: user.id,
        title: `مهمة تجريبية ${Date.now()}`,
        description: 'هذه مهمة تجريبية للاختبار',
        due_date: new Date().toISOString(),
        priority: 'medium',
        completed: false,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([testTask])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "تم بنجاح! ✓",
        description: `تمت إضافة المهمة: ${testTask.title}`,
      });
      
      console.log('Task added:', data);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المهمة",
        variant: "destructive",
      });
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleAddTask} 
      disabled={loading}
      variant="outline"
      className="gap-2 w-full justify-start"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      {loading ? 'جاري الإضافة...' : 'إضافة مهمة تجريبية'}
    </Button>
  );
};

export default AddTestTaskButton;
