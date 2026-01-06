-- Create study_insights table for storing AI-generated reports
CREATE TABLE public.study_insights (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_study_minutes INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_quizzes_completed INTEGER DEFAULT 0,
  average_quiz_score NUMERIC(5,2) DEFAULT 0,
  strongest_subject TEXT,
  weakest_subject TEXT,
  study_pattern_analysis TEXT,
  improvement_recommendations TEXT[],
  motivation_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.study_insights ENABLE ROW LEVEL SECURITY;

-- Users can only view their own insights
CREATE POLICY "Users can view their own insights"
  ON public.study_insights
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own insights
CREATE POLICY "Users can insert their own insights"
  ON public.study_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own insights
CREATE POLICY "Users can update their own insights"
  ON public.study_insights
  FOR UPDATE
  USING (auth.uid() = user_id);