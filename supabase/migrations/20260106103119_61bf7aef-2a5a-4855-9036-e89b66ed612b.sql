-- Create a function to get leaderboard data (exposes only public ranking info)
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  time_filter TEXT DEFAULT 'all',
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  avatar_url TEXT,
  xp_points INTEGER,
  level INTEGER,
  streak_days INTEGER,
  quizzes_completed BIGINT,
  study_hours NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine the start date based on filter
  IF time_filter = 'weekly' THEN
    start_date := NOW() - INTERVAL '7 days';
  ELSIF time_filter = 'monthly' THEN
    start_date := NOW() - INTERVAL '30 days';
  ELSE
    start_date := '1970-01-01'::TIMESTAMP WITH TIME ZONE;
  END IF;

  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY COALESCE(up.xp_points, 0) DESC, COALESCE(up.level, 1) DESC) as rank,
    COALESCE(up.display_name, 'Student') as display_name,
    up.avatar_url,
    COALESCE(up.xp_points, 0) as xp_points,
    COALESCE(up.level, 1) as level,
    COALESCE(up.streak_days, 0) as streak_days,
    COALESCE(quiz_counts.count, 0) as quizzes_completed,
    COALESCE(ROUND(study_times.total_minutes / 60.0, 1), 0) as study_hours
  FROM user_profiles up
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM quiz_results
    WHERE completed_at >= start_date
    GROUP BY user_id
  ) quiz_counts ON up.user_id = quiz_counts.user_id
  LEFT JOIN (
    SELECT user_id, SUM(COALESCE(duration_minutes, 0)) as total_minutes
    FROM study_sessions
    WHERE created_at >= start_date
    GROUP BY user_id
  ) study_times ON up.user_id = study_times.user_id
  ORDER BY COALESCE(up.xp_points, 0) DESC, COALESCE(up.level, 1) DESC
  LIMIT limit_count;
END;
$$;