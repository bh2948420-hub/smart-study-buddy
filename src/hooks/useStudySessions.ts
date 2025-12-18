import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StudySession {
  id: number;
  user_id: string;
  task_id: number | null;
  subject: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  created_at: string;
}

export const useStudySessions = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
      
      // Check for active session
      const active = data?.find(s => !s.end_time);
      if (active) setActiveSession(active);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (taskId?: number, subject?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          task_id: taskId || null,
          subject: subject || null,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setActiveSession(data);
      setSessions(prev => [data, ...prev]);
      
      toast({
        title: 'بدأت جلسة الدراسة',
        description: 'حظاً سعيداً في دراستك! 📚',
      });
      
      return data;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    try {
      const endTime = new Date();
      const startTime = new Date(activeSession.start_time);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const { data, error } = await supabase
        .from('study_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', activeSession.id)
        .select()
        .single();

      if (error) throw error;
      
      setActiveSession(null);
      setSessions(prev => prev.map(s => s.id === data.id ? data : s));
      
      toast({
        title: 'انتهت جلسة الدراسة',
        description: `درست لمدة ${durationMinutes} دقيقة. أحسنت! 🎉`,
      });
      
      return data;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  };

  const getTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter(s => {
      const sessionDate = new Date(s.start_time);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });

    const totalMinutes = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    
    return {
      sessionsCount: todaySessions.length,
      totalMinutes,
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
    };
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    activeSession,
    loading,
    startSession,
    endSession,
    getTodayStats,
    fetchSessions,
  };
};
