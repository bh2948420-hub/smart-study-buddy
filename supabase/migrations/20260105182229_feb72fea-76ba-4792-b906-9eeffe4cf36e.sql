-- Add achievements and badges table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  icon TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  requirement_type TEXT NOT NULL, -- 'study_hours', 'quizzes_completed', 'streak_days', 'quiz_score'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by everyone
CREATE POLICY "Achievements are viewable by everyone" 
ON public.achievements 
FOR SELECT 
USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, name_ar, description, description_ar, icon, points, requirement_type, requirement_value) VALUES
('First Steps', 'الخطوة الأولى', 'Complete your first study session', 'أكمل أول جلسة دراسية', '🎯', 10, 'study_hours', 1),
('Quiz Master', 'سيد الاختبارات', 'Complete 5 quizzes', 'أكمل 5 اختبارات', '📝', 25, 'quizzes_completed', 5),
('Study Champion', 'بطل الدراسة', 'Study for 10 hours', 'ادرس لمدة 10 ساعات', '🏆', 50, 'study_hours', 10),
('Perfect Score', 'درجة كاملة', 'Score 100% on a quiz', 'احصل على 100% في اختبار', '⭐', 30, 'quiz_score', 100),
('Week Warrior', 'محارب الأسبوع', 'Maintain 7-day streak', 'حافظ على سلسلة 7 أيام', '🔥', 40, 'streak_days', 7),
('Dedicated Learner', 'متعلم مجتهد', 'Complete 10 quizzes', 'أكمل 10 اختبارات', '📚', 50, 'quizzes_completed', 10),
('Month Master', 'سيد الشهر', 'Maintain 30-day streak', 'حافظ على سلسلة 30 يوماً', '👑', 100, 'streak_days', 30);

-- Add study reminder settings to user_profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'reminder_enabled') THEN
    ALTER TABLE public.user_profiles ADD COLUMN reminder_enabled BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'reminder_time') THEN
    ALTER TABLE public.user_profiles ADD COLUMN reminder_time TIME DEFAULT '18:00';
  END IF;
END $$;