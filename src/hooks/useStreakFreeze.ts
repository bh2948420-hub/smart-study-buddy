import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const FREEZE_COST = 100; // XP cost per freeze

interface StreakFreezeState {
  freezesAvailable: number;
  currentXP: number;
  loading: boolean;
}

export const useStreakFreeze = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<StreakFreezeState>({
    freezesAvailable: 0,
    currentXP: 0,
    loading: true,
  });

  const fetchFreezeStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('streak_freezes, xp_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setState({
          freezesAvailable: profile.streak_freezes || 0,
          currentXP: profile.xp_points || 0,
          loading: false,
        });
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching freeze status:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const purchaseFreeze = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (state.currentXP < FREEZE_COST) {
        toast({
          title: '❄️ Not Enough XP',
          description: `You need ${FREEZE_COST} XP to purchase a streak freeze. You have ${state.currentXP} XP.`,
          variant: 'destructive',
        });
        return false;
      }

      const newXP = state.currentXP - FREEZE_COST;
      const newFreezes = state.freezesAvailable + 1;

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          streak_freezes: newFreezes,
          xp_points: newXP,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record the purchase
      const { error: historyError } = await supabase
        .from('streak_freeze_history')
        .insert({
          user_id: user.id,
          action_type: 'purchase',
          xp_spent: FREEZE_COST,
        });

      if (historyError) console.error('Error recording purchase:', historyError);

      // Update local state
      setState(prev => ({
        ...prev,
        freezesAvailable: newFreezes,
        currentXP: newXP,
      }));

      toast({
        title: '❄️ Streak Freeze Purchased!',
        description: `You now have ${newFreezes} freeze${newFreezes > 1 ? 's' : ''} available.`,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

      return true;
    } catch (error) {
      console.error('Error purchasing freeze:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Unable to purchase streak freeze. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [state.currentXP, state.freezesAvailable, toast, queryClient]);

  const useFreeze = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (state.freezesAvailable < 1) {
        return false;
      }

      const newFreezes = state.freezesAvailable - 1;

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          streak_freezes: newFreezes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record the usage
      const { error: historyError } = await supabase
        .from('streak_freeze_history')
        .insert({
          user_id: user.id,
          action_type: 'used',
          xp_spent: 0,
        });

      if (historyError) console.error('Error recording usage:', historyError);

      // Update local state
      setState(prev => ({
        ...prev,
        freezesAvailable: newFreezes,
      }));

      toast({
        title: '❄️ Streak Freeze Used!',
        description: 'Your streak has been protected for today.',
      });

      return true;
    } catch (error) {
      console.error('Error using freeze:', error);
      return false;
    }
  }, [state.freezesAvailable, toast]);

  useEffect(() => {
    fetchFreezeStatus();
  }, [fetchFreezeStatus]);

  return {
    freezesAvailable: state.freezesAvailable,
    currentXP: state.currentXP,
    loading: state.loading,
    freezeCost: FREEZE_COST,
    canAfford: state.currentXP >= FREEZE_COST,
    purchaseFreeze,
    useFreeze,
    refetch: fetchFreezeStatus,
  };
};
