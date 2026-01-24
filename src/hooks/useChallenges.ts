import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { celebrationService } from '@/services/celebrationService';

export interface WeeklyChallenge {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  icon: string;
  week_start: string;
  week_end: string;
}

export interface ChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_value: number;
  completed: boolean;
  completed_at: string | null;
  xp_claimed: boolean;
}

export interface ChallengeWithProgress extends WeeklyChallenge {
  progress: ChallengeProgress | null;
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChallenges = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current week's challenges
      const today = new Date().toISOString().split('T')[0];
      
      const { data: challengesData, error: challengesError } = await supabase
        .from('weekly_challenges')
        .select('*')
        .lte('week_start', today)
        .gte('week_end', today);

      if (challengesError) throw challengesError;

      // Get user's progress for these challenges
      const { data: progressData, error: progressError } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Combine challenges with progress
      const combined = (challengesData || []).map(challenge => ({
        ...challenge,
        progress: progressData?.find(p => p.challenge_id === challenge.id) || null,
      }));

      setChallenges(combined);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeProgress = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_challenge_progress')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          current_value: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initializing progress:', error);
      return null;
    }
  };

  const updateProgress = async (challengeId: string, increment: number = 1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      let progress = challenge.progress;
      
      // Initialize progress if not exists
      if (!progress) {
        progress = await initializeProgress(challengeId);
        if (!progress) return;
      }

      if (progress.completed) return; // Already completed

      const newValue = progress.current_value + increment;
      const isCompleted = newValue >= challenge.target_value;

      const { error } = await supabase
        .from('user_challenge_progress')
        .update({
          current_value: newValue,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id);

      if (error) throw error;

      if (isCompleted) {
        celebrationService.celebrate({ type: 'challenge_complete' });
        toast({
          title: '🎉 Challenge Completed!',
          description: `You earned ${challenge.xp_reward} XP!`,
        });
      }

      await fetchChallenges();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const claimXP = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge?.progress?.completed || challenge.progress.xp_claimed) return;

      // Mark XP as claimed
      await supabase
        .from('user_challenge_progress')
        .update({ xp_claimed: true })
        .eq('id', challenge.progress.id);

      // Update user XP
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('xp_points')
        .eq('user_id', user.id)
        .single();

      const currentXP = profile?.xp_points || 0;
      
      await supabase
        .from('user_profiles')
        .update({ 
          xp_points: currentXP + challenge.xp_reward,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      toast({
        title: '✨ XP Claimed!',
        description: `+${challenge.xp_reward} XP added to your profile!`,
      });

      await fetchChallenges();
    } catch (error) {
      console.error('Error claiming XP:', error);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return {
    challenges,
    loading,
    updateProgress,
    claimXP,
    fetchChallenges,
  };
};
