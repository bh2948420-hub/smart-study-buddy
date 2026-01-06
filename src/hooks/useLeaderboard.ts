import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  avatar_url: string | null;
  xp_points: number;
  level: number;
  streak_days: number;
  quizzes_completed: number;
  study_hours: number;
}

export type TimeFilter = 'all' | 'weekly' | 'monthly';

export function useLeaderboard(timeFilter: TimeFilter = 'all') {
  return useQuery({
    queryKey: ['leaderboard', timeFilter],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        time_filter: timeFilter,
        limit_count: 50
      });

      if (error) {
        console.error('Leaderboard error:', error);
        throw error;
      }

      return (data || []).map((entry: any) => ({
        rank: Number(entry.rank),
        display_name: entry.display_name || 'Student',
        avatar_url: entry.avatar_url,
        xp_points: Number(entry.xp_points) || 0,
        level: Number(entry.level) || 1,
        streak_days: Number(entry.streak_days) || 0,
        quizzes_completed: Number(entry.quizzes_completed) || 0,
        study_hours: Number(entry.study_hours) || 0,
      }));
    },
  });
}
