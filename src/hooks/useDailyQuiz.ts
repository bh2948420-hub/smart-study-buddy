import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DailyQuestion {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  subject: string | null;
}

export interface DailyQuizAttempt {
  id: string;
  user_id: string;
  quiz_date: string;
  score: number;
  total_questions: number;
  time_spent_seconds: number | null;
  xp_earned: number;
}

export const useDailyQuiz = () => {
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [todayAttempt, setTodayAttempt] = useState<DailyQuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTodayAttempt = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('quiz_date', today)
        .maybeSingle();

      if (error) throw error;
      setTodayAttempt(data);
      return data;
    } catch (error) {
      console.error('Error fetching today attempt:', error);
      return null;
    }
  }, []);

  const fetchRandomQuestions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get random 5 questions from user's quizzes
      const { data: quizQuestions, error } = await supabase
        .from('quiz_questions')
        .select(`
          id,
          question_text,
          options,
          correct_answer,
          quizzes!inner(user_id, subject)
        `)
        .eq('quizzes.user_id', user.id)
        .limit(50);

      if (error) throw error;

      if (!quizQuestions || quizQuestions.length === 0) {
        setQuestions([]);
        return;
      }

      // Shuffle and pick 5 random questions
      const shuffled = quizQuestions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 5).map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer,
        subject: q.quizzes?.subject || null,
      }));

      setQuestions(selected);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitDailyQuiz = async (
    score: number, 
    totalQuestions: number, 
    timeSpentSeconds: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Calculate XP based on performance (10-50 XP)
      const percentage = (score / totalQuestions) * 100;
      let xpEarned = 10; // Base XP for attempting
      if (percentage >= 80) xpEarned = 50;
      else if (percentage >= 60) xpEarned = 35;
      else if (percentage >= 40) xpEarned = 25;
      else xpEarned = 15;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_date: today,
          score,
          total_questions: totalQuestions,
          time_spent_seconds: timeSpentSeconds,
          xp_earned: xpEarned,
        })
        .select()
        .single();

      if (error) throw error;

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
          xp_points: currentXP + xpEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      setTodayAttempt(data);

      toast({
        title: `${score}/${totalQuestions} Correct! 🎯`,
        description: `You earned ${xpEarned} bonus XP!`,
      });

      return data;
    } catch (error) {
      console.error('Error submitting daily quiz:', error);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      const attempt = await fetchTodayAttempt();
      if (!attempt) {
        await fetchRandomQuestions();
      }
      setLoading(false);
    };
    init();
  }, [fetchTodayAttempt, fetchRandomQuestions]);

  return {
    questions,
    todayAttempt,
    loading,
    hasCompletedToday: !!todayAttempt,
    submitDailyQuiz,
    fetchRandomQuestions,
  };
};
