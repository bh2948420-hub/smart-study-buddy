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

      // Get random 5 questions from user's quizzes (correct_answer stays server-side)
      const { data: quizQuestions, error } = await supabase
        .from('quiz_questions')
        .select(`
          id,
          question_text,
          options,
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
        correct_answer: '', // not exposed until after grading
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
    _clientScore: number,
    _totalQuestions: number,
    timeSpentSeconds: number,
    questionIds?: number[],
    answers?: string[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (!questionIds || !answers) {
        console.error('submitDailyQuiz requires questionIds and answers arrays');
        return null;
      }

      const { data, error } = await supabase.rpc('submit_daily_quiz', {
        p_question_ids: questionIds,
        p_answers: answers,
        p_time_spent: timeSpentSeconds,
      });

      if (error) throw error;

      const result = data as any;
      const attempt = {
        id: result.attempt_id,
        user_id: user.id,
        quiz_date: new Date().toISOString().split('T')[0],
        score: result.score,
        total_questions: result.total,
        time_spent_seconds: timeSpentSeconds,
        xp_earned: result.xp_earned,
      } as DailyQuizAttempt;

      setTodayAttempt(attempt);

      toast({
        title: `${result.score}/${result.total} Correct! 🎯`,
        description: `You earned ${result.xp_earned} bonus XP!`,
      });

      return result;
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
