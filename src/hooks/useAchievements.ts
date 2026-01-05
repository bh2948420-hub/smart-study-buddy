import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Achievement {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  points: number;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { language } = useLanguage();

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');

      if (achievementsError) throw achievementsError;
      setAchievements((allAchievements as Achievement[]) || []);

      if (user) {
        // Fetch user's earned achievements
        const { data: earned, error: earnedError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id);

        if (earnedError) throw earnedError;
        setUserAchievements((earned as UserAchievement[]) || []);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndAwardAchievements = async (stats: {
    studyHours: number;
    quizzesCompleted: number;
    streakDays: number;
    bestQuizScore: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const earnedIds = userAchievements.map(ua => ua.achievement_id);
      const newlyEarned: Achievement[] = [];

      for (const achievement of achievements) {
        if (earnedIds.includes(achievement.id)) continue;

        let qualified = false;
        switch (achievement.requirement_type) {
          case 'study_hours':
            qualified = stats.studyHours >= achievement.requirement_value;
            break;
          case 'quizzes_completed':
            qualified = stats.quizzesCompleted >= achievement.requirement_value;
            break;
          case 'streak_days':
            qualified = stats.streakDays >= achievement.requirement_value;
            break;
          case 'quiz_score':
            qualified = stats.bestQuizScore >= achievement.requirement_value;
            break;
        }

        if (qualified) {
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
            });

          if (!error) {
            newlyEarned.push(achievement);
          }
        }
      }

      if (newlyEarned.length > 0) {
        for (const achievement of newlyEarned) {
          toast({
            title: `${achievement.icon} ${language === 'ar' ? 'إنجاز جديد!' : 'New Achievement!'}`,
            description: language === 'ar' ? achievement.name_ar : achievement.name,
          });
        }
        await fetchAchievements();
      }

      return newlyEarned;
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const getAchievementProgress = (achievement: Achievement, stats: {
    studyHours: number;
    quizzesCompleted: number;
    streakDays: number;
    bestQuizScore: number;
  }) => {
    let current = 0;
    switch (achievement.requirement_type) {
      case 'study_hours':
        current = stats.studyHours;
        break;
      case 'quizzes_completed':
        current = stats.quizzesCompleted;
        break;
      case 'streak_days':
        current = stats.streakDays;
        break;
      case 'quiz_score':
        current = stats.bestQuizScore;
        break;
    }
    return Math.min(100, (current / achievement.requirement_value) * 100);
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  return {
    achievements,
    userAchievements,
    loading,
    checkAndAwardAchievements,
    getAchievementProgress,
    refetch: fetchAchievements,
  };
};
