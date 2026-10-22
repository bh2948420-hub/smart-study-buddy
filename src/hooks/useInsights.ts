import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';


export interface StudyInsight {
  id: number;
  user_id: string;
  week_start: string;
  week_end: string;
  total_study_minutes: number;
  total_tasks_completed: number;
  total_quizzes_completed: number;
  average_quiz_score: number;
  strongest_subject: string | null;
  weakest_subject: string | null;
  study_pattern_analysis: string | null;
  improvement_recommendations: string[] | null;
  motivation_message: string | null;
  created_at: string;
}

export const useInsights = () => {
  const [insights, setInsights] = useState<StudyInsight[]>([]);
  const [currentInsight, setCurrentInsight] = useState<StudyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();


  const fetchInsights = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Type assertion since we know the structure matches
      const typedData = data as unknown as StudyInsight[];
      setInsights(typedData);
      if (typedData && typedData.length > 0) {
        setCurrentInsight(typedData[0]);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateInsight = useCallback(async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ language }),

        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate insights');
      }

      const data = await response.json();
      
      toast({
        title: language === 'ar' ? "تم إنشاء التقرير!" : "Insights Generated!",
        description: language === 'ar' ? "تقريرك الأسبوعي جاهز." : "Your weekly study report is ready.",
      });


      await fetchInsights();
      return data.insight;
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message || (language === 'ar' ? "فشل إنشاء التقرير" : "Failed to generate insights"),
        variant: "destructive",
      });

      throw error;
    } finally {
      setGenerating(false);
    }
  }, [fetchInsights, toast]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    currentInsight,
    loading,
    generating,
    generateInsight,
    refetch: fetchInsights,
  };
};
