-- Create quizzes table
CREATE TABLE public.quizzes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id BIGINT REFERENCES public.materials(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quiz_id BIGINT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')),
  question_text TEXT NOT NULL,
  options JSONB, -- For multiple choice: ["option1", "option2", "option3", "option4"]
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Create quiz results table
CREATE TABLE public.quiz_results (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id BIGINT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  answers JSONB, -- Store user answers: [{"question_id": 1, "answer": "A", "correct": true}]
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
CREATE POLICY "Users can view their own quizzes" ON public.quizzes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes" ON public.quizzes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes" ON public.quizzes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quiz_questions (through quiz ownership)
CREATE POLICY "Users can view questions of their quizzes" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create questions for their quizzes" ON public.quiz_questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update questions of their quizzes" ON public.quiz_questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete questions of their quizzes" ON public.quiz_questions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND user_id = auth.uid())
  );

-- RLS Policies for quiz_results
CREATE POLICY "Users can view their own results" ON public.quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own results" ON public.quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX idx_quizzes_material_id ON public.quizzes(material_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);