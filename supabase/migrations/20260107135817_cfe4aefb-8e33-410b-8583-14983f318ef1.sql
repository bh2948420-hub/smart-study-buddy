-- Create weekly challenges table
CREATE TABLE public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'quizzes', 'study_time', 'tasks', 'streak'
  target_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  icon TEXT NOT NULL DEFAULT '🎯',
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user challenge progress table
CREATE TABLE public.user_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create daily quiz attempts table
CREATE TABLE public.daily_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 5,
  time_spent_seconds INTEGER,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quiz_date)
);

-- Enable RLS
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Challenges are viewable by everyone
CREATE POLICY "Challenges are viewable by everyone" 
ON public.weekly_challenges FOR SELECT USING (true);

-- User challenge progress policies
CREATE POLICY "Users can view their own challenge progress" 
ON public.user_challenge_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress" 
ON public.user_challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress" 
ON public.user_challenge_progress FOR UPDATE USING (auth.uid() = user_id);

-- Daily quiz attempts policies
CREATE POLICY "Users can view their own daily quiz attempts" 
ON public.daily_quiz_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily quiz attempts" 
ON public.daily_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert some default weekly challenges for current week
INSERT INTO public.weekly_challenges (title, title_ar, description, description_ar, challenge_type, target_value, xp_reward, icon, week_start, week_end)
VALUES 
  ('Quiz Champion', 'بطل الاختبارات', 'Complete 5 quizzes this week', 'أكمل 5 اختبارات هذا الأسبوع', 'quizzes', 5, 150, '📝', date_trunc('week', CURRENT_DATE)::date, (date_trunc('week', CURRENT_DATE) + interval '6 days')::date),
  ('Study Marathon', 'ماراثون الدراسة', 'Study for 10 hours this week', 'ادرس لمدة 10 ساعات هذا الأسبوع', 'study_time', 600, 200, '⏱️', date_trunc('week', CURRENT_DATE)::date, (date_trunc('week', CURRENT_DATE) + interval '6 days')::date),
  ('Task Master', 'سيد المهام', 'Complete 10 tasks this week', 'أكمل 10 مهام هذا الأسبوع', 'tasks', 10, 100, '✅', date_trunc('week', CURRENT_DATE)::date, (date_trunc('week', CURRENT_DATE) + interval '6 days')::date),
  ('Daily Learner', 'المتعلم اليومي', 'Take the daily quiz 5 days', 'أجب على الاختبار اليومي 5 أيام', 'daily_quiz', 5, 175, '🌟', date_trunc('week', CURRENT_DATE)::date, (date_trunc('week', CURRENT_DATE) + interval '6 days')::date);