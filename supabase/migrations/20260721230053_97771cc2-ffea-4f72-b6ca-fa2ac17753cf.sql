
-- 1. curriculum_context UPDATE policy
CREATE POLICY "Users can update their own curriculum"
ON public.curriculum_context
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Realtime.messages RLS restricting challenge topics to participants
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own challenge topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'room-%' THEN
      EXISTS (
        SELECT 1 FROM public.challenge_rooms cr
        WHERE cr.id::text = substring(realtime.topic() from 6)
          AND (cr.host_user_id = auth.uid() OR cr.guest_user_id = auth.uid() OR cr.status = 'waiting')
      )
    ELSE true
  END
);

-- 3. Column-level restrictions on quiz_questions (hide correct answers from client)
REVOKE SELECT ON public.quiz_questions FROM authenticated;
GRANT SELECT (id, quiz_id, question_type, question_text, options, order_index)
  ON public.quiz_questions TO authenticated;

-- 4. Column-level restrictions on scoring fields
REVOKE INSERT, UPDATE ON public.challenge_rooms FROM authenticated;
GRANT INSERT (room_code, host_user_id, quiz_id, total_questions, host_display_name)
  ON public.challenge_rooms TO authenticated;
GRANT UPDATE (guest_user_id, guest_display_name, status, started_at, finished_at, current_question_index)
  ON public.challenge_rooms TO authenticated;

REVOKE INSERT ON public.challenge_room_answers FROM authenticated;
GRANT INSERT (room_id, user_id, question_index, answer)
  ON public.challenge_room_answers TO authenticated;

REVOKE INSERT ON public.daily_quiz_attempts FROM authenticated;
-- No direct INSERT for daily_quiz_attempts; must use RPC below

REVOKE INSERT ON public.quiz_results FROM authenticated;
-- No direct INSERT for quiz_results; must use RPC below

-- 5. SECURITY DEFINER RPC: grade_quiz
CREATE OR REPLACE FUNCTION public.grade_quiz(
  p_quiz_id bigint,
  p_answers jsonb,
  p_time_spent integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner uuid;
  v_details jsonb := '[]'::jsonb;
  v_score int := 0;
  v_total int := 0;
  v_percentage numeric;
  v_result_id bigint;
  r record;
  v_submitted text;
  v_is_correct boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT user_id INTO v_owner FROM public.quizzes WHERE id = p_quiz_id;
  IF v_owner IS NULL OR v_owner <> v_user_id THEN
    RAISE EXCEPTION 'Quiz not found or access denied';
  END IF;

  FOR r IN
    SELECT id, correct_answer, explanation, order_index
    FROM public.quiz_questions
    WHERE quiz_id = p_quiz_id
    ORDER BY order_index
  LOOP
    v_total := v_total + 1;
    v_submitted := COALESCE(p_answers->>(r.id::text), '');
    v_is_correct := (v_submitted = r.correct_answer);
    IF v_is_correct THEN v_score := v_score + 1; END IF;
    v_details := v_details || jsonb_build_object(
      'question_id', r.id,
      'answer', v_submitted,
      'correct_answer', r.correct_answer,
      'explanation', r.explanation,
      'correct', v_is_correct
    );
  END LOOP;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'Quiz has no questions';
  END IF;

  v_percentage := (v_score::numeric / v_total::numeric) * 100;

  INSERT INTO public.quiz_results(user_id, quiz_id, score, total_questions, percentage, answers, time_spent_seconds)
  VALUES (v_user_id, p_quiz_id, v_score, v_total, v_percentage, v_details, p_time_spent)
  RETURNING id INTO v_result_id;

  RETURN jsonb_build_object(
    'result_id', v_result_id,
    'score', v_score,
    'total', v_total,
    'percentage', v_percentage,
    'details', v_details
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grade_quiz(bigint, jsonb, integer) TO authenticated;

-- 6. SECURITY DEFINER RPC: submit_daily_quiz
CREATE OR REPLACE FUNCTION public.submit_daily_quiz(
  p_question_ids bigint[],
  p_answers text[],
  p_time_spent integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_correct int := 0;
  v_total int;
  v_xp int;
  v_pct numeric;
  v_details jsonb := '[]'::jsonb;
  v_attempt_id uuid;
  i int;
  r record;
  v_is_correct boolean;
  v_current_xp int;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF array_length(p_question_ids,1) IS NULL OR array_length(p_question_ids,1) <> array_length(p_answers,1) THEN
    RAISE EXCEPTION 'Invalid input arrays';
  END IF;

  v_total := array_length(p_question_ids,1);

  FOR i IN 1..v_total LOOP
    SELECT qq.correct_answer INTO r
    FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = p_question_ids[i] AND q.user_id = v_user_id;

    IF r IS NULL THEN
      v_is_correct := false;
    ELSE
      v_is_correct := (COALESCE(p_answers[i],'') = r.correct_answer);
      IF v_is_correct THEN v_correct := v_correct + 1; END IF;
    END IF;

    v_details := v_details || jsonb_build_object('question_id', p_question_ids[i], 'correct', v_is_correct);
  END LOOP;

  v_pct := (v_correct::numeric / v_total::numeric) * 100;
  v_xp := CASE
    WHEN v_pct >= 80 THEN 50
    WHEN v_pct >= 60 THEN 35
    WHEN v_pct >= 40 THEN 25
    ELSE 15
  END;

  INSERT INTO public.daily_quiz_attempts(user_id, quiz_date, score, total_questions, time_spent_seconds, xp_earned)
  VALUES (v_user_id, CURRENT_DATE, v_correct, v_total, p_time_spent, v_xp)
  RETURNING id INTO v_attempt_id;

  SELECT COALESCE(xp_points,0) INTO v_current_xp FROM public.user_profiles WHERE user_id = v_user_id;
  UPDATE public.user_profiles
    SET xp_points = COALESCE(v_current_xp,0) + v_xp, updated_at = now()
    WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'score', v_correct,
    'total', v_total,
    'xp_earned', v_xp,
    'details', v_details
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_daily_quiz(bigint[], text[], integer) TO authenticated;

-- 7. SECURITY DEFINER RPC: submit_challenge_answer
CREATE OR REPLACE FUNCTION public.submit_challenge_answer(
  p_room_id uuid,
  p_question_index integer,
  p_answer text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_room record;
  v_correct text;
  v_is_correct boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_room FROM public.challenge_rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN RAISE EXCEPTION 'Room not found'; END IF;
  IF v_room.host_user_id <> v_user_id AND v_room.guest_user_id <> v_user_id THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  SELECT correct_answer INTO v_correct
  FROM public.quiz_questions
  WHERE quiz_id = v_room.quiz_id AND order_index = p_question_index;

  v_is_correct := (v_correct IS NOT NULL AND p_answer = v_correct);

  INSERT INTO public.challenge_room_answers(room_id, user_id, question_index, answer, is_correct)
  VALUES (p_room_id, v_user_id, p_question_index, p_answer, v_is_correct);

  IF v_is_correct THEN
    IF v_room.host_user_id = v_user_id THEN
      UPDATE public.challenge_rooms SET host_score = host_score + 1 WHERE id = p_room_id;
    ELSE
      UPDATE public.challenge_rooms SET guest_score = guest_score + 1 WHERE id = p_room_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('is_correct', v_is_correct);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_challenge_answer(uuid, integer, text) TO authenticated;
