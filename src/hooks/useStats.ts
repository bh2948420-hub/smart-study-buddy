import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Stats {
  totalStudyMinutes: number;
  totalStudyHours: number;
  todayStudyMinutes: number;
  weeklyStudyMinutes: number;
  completedQuizzes: number;
  quizzesCompleted: number; // Alias
  averageScore: number;
  streakDays: number;
  totalSessions: number;
}

export const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalStudyMinutes: 0,
    totalStudyHours: 0,
    todayStudyMinutes: 0,
    weeklyStudyMinutes: 0,
    completedQuizzes: 0,
    quizzesCompleted: 0,
    averageScore: 0,
    streakDays: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fetch study sessions
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id);

      // Fetch quiz results
      const { data: quizResults } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id);

      // Fetch user profile for streak
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('streak_days')
        .eq('user_id', user.id)
        .single();

      if (sessions) {
        const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
        
        const todaySessions = sessions.filter(s => {
          const sessionDate = new Date(s.start_time);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === today.getTime();
        });
        const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

        const weeklySessions = sessions.filter(s => {
          const sessionDate = new Date(s.start_time);
          return sessionDate >= weekAgo;
        });
        const weeklyMinutes = weeklySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

        setStats(prev => ({
          ...prev,
          totalStudyMinutes: totalMinutes,
          totalStudyHours: Math.round(totalMinutes / 60 * 10) / 10,
          todayStudyMinutes: todayMinutes,
          weeklyStudyMinutes: weeklyMinutes,
          totalSessions: sessions.length,
        }));
      }

      if (quizResults && quizResults.length > 0) {
        const avgScore = quizResults.reduce((acc, r) => acc + Number(r.percentage), 0) / quizResults.length;
        setStats(prev => ({
          ...prev,
          completedQuizzes: quizResults.length,
          quizzesCompleted: quizResults.length,
          averageScore: Math.round(avgScore),
        }));
      }

      if (profile) {
        setStats(prev => ({
          ...prev,
          streakDays: profile.streak_days || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
};
