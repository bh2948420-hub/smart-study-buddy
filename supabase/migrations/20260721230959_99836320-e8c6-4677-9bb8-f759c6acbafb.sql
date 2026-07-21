
CREATE TABLE public.transfer_question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id bigint NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  user_answer text,
  is_correct boolean,
  explanation text,
  topic text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.transfer_question_attempts TO authenticated;
GRANT ALL ON public.transfer_question_attempts TO service_role;

ALTER TABLE public.transfer_question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own transfer attempts"
  ON public.transfer_question_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users update own transfer attempts (no correct_answer visible)"
  ON public.transfer_question_attempts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Server-side grading function: grades and records the answer, returns verdict
CREATE OR REPLACE FUNCTION public.grade_transfer_question(
  p_attempt_id uuid,
  p_answer text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_attempt record;
  v_is_correct boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_attempt FROM public.transfer_question_attempts
    WHERE id = p_attempt_id AND user_id = v_user_id;
  IF v_attempt IS NULL THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF v_attempt.user_answer IS NOT NULL THEN
    RAISE EXCEPTION 'Already answered';
  END IF;

  v_is_correct := (COALESCE(p_answer,'') = v_attempt.correct_answer);

  UPDATE public.transfer_question_attempts
    SET user_answer = p_answer, is_correct = v_is_correct
    WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_answer', v_attempt.correct_answer,
    'explanation', v_attempt.explanation
  );
END;
$$;
