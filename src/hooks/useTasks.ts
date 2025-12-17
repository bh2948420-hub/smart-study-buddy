import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
}

export interface NewTask {
  title: string;
  description?: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب المهام',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: NewTask) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...task, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [...prev, data as Task]);
      toast({
        title: 'تم بنجاح',
        description: 'تمت إضافة المهمة',
      });
      return data;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إضافة المهمة',
        variant: 'destructive',
      });
      return null;
    }
  };

  const toggleTask = async (id: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث المهمة',
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المهمة',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف المهمة',
        variant: 'destructive',
      });
    }
  };

  const updateTask = async (id: number, updates: Partial<NewTask>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates } : t))
      );
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث المهمة',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث المهمة',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    fetchTasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
  };
};
