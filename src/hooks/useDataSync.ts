import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// XP rewards for different actions
export const XP_REWARDS = {
  TASK_COMPLETE: 10,
  QUIZ_COMPLETE: 25,
  QUIZ_PERFECT: 50,
  FOCUS_SESSION: 15,
  DAILY_QUIZ: 20,
  STREAK_BONUS: 5,
};

export const useDataSync = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Award XP and update profile
  const awardXP = useCallback(async (points: number, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('xp_points, level')
        .eq('user_id', user.id)
        .single();

      const currentXP = profile?.xp_points || 0;
      const newXP = currentXP + points;
      const newLevel = Math.floor(newXP / 100) + 1;
      const oldLevel = profile?.level || 1;

      await supabase
        .from('user_profiles')
        .update({
          xp_points: newXP,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Invalidate leaderboard cache
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

      // Level up notification
      if (newLevel > oldLevel) {
        toast({
          title: '🎉 Level Up!',
          description: `You reached level ${newLevel}!`,
        });
      }

      return { newXP, newLevel };
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }, [queryClient, toast]);

  // Update streak and check for bonus
  const updateStreak = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('streak_days, updated_at')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const lastUpdate = new Date(profile.updated_at);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

      let newStreak = profile.streak_days || 0;
      
      if (diffDays === 0) {
        // Already updated today
        return { streak: newStreak, isNew: false };
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak += 1;
        await awardXP(XP_REWARDS.STREAK_BONUS * newStreak, 'Streak bonus');
      } else {
        // Streak broken
        newStreak = 1;
      }

      await supabase
        .from('user_profiles')
        .update({
          streak_days: newStreak,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return { streak: newStreak, isNew: true };
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }, [awardXP]);

  // Sync quiz completion with leaderboard
  const syncQuizResult = useCallback(async (score: number, totalQuestions: number, quizId: number) => {
    try {
      const percentage = (score / totalQuestions) * 100;
      
      // Award XP based on performance
      if (percentage === 100) {
        await awardXP(XP_REWARDS.QUIZ_PERFECT, 'Perfect quiz score');
      } else if (percentage >= 70) {
        await awardXP(XP_REWARDS.QUIZ_COMPLETE, 'Quiz completed');
      } else {
        await awardXP(Math.floor(XP_REWARDS.QUIZ_COMPLETE * (percentage / 100)), 'Quiz attempted');
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      return { xpAwarded: true };
    } catch (error) {
      console.error('Error syncing quiz result:', error);
    }
  }, [awardXP, queryClient]);

  // Sync task completion
  const syncTaskComplete = useCallback(async (taskId: number) => {
    try {
      await awardXP(XP_REWARDS.TASK_COMPLETE, 'Task completed');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      return { xpAwarded: true };
    } catch (error) {
      console.error('Error syncing task completion:', error);
    }
  }, [awardXP, queryClient]);

  // Sync focus session completion
  const syncFocusSession = useCallback(async (durationMinutes: number) => {
    try {
      // Award XP based on duration
      const xpMultiplier = Math.floor(durationMinutes / 25); // Per pomodoro
      const xpToAward = XP_REWARDS.FOCUS_SESSION * Math.max(1, xpMultiplier);
      
      await awardXP(xpToAward, 'Focus session completed');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      return { xpAwarded: xpToAward };
    } catch (error) {
      console.error('Error syncing focus session:', error);
    }
  }, [awardXP, queryClient]);

  // Update streak on mount
  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  return {
    awardXP,
    updateStreak,
    syncQuizResult,
    syncTaskComplete,
    syncFocusSession,
    XP_REWARDS,
  };
};
