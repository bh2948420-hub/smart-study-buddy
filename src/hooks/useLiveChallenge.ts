import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChallengeRoom {
  id: string;
  room_code: string;
  host_user_id: string;
  guest_user_id: string | null;
  quiz_id: number | null;
  status: string;
  host_score: number;
  guest_score: number;
  current_question_index: number;
  total_questions: number;
  host_display_name: string | null;
  guest_display_name: string | null;
  started_at: string | null;
  finished_at: string | null;
}

interface QuizQuestion {
  id: number;
  question_text: string;
  options: any;
  correct_answer: string;
  explanation: string | null;
  order_index: number;
}

export const useLiveChallenge = () => {
  const [room, setRoom] = useState<ChallengeRoom | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myAnswers, setMyAnswers] = useState<Record<number, string>>({});
  const [opponentAnswers, setOpponentAnswers] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Generate room code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  // Create a room
  const createRoom = useCallback(async (quizId: number) => {
    if (!userId) return null;
    setLoading(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();

      // Get quiz questions (correct_answer stays server-side)
      const { data: qs } = await supabase
        .from('quiz_questions')
        .select('id, question_text, options, order_index')
        .eq('quiz_id', quizId)
        .order('order_index');


      if (!qs || qs.length === 0) {
        toast.error('No questions in this quiz');
        return null;
      }

      const code = generateCode();
      const { data, error } = await supabase
        .from('challenge_rooms')
        .insert({
          room_code: code,
          host_user_id: userId,
          quiz_id: quizId,
          total_questions: qs.length,
          host_display_name: profile?.display_name || 'Player 1',
        })
        .select()
        .single();

      if (error) throw error;
      setRoom(data);
      setQuestions(qs as any);

      return data;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Join a room
  const joinRoom = useCallback(async (code: string) => {
    if (!userId) return null;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();

      // Find room
      const { data: roomData, error: findErr } = await supabase
        .from('challenge_rooms')
        .select('*')
        .eq('room_code', code.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (findErr || !roomData) {
        toast.error('Room not found or already started');
        return null;
      }

      if (roomData.host_user_id === userId) {
        toast.error('Cannot join your own room');
        return null;
      }

      // Join
      const { data, error } = await supabase
        .from('challenge_rooms')
        .update({
          guest_user_id: userId,
          guest_display_name: profile?.display_name || 'Player 2',
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', roomData.id)
        .select()
        .single();

      if (error) throw error;

      // Fetch questions (correct_answer stays server-side)
      if (data.quiz_id) {
        const { data: qs } = await supabase
          .from('quiz_questions')
          .select('id, question_text, options, order_index')
          .eq('quiz_id', data.quiz_id)
          .order('order_index');
        setQuestions((qs || []) as any);
      }


      setRoom(data);
      return data;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Submit answer (server grades and updates score)
  const submitAnswer = useCallback(async (answer: string) => {
    if (!room || !userId) return;

    const question = questions[currentIndex];
    if (!question) return;

    // Save locally (optimistic UI)
    setMyAnswers(prev => ({ ...prev, [currentIndex]: answer }));

    // Server-side grading + score update
    await supabase.rpc('submit_challenge_answer', {
      p_room_id: room.id,
      p_question_index: currentIndex,
      p_answer: answer,
    });
  }, [room, userId, currentIndex, questions]);


  // Move to next question
  const nextQuestion = useCallback(async () => {
    if (!room) return;
    const next = currentIndex + 1;
    if (next >= questions.length) {
      // Finish
      await supabase
        .from('challenge_rooms')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .eq('id', room.id);
    } else {
      setCurrentIndex(next);
      setTimeLeft(15);
      await supabase
        .from('challenge_rooms')
        .update({ current_question_index: next })
        .eq('id', room.id);
    }
  }, [room, currentIndex, questions.length]);

  // Realtime subscription
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenge_rooms',
        filter: `id=eq.${room.id}`,
      }, (payload: any) => {
        const newRoom = payload.new as ChallengeRoom;
        setRoom(newRoom);
        if (newRoom.current_question_index !== currentIndex) {
          setCurrentIndex(newRoom.current_question_index);
          setTimeLeft(15);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'challenge_room_answers',
        filter: `room_id=eq.${room.id}`,
      }, (payload: any) => {
        const answer = payload.new;
        if (answer.user_id !== userId) {
          setOpponentAnswers(prev => ({ ...prev, [answer.question_index]: answer.is_correct }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, userId, currentIndex]);

  // Timer countdown
  useEffect(() => {
    if (!room || room.status !== 'active') return;
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [room?.status, timeLeft, currentIndex]);

  const isHost = room?.host_user_id === userId;
  const isFinished = room?.status === 'finished';
  const myScore = isHost ? room?.host_score || 0 : room?.guest_score || 0;
  const opponentScore = isHost ? room?.guest_score || 0 : room?.host_score || 0;
  const myName = isHost ? room?.host_display_name : room?.guest_display_name;
  const opponentName = isHost ? room?.guest_display_name : room?.host_display_name;

  return {
    room,
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex] || null,
    myAnswers,
    opponentAnswers,
    loading,
    timeLeft,
    isHost,
    isFinished,
    myScore,
    opponentScore,
    myName,
    opponentName,
    createRoom,
    joinRoom,
    submitAnswer,
    nextQuestion,
    leaveRoom: () => { setRoom(null); setQuestions([]); setCurrentIndex(0); setMyAnswers({}); setOpponentAnswers({}); },
  };
};
