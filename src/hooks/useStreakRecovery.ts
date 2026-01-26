import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { celebrationService } from '@/services/celebrationService';
import { calculateRecoveryCost } from '@/components/streak/StreakRecoveryDialog';

interface StreakRecoveryState {
  showRecoveryDialog: boolean;
  previousStreak: number;
  currentXP: number;
  isChecking: boolean;
}

export const useStreakRecovery = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<StreakRecoveryState>({
    showRecoveryDialog: false,
    previousStreak: 0,
    currentXP: 0,
    isChecking: true,
  });

  // Check if streak is broken and offer recovery
  const checkStreakStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, isChecking: false }));
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('streak_days, xp_points, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        setState(prev => ({ ...prev, isChecking: false }));
        return;
      }

      const lastUpdate = new Date(profile.updated_at);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

      // Streak is broken if more than 1 day has passed and they had a streak > 1
      const streakIsBroken = diffDays > 1 && (profile.streak_days || 0) > 1;

      if (streakIsBroken) {
        setState({
          showRecoveryDialog: true,
          previousStreak: profile.streak_days || 0,
          currentXP: profile.xp_points || 0,
          isChecking: false,
        });
      } else {
        setState(prev => ({ ...prev, isChecking: false }));
      }
    } catch (error) {
      console.error('Error checking streak status:', error);
      setState(prev => ({ ...prev, isChecking: false }));
    }
  }, []);

  // Recover the streak by spending XP
  const recoverStreak = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const cost = calculateRecoveryCost(state.previousStreak);
      const newXP = state.currentXP - cost;

      if (newXP < 0) {
        throw new Error('Insufficient XP');
      }

      // Update profile: restore streak and deduct XP
      const { error } = await supabase
        .from('user_profiles')
        .update({
          streak_days: state.previousStreak,
          xp_points: newXP,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Record the recovery in history
      await supabase
        .from('streak_recoveries')
        .insert({
          user_id: user.id,
          recovered_streak: state.previousStreak,
          xp_spent: cost,
        });

      // Celebrate the recovery!
      celebrationService.celebrate({ type: 'streak_milestone', streakDays: state.previousStreak });

      toast({
        title: '🔥 Streak Recovered!',
        description: `Your ${state.previousStreak}-day streak is back! Cost: ${cost} XP`,
      });

      // Close dialog and invalidate queries
      setState(prev => ({ ...prev, showRecoveryDialog: false }));
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['streak-recoveries'] });

    } catch (error) {
      console.error('Error recovering streak:', error);
      toast({
        title: 'Recovery Failed',
        description: 'Unable to recover your streak. Please try again.',
        variant: 'destructive',
      });
    }
  }, [state.previousStreak, state.currentXP, toast, queryClient]);

  // Decline recovery and reset streak to 1
  const declineRecovery = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Reset streak to 1 (starting fresh)
      await supabase
        .from('user_profiles')
        .update({
          streak_days: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      toast({
        title: '💪 Fresh Start!',
        description: 'Your new streak begins today. Keep going!',
      });

      setState(prev => ({ ...prev, showRecoveryDialog: false }));
      queryClient.invalidateQueries({ queryKey: ['stats'] });

    } catch (error) {
      console.error('Error declining recovery:', error);
    }
  }, [toast, queryClient]);

  // Close dialog handler
  const closeDialog = useCallback(() => {
    setState(prev => ({ ...prev, showRecoveryDialog: false }));
  }, []);

  // Check streak on mount
  useEffect(() => {
    checkStreakStatus();
  }, [checkStreakStatus]);

  return {
    showRecoveryDialog: state.showRecoveryDialog,
    previousStreak: state.previousStreak,
    currentXP: state.currentXP,
    isChecking: state.isChecking,
    recoverStreak,
    declineRecovery,
    closeDialog,
    checkStreakStatus,
  };
};
