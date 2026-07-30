CREATE TABLE public.question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_quiz_id bigint REFERENCES public.quizzes(id) ON DELETE SET NULL,
  material_id bigint,
  subject text,
  topic text,
  skill text,
  difficulty text NOT NULL DEFAULT 'medium',
  quiz_language text NOT NULL DEFAULT 'ar',
  question_type text NOT NULL DEFAULT 'multiple_choice',
  question_text text NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  explanation text,
  times_used integer NOT NULL DEFAULT 0,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_bank TO authenticated;
GRANT ALL ON public.question_bank TO service_role;

ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bank questions" ON public.question_bank
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bank questions" ON public.question_bank
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bank questions" ON public.question_bank
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own bank questions" ON public.question_bank
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_question_bank_user ON public.question_bank(user_id, created_at DESC);
CREATE INDEX idx_question_bank_topic ON public.question_bank(user_id, topic);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_question_bank_updated_at BEFORE UPDATE ON public.question_bank
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_quiz_from_bank(p_title text, p_subject text, p_question_ids uuid[])
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_quiz_id bigint;
  v_count int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_question_ids IS NULL OR array_length(p_question_ids,1) IS NULL THEN
    RAISE EXCEPTION 'No questions selected';
  END IF;

  INSERT INTO public.quizzes(user_id, title, subject, difficulty, description)
  VALUES (v_user_id, COALESCE(NULLIF(p_title,''), 'Exam from Question Bank'), p_subject, 'medium',
          'Built from the question bank')
  RETURNING id INTO v_quiz_id;

  INSERT INTO public.quiz_questions(quiz_id, question_type, question_text, options, correct_answer, explanation, order_index)
  SELECT v_quiz_id, qb.question_type, qb.question_text, qb.options, qb.correct_answer, qb.explanation,
         ROW_NUMBER() OVER (ORDER BY array_position(p_question_ids, qb.id)) - 1
  FROM public.question_bank qb
  WHERE qb.id = ANY(p_question_ids) AND qb.user_id = v_user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 0 THEN
    DELETE FROM public.quizzes WHERE id = v_quiz_id;
    RAISE EXCEPTION 'No valid questions found';
  END IF;

  UPDATE public.question_bank SET times_used = times_used + 1
  WHERE id = ANY(p_question_ids) AND user_id = v_user_id;

  RETURN v_quiz_id;
END;
$$;