import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScheduleItem {
  id: number;
  user_id: string;
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classroom: string | null;
  notes: string | null;
  created_at: string;
}

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const useSchedule = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_schedule')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedule((data as ScheduleItem[]) || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const addScheduleItem = async (item: Omit<ScheduleItem, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('study_schedule')
        .insert({
          user_id: user.id,
          ...item,
        })
        .select()
        .single();

      if (error) throw error;

      setSchedule(prev => [...prev, data as ScheduleItem].sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.start_time.localeCompare(b.start_time);
      }));

      toast({
        title: 'تمت الإضافة',
        description: 'تمت إضافة الحصة للجدول',
      });

      return data;
    } catch (error) {
      console.error('Error adding schedule item:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إضافة الحصة',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteScheduleItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('study_schedule')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSchedule(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الحصة من الجدول',
      });
    } catch (error) {
      console.error('Error deleting schedule item:', error);
    }
  };

  const getTodaySchedule = () => {
    const today = new Date().getDay();
    return schedule.filter(item => item.day_of_week === today);
  };

  const getCurrentClass = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.getDay();

    return schedule.find(item => 
      item.day_of_week === today &&
      item.start_time <= currentTime &&
      item.end_time >= currentTime
    );
  };

  const getNextClass = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.getDay();

    // First check today's remaining classes
    const todayNext = schedule.find(item =>
      item.day_of_week === today && item.start_time > currentTime
    );

    if (todayNext) return todayNext;

    // Then check upcoming days
    for (let i = 1; i <= 7; i++) {
      const checkDay = (today + i) % 7;
      const dayClasses = schedule.filter(item => item.day_of_week === checkDay);
      if (dayClasses.length > 0) {
        return dayClasses[0];
      }
    }

    return null;
  };

  const getDayName = (dayIndex: number, language: 'ar' | 'en' = 'ar') => {
    return language === 'ar' ? DAYS_AR[dayIndex] : DAYS_EN[dayIndex];
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return {
    schedule,
    loading,
    addScheduleItem,
    deleteScheduleItem,
    getTodaySchedule,
    getCurrentClass,
    getNextClass,
    getDayName,
    refetch: fetchSchedule,
  };
};
