REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT (id, quiz_id, question_type, question_text, options, order_index)
  ON public.quiz_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;

REVOKE EXECUTE ON FUNCTION public.create_quiz_from_bank(text, text, uuid[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(text, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.grade_quiz(bigint, jsonb, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.grade_transfer_question(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.submit_challenge_answer(uuid, integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.submit_daily_quiz(bigint[], text[], integer) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.create_quiz_from_bank(text, text, uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grade_quiz(bigint, jsonb, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grade_transfer_question(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_challenge_answer(uuid, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_daily_quiz(bigint[], text[], integer) TO authenticated, service_role;