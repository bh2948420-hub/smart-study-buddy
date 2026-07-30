import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { celebrationService } from '@/services/celebrationService';

export interface Quiz {
  id: number;
  user_id: string;
  material_id: number | null;
  title: string;
  subject: string | null;
  description: string | null;
  difficulty: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank';
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  order_index: number;
}

export interface QuizResult {
  id: number;
  user_id: string;
  quiz_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  answers: { question_id: number; answer: string; correct: boolean }[];
  time_spent_seconds: number | null;
  completed_at: string;
}

interface GeneratedQuestion {
  question_type: 'multiple_choice' | 'true_false';
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  topic?: string;
  skill?: string;
}


export const useQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchQuizzes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizWithQuestions = async (quizId: number) => {
    try {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();

      if (quizError) throw quizError;
      if (!quiz) return null;

      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('id, quiz_id, question_type, question_text, options, order_index')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (questionsError) throw questionsError;

      // correct_answer/explanation are not exposed to the client; filled in after grading
      const safeQuestions = (questions || []).map((q: any) => ({
        ...q,
        correct_answer: '',
        explanation: null,
      }));

      return { quiz, questions: safeQuestions };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return null;
    }
  };


  const generateQuiz = async (
    content: string,
    title: string,
    subject: string,
    difficulty: string = 'medium',
    materialId?: number,
    questionCount: number = 10, // Default to 10 questions as requested
    language: 'auto' | 'ar' | 'en' = 'auto' // 'auto' = follow the material's own language
  ) => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call AI to generate questions
      const response = await supabase.functions.invoke('generate-quiz', {
        body: { content, title, subject, difficulty, questionCount, language }
      });

      if (response.error) throw response.error;
      
      const generatedData = response.data as { questions: GeneratedQuestion[]; language?: 'ar' | 'en' };
      if (!generatedData?.questions?.length) {
        throw new Error('Failed to generate questions');
      }
      const quizLang = generatedData.language || 'ar';

      // Create quiz in database
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          material_id: materialId || null,
          title,
          subject,
          difficulty,
          description: quizLang === 'en'
            ? `AI-generated quiz with ${generatedData.questions.length} professional questions`
            : `اختبار مولد تلقائياً يحتوي على ${generatedData.questions.length} سؤال`
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Insert questions
      const questionsToInsert = generatedData.questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options || (q.question_type === 'true_false' ? (quizLang === 'en' ? ['True', 'False'] : ['صحيح', 'خطأ']) : null),
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        order_index: index
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      // Archive the generated questions in the reusable question bank
      const bankRows = generatedData.questions.map((q) => ({
        user_id: user.id,
        source_quiz_id: quiz.id,
        material_id: materialId || null,
        subject: subject || null,
        topic: q.topic || null,
        skill: q.skill || null,
        difficulty,
        quiz_language: quizLang,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options || (q.question_type === 'true_false' ? (quizLang === 'en' ? ['True', 'False'] : ['صحيح', 'خطأ']) : null),
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
      }));

      const { error: bankError } = await supabase.from('question_bank').insert(bankRows);
      if (bankError) console.error('Question bank save failed:', bankError);

      setQuizzes(prev => [quiz, ...prev]);

      
      toast({
        title: 'تم إنشاء الاختبار',
        description: `تم إنشاء اختبار "${title}" بنجاح مع ${generatedData.questions.length} سؤال`,
      });

      return quiz;
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: 'خطأ في إنشاء الاختبار',
        description: 'فشل في إنشاء الاختبار، حاول مرة أخرى',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const submitQuizResult = async (
    quizId: number,
    answers: { question_id: number; answer: string; correct: boolean }[],
    timeSpentSeconds?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build answer map for server-side grading
      const answerMap: Record<string, string> = {};
      answers.forEach(a => { answerMap[String(a.question_id)] = a.answer; });

      const { data, error } = await supabase.rpc('grade_quiz', {
        p_quiz_id: quizId,
        p_answers: answerMap,
        p_time_spent: timeSpentSeconds || null,
      });

      if (error) throw error;

      const graded = data as any;
      const score = graded?.score ?? 0;
      const total = graded?.total ?? answers.length;
      const percentage = graded?.percentage ?? 0;

      // Celebrate perfect score
      if (percentage === 100) {
        celebrationService.celebrate({ type: 'perfect_score' });
      }

      toast({
        title: 'تم حفظ النتيجة',
        description: `حصلت على ${score} من ${total} (${Number(percentage).toFixed(0)}%)`,
      });

      return graded;
    } catch (error) {
      console.error('Error submitting result:', error);
      toast({
        title: 'خطأ في حفظ النتيجة',
        description: 'فشل في حفظ نتيجة الاختبار',
        variant: 'destructive',
      });
      throw error;
    }
  };


  const fetchQuizResults = async (quizId?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (quizId) {
        query = query.eq('quiz_id', quizId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching results:', error);
      return [];
    }
  };

  const deleteQuiz = async (quizId: number) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      toast({
        title: 'تم حذف الاختبار',
        description: 'تم حذف الاختبار بنجاح',
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'فشل في حذف الاختبار',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  return {
    quizzes,
    loading,
    generating,
    fetchQuizzes,
    fetchQuizWithQuestions,
    generateQuiz,
    submitQuizResult,
    fetchQuizResults,
    deleteQuiz,
  };
};
