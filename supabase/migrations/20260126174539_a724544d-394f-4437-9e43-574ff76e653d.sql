-- Create table to track streak recovery history
CREATE TABLE public.streak_recoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recovered_streak INTEGER NOT NULL,
  xp_spent INTEGER NOT NULL,
  recovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.streak_recoveries ENABLE ROW LEVEL SECURITY;

-- Users can view their own recovery history
CREATE POLICY "Users can view their own streak recoveries"
ON public.streak_recoveries
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own recovery records
CREATE POLICY "Users can insert their own streak recoveries"
ON public.streak_recoveries
FOR INSERT
WITH CHECK (auth.uid() = user_id);