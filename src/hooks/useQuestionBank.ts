import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BankQuestion {
  id: string;
  user_id: string;
  source_quiz_id: number | null;
  material_id: number | null;
  subject: string | null;
  topic: string | null;
  skill: string | null;
  difficulty: string;
  quiz_language: string;
  question_type: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  times_used: number;
  is_favorite: boolean;
  created_at: string;
}

export const useQuestionBank = () => {
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchQuestions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setQuestions([]); return; }

      const { data, error } = await supabase
        .from('question_bank')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions((data || []) as unknown as BankQuestion[]);
    } catch (error) {
      console.error('Error fetching question bank:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = async (id: string, value: boolean) => {
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, is_favorite: value } : q)));
    const { error } = await supabase
      .from('question_bank')
      .update({ is_favorite: value })
      .eq('id', id);
    if (error) {
      console.error(error);
      setQuestions(prev => prev.map(q => (q.id === id ? { ...q, is_favorite: !value } : q)));
    }
  };

  const deleteQuestion = async (id: string) => {
    const prev = questions;
    setQuestions(p => p.filter(q => q.id !== id));
    const { error } = await supabase.from('question_bank').delete().eq('id', id);
    if (error) {
      console.error(error);
      setQuestions(prev);
    }
  };

  const createQuizFromBank = async (title: string, subject: string | null, ids: string[]) => {
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_quiz_from_bank', {
        p_title: title,
        p_subject: subject,
        p_question_ids: ids,
      });
      if (error) throw error;
      await fetchQuestions();
      return data as unknown as number;
    } catch (error) {
      console.error('Error creating quiz from bank:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الاختبار من بنك الأسئلة',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  return { questions, loading, creating, fetchQuestions, toggleFavorite, deleteQuestion, createQuizFromBank };
};
