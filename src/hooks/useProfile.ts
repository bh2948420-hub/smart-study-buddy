import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  study_goal_minutes: number;
  pomodoro_duration: number;
  break_duration: number;
  xp_points: number;
  level: number;
  streak_days: number;
  notifications_enabled: boolean;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Create profile if doesn't exist
        await createProfile(user.id);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as UserProfile);
      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث الملف الشخصي',
      });

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث الملف الشخصي',
        variant: 'destructive',
      });
    }
  };

  const addXP = async (points: number) => {
    if (!profile) return;

    const newXP = profile.xp_points + points;
    const newLevel = Math.floor(newXP / 100) + 1;

    await updateProfile({
      xp_points: newXP,
      level: newLevel,
    });

    if (newLevel > profile.level) {
      toast({
        title: '🎉 ترقية!',
        description: `وصلت للمستوى ${newLevel}`,
      });
    }
  };

  const incrementStreak = async () => {
    if (!profile) return;
    await updateProfile({
      streak_days: profile.streak_days + 1,
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    updateProfile,
    addXP,
    incrementStreak,
    refetch: fetchProfile,
  };
};
