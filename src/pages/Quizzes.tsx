import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuizzes, Quiz, QuizQuestion } from '@/hooks/useQuizzes';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, BookOpen, Clock, Trophy, Loader2, 
  ChevronRight, ChevronLeft, Check, X, Trash2,
  FileText, Sparkles, Zap, Upload, FileUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Quizzes = () => {
  const { language, dir } = useLanguage();
  const { 
    quizzes, loading, generating, 
    generateQuiz, fetchQuizWithQuestions, submitQuizResult, deleteQuiz 
  } = useQuizzes();
  const { materials, loading: materialsLoading, uploadMaterial } = useMaterials();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('');
  const [newQuizContent, setNewQuizContent] = useState('');
  const [newQuizDifficulty, setNewQuizDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState('5');
  const [generatingFromMaterial, setGeneratingFromMaterial] = useState<number | null>(null);
  const [uploadingAndGenerating, setUploadingAndGenerating] = useState(false);
  const [uploadSubject, setUploadSubject] = useState('');
  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [gradeDetails, setGradeDetails] = useState<Record<number, { correct: boolean; correct_answer: string; explanation: string | null }>>({});


  const subjects = ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'لغة عربية', 'إنجليزي', 'تاريخ', 'جغرافيا'];

  // Group materials by subject
  const materialsBySubject = materials.reduce<Record<string, Material[]>>((acc, mat) => {
    const key = mat.subject || (language === 'ar' ? 'بدون مادة' : 'No Subject');
    if (!acc[key]) acc[key] = [];
    acc[key].push(mat);
    return acc;
  }, {});

  const handleAutoGenerateQuiz = async (material: Material) => {
    setGeneratingFromMaterial(material.id);
    try {
      let content = '';

      // Extract text based on file type
      if (material.file_type === 'pdf') {
        const response = await supabase.functions.invoke('extract-pdf-text', {
          body: { filePath: material.file_path }
        });
        if (response.data?.extracted && response.data?.text) {
          content = response.data.text;
        }
      }

      // For non-PDF or if extraction failed, use file name as context
      if (!content) {
        content = `${material.file_name} - ${material.subject || ''} - ${material.description || ''}`;
      }

      if (content.length < 20) {
        throw new Error('لم يتم استخراج محتوى كافٍ');
      }

      const title = material.file_name.replace(/\.[^/.]+$/, '');
      const quiz = await generateQuiz(
        content,
        title,
        material.subject || '',
        'medium',
        material.id,
        5
      );

      // Auto-start the quiz
      if (quiz) {
        await startQuiz(quiz);
      }
    } catch (error) {
      console.error('Auto generate error:', error);
    } finally {
      setGeneratingFromMaterial(null);
    }
  };

  const handleUploadAndGenerate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAndGenerating(true);
    try {
      // Upload the file first
      const material = await uploadMaterial(file, uploadSubject || undefined);
      if (!material) throw new Error('Upload failed');

      // Now auto-generate quiz from it
      await handleAutoGenerateQuiz(material as Material);
    } catch (error) {
      console.error('Upload & generate error:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في رفع الملف وإنشاء الاختبار' : 'Failed to upload and generate quiz',
        variant: 'destructive',
      });
    } finally {
      setUploadingAndGenerating(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleCreateQuiz = async () => {
    if (!newQuizTitle || !newQuizContent) return;
    
    try {
      await generateQuiz(
        newQuizContent,
        newQuizTitle,
        newQuizSubject,
        newQuizDifficulty,
        undefined,
        parseInt(questionCount)
      );
      setShowCreateDialog(false);
      setNewQuizTitle('');
      setNewQuizSubject('');
      setNewQuizContent('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    setLoadingQuiz(true);
    try {
      const data = await fetchQuizWithQuestions(quiz.id);
      if (data) {
        setActiveQuiz(data.quiz as Quiz);
        setQuestions(data.questions as QuizQuestion[]);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
        setQuizStartTime(Date.now());
      }
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishQuiz = async () => {
    if (!activeQuiz) return;

    const timeSpent = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;

    const answers = questions.map(q => ({
      question_id: q.id,
      answer: selectedAnswers[q.id] || '',
      correct: false, // server will compute
    }));

    const graded: any = await submitQuizResult(activeQuiz.id, answers, timeSpent);
    const map: Record<number, { correct: boolean; correct_answer: string; explanation: string | null }> = {};
    (graded?.details || []).forEach((d: any) => {
      map[d.question_id] = { correct: !!d.correct, correct_answer: d.correct_answer ?? '', explanation: d.explanation ?? null };
    });
    setGradeDetails(map);
    setShowResults(true);
  };


  const closeQuiz = () => {
    setActiveQuiz(null);
    setQuestions([]);
    setShowResults(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'hard': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return language === 'ar' ? 'سهل' : 'Easy';
      case 'medium': return language === 'ar' ? 'متوسط' : 'Medium';
      case 'hard': return language === 'ar' ? 'صعب' : 'Hard';
      default: return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show quiz taking interface
  if (activeQuiz && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (showResults) {
      const correctCount = questions.filter(q => selectedAnswers[q.id] === q.correct_answer).length;
      const percentage = (correctCount / questions.length) * 100;

      return (
        <div className="min-h-screen bg-background" dir={dir}>
          <Navbar />
          <main className="container py-6 max-w-3xl">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  {language === 'ar' ? 'نتيجة الاختبار' : 'Quiz Results'}
                </CardTitle>
                <CardDescription>{activeQuiz.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-5xl font-bold text-primary">
                    {percentage.toFixed(0)}%
                  </div>
                  <p className="text-muted-foreground">
                    {correctCount} / {questions.length} {language === 'ar' ? 'إجابات صحيحة' : 'correct answers'}
                  </p>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const isCorrect = selectedAnswers[q.id] === q.correct_answer;
                    return (
                      <div 
                        key={q.id} 
                        className={cn(
                          "p-4 rounded-lg border",
                          isCorrect ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <Check className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{idx + 1}. {q.question_text}</p>
                            {!isCorrect && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {language === 'ar' ? 'الإجابة الصحيحة:' : 'Correct answer:'} {q.correct_answer}
                              </p>
                            )}
                            {q.explanation && (
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={closeQuiz} className="w-full">
                  {language === 'ar' ? 'العودة للاختبارات' : 'Back to Quizzes'}
                </Button>
              </CardFooter>
            </Card>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Navbar />
        <main className="container py-6 max-w-3xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{activeQuiz.title}</CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'السؤال' : 'Question'} {currentQuestionIndex + 1} / {questions.length}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {answeredCount} / {questions.length} {language === 'ar' ? 'تمت الإجابة' : 'answered'}
                </Badge>
              </div>
              <Progress value={progress} className="mt-4" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">{currentQuestion.question_text}</h3>
                
                <RadioGroup
                  value={selectedAnswers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                >
                  {(currentQuestion.options as string[] || []).map((option, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "flex items-center space-x-2 space-x-reverse p-4 rounded-lg border cursor-pointer transition-colors",
                        selectedAnswers[currentQuestion.id] === option 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => handleAnswer(currentQuestion.id, option)}
                    >
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronRight className="h-4 w-4 ml-1" />
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              
              {currentQuestionIndex === questions.length - 1 ? (
                <Button 
                  onClick={finishQuiz}
                  disabled={answeredCount < questions.length}
                >
                  {language === 'ar' ? 'إنهاء الاختبار' : 'Finish Quiz'}
                </Button>
              ) : (
                <Button onClick={nextQuestion}>
                  {language === 'ar' ? 'التالي' : 'Next'}
                  <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      
      <main className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'الاختبارات' : 'Quizzes'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'أنشئ اختبارات ذكية واختبر معرفتك' : 'Create smart quizzes and test your knowledge'}
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                {language === 'ar' ? 'إنشاء اختبار' : 'Create Quiz'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إنشاء اختبار جديد' : 'Create New Quiz'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'عنوان الاختبار' : 'Quiz Title'}</Label>
                  <Input
                    value={newQuizTitle}
                    onChange={(e) => setNewQuizTitle(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: اختبار الفصل الأول' : 'e.g., Chapter 1 Quiz'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'المادة' : 'Subject'}</Label>
                    <Select value={newQuizSubject} onValueChange={setNewQuizSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر المادة' : 'Select subject'} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}</Label>
                    <Select value={newQuizDifficulty} onValueChange={setNewQuizDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">{language === 'ar' ? 'سهل' : 'Easy'}</SelectItem>
                        <SelectItem value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                        <SelectItem value="hard">{language === 'ar' ? 'صعب' : 'Hard'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'عدد الأسئلة' : 'Number of Questions'}</Label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'المحتوى (الصق نص الدرس هنا)' : 'Content (paste lesson text here)'}</Label>
                  <Textarea
                    value={newQuizContent}
                    onChange={(e) => setNewQuizContent(e.target.value)}
                    placeholder={language === 'ar' ? 'الصق محتوى الدرس أو الفصل هنا وسيقوم الذكاء الاصطناعي بإنشاء أسئلة منه...' : 'Paste lesson or chapter content here and AI will generate questions from it...'}
                    rows={8}
                  />
                </div>
                
                <Button 
                  onClick={handleCreateQuiz} 
                  className="w-full"
                  disabled={generating || !newQuizTitle || !newQuizContent}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 ml-2" />
                      {language === 'ar' ? 'إنشاء الاختبار' : 'Create Quiz'}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upload & Auto Quiz */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 text-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileUp className="h-6 w-6 text-primary" />
                </div>
                <div className="text-start">
                  <h3 className="font-semibold text-lg">
                    {language === 'ar' ? 'ارفع ملف واختبر نفسك فوراً' : 'Upload & Quiz Instantly'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'ارفع ملف PDF أو أي مستند والذكاء الاصطناعي هيعملك امتحان تلقائي عليه'
                      : 'Upload a PDF or document and AI will auto-generate a quiz from it'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
                <Select value={uploadSubject} onValueChange={setUploadSubject}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder={language === 'ar' ? 'اختر المادة (اختياري)' : 'Subject (optional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="flex-1 w-full">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleUploadAndGenerate}
                    disabled={uploadingAndGenerating || generating}
                  />
                  <Button 
                    className="w-full gap-2" 
                    disabled={uploadingAndGenerating || generating}
                    asChild
                  >
                    <span>
                      {uploadingAndGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {language === 'ar' ? 'جاري الرفع والإنشاء...' : 'Uploading & Generating...'}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          {language === 'ar' ? 'ارفع ملف وابدأ الامتحان' : 'Upload & Start Quiz'}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Quiz from Materials */}
        {materials.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'اختبار سريع من ملفاتك' : 'Quick Quiz from Your Files'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'اضغط على أي درس وسيتم إنشاء اختبار تلقائي فوراً'
                  : 'Click any lesson to auto-generate a quiz instantly'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(materialsBySubject).map(([subject, mats]) => (
                <div key={subject}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{subject}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {mats.map((mat) => (
                      <Button
                        key={mat.id}
                        variant="outline"
                        className="justify-start gap-2 h-auto py-3 px-4 text-start"
                        disabled={generatingFromMaterial === mat.id || generating}
                        onClick={() => handleAutoGenerateQuiz(mat)}
                      >
                        {generatingFromMaterial === mat.id ? (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                        )}
                        <span className="truncate text-sm">
                          {mat.file_name.replace(/\.[^/.]+$/, '')}
                        </span>
                        {generatingFromMaterial === mat.id && (
                          <Badge variant="secondary" className="mr-auto text-xs">
                            <Sparkles className="h-3 w-3 ml-1" />
                            {language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {language === 'ar' ? 'لا توجد اختبارات' : 'No quizzes yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'أنشئ اختبارك الأول للبدء' : 'Create your first quiz to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      {quiz.subject && (
                        <CardDescription>{quiz.subject}</CardDescription>
                      )}
                    </div>
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {getDifficultyLabel(quiz.difficulty)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {quiz.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3 inline ml-1" />
                    {new Date(quiz.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => startQuiz(quiz)}
                    disabled={loadingQuiz}
                  >
                    {loadingQuiz ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      language === 'ar' ? 'ابدأ الاختبار' : 'Start Quiz'
                    )}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => deleteQuiz(quiz.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Quizzes;
