
-- Challenge rooms for live quiz battles
CREATE TABLE public.challenge_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_user_id UUID NOT NULL,
  guest_user_id UUID,
  quiz_id BIGINT REFERENCES public.quizzes(id),
  status TEXT NOT NULL DEFAULT 'waiting',
  host_score INTEGER NOT NULL DEFAULT 0,
  guest_score INTEGER NOT NULL DEFAULT 0,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  host_display_name TEXT,
  guest_display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Track individual answers
CREATE TABLE public.challenge_room_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.challenge_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_index INTEGER NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id, question_index)
);

-- Enable RLS
ALTER TABLE public.challenge_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_room_answers ENABLE ROW LEVEL SECURITY;

-- RLS for challenge_rooms
CREATE POLICY "Users can view rooms they participate in"
ON public.challenge_rooms FOR SELECT
TO authenticated
USING (host_user_id = auth.uid() OR guest_user_id = auth.uid() OR status = 'waiting');

CREATE POLICY "Users can create rooms"
ON public.challenge_rooms FOR INSERT
TO authenticated
WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "Participants can update rooms"
ON public.challenge_rooms FOR UPDATE
TO authenticated
USING (host_user_id = auth.uid() OR guest_user_id = auth.uid());

-- RLS for answers
CREATE POLICY "Users can view answers in their rooms"
ON public.challenge_room_answers FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.challenge_rooms
  WHERE id = room_id AND (host_user_id = auth.uid() OR guest_user_id = auth.uid())
));

CREATE POLICY "Users can submit their own answers"
ON public.challenge_room_answers FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_room_answers;
