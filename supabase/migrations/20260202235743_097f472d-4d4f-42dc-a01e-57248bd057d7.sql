-- Add streak_freezes column to user_profiles to track available freezes
ALTER TABLE public.user_profiles 
ADD COLUMN streak_freezes integer NOT NULL DEFAULT 0;

-- Create table to track streak freeze purchases and usage
CREATE TABLE public.streak_freeze_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('purchase', 'used', 'expired')),
  xp_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.streak_freeze_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own freeze history
CREATE POLICY "Users can view their own freeze history"
ON public.streak_freeze_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own freeze records
CREATE POLICY "Users can insert their own freeze history"
ON public.streak_freeze_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);