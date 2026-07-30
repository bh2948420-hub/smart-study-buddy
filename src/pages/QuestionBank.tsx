import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuestionBank, BankQuestion } from '@/hooks/useQuestionBank';
import { Library, Star, Trash2, Search, FileQuestion, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ALL = '__all__';

export default function QuestionBank() {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const { questions, loading, creating, toggleFavorite, deleteQuestion, createQuizFromBank } = useQuestionBank();

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState(ALL);
  const [topic, setTopic] = useState(ALL);
  const [skill, setSkill] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const t = {
    title: language === 'ar' ? 'بنك الأسئلة' : 'Question Bank',
    subtitle: language === 'ar'
      ? 'كل سؤال ولّده الذكاء الاصطناعي محفوظ هنا مع الموضوع والمهارة — اختر منه لبناء امتحانات جديدة'
      : 'Every AI-generated question is saved here with its topic and skill — pick from it to build new exams',
    search: language === 'ar' ? 'ابحث في نص السؤال...' : 'Search question text...',
    subject: language === 'ar' ? 'المادة' : 'Subject',
    topic: language === 'ar' ? 'الموضوع' : 'Topic',
    skill: language === 'ar' ? 'المهارة' : 'Skill',
    difficulty: language === 'ar' ? 'الصعوبة' : 'Difficulty',
    all: language === 'ar' ? 'الكل' : 'All',
    favorites: language === 'ar' ? 'المفضلة فقط' : 'Favorites only',
    selectAll: language === 'ar' ? 'اختيار الكل' : 'Select all',
    clear: language === 'ar' ? 'إلغاء التحديد' : 'Clear',
    selectedCount: (n: number) => language === 'ar' ? `${n} سؤال محدد` : `${n} selected`,
    buildExam: language === 'ar' ? 'بناء امتحان من المحدد' : 'Build exam from selection',
    examTitle: language === 'ar' ? 'عنوان الامتحان' : 'Exam title',
    examPlaceholder: language === 'ar' ? 'مثال: مراجعة نهائية' : 'e.g., Final revision',
    create: language === 'ar' ? 'إنشاء الامتحان' : 'Create exam',
    created: language === 'ar' ? 'تم إنشاء الامتحان بنجاح' : 'Exam created successfully',
    empty: language === 'ar'
      ? 'بنك الأسئلة فاضي — ولّد أي اختبار وهتتحفظ أسئلته هنا تلقائياً'
      : 'Your bank is empty — generate any quiz and its questions are saved here automatically',
    noMatch: language === 'ar' ? 'لا توجد أسئلة مطابقة للفلاتر' : 'No questions match the filters',
    used: language === 'ar' ? 'استُخدم' : 'Used',
    times: language === 'ar' ? 'مرة' : 'times',
    answer: language === 'ar' ? 'الإجابة' : 'Answer',
    noTopic: language === 'ar' ? 'بدون موضوع' : 'No topic',
  };

  const uniques = (key: keyof BankQuestion) =>
    Array.from(new Set(questions.map(q => (q[key] as string) || '').filter(Boolean))).sort();

  const filtered = useMemo(() => questions.filter(q => {
    if (search && !q.question_text.toLowerCase().includes(search.toLowerCase())) return false;
    if (subject !== ALL && (q.subject || '') !== subject) return false;
    if (topic !== ALL && (q.topic || '') !== topic) return false;
    if (skill !== ALL && (q.skill || '') !== skill) return false;
    if (difficulty !== ALL && q.difficulty !== difficulty) return false;
    if (favoritesOnly && !q.is_favorite) return false;
    return true;
  }), [questions, search, subject, topic, skill, difficulty, favoritesOnly]);

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    try {
      const subj = subject !== ALL ? subject : null;
      const quizId = await createQuizFromBank(
        examTitle || (language === 'ar' ? 'امتحان من بنك الأسئلة' : 'Exam from Question Bank'),
        subj,
        selected,
      );
      toast.success(t.created);
      setDialogOpen(false);
      setSelected([]);
      setExamTitle('');
      navigate('/quizzes', { state: { openQuizId: quizId } });
    } catch {
      /* handled in hook */
    }
  };

  const handleSmartGenerate = async (t2: string, subj: string | null, ids: string[]) => {
    try {
      const quizId = await createQuizFromBank(t2, subj, ids);
      toast.success(t.created);
      navigate('/quizzes', { state: { openQuizId: quizId } });
    } catch {
      /* handled in hook */
    }
  };


  const difficultyLabel = (d: string) =>
    d === 'easy' ? (language === 'ar' ? 'سهل' : 'Easy')
      : d === 'hard' ? (language === 'ar' ? 'صعب' : 'Hard')
        : (language === 'ar' ? 'متوسط' : 'Medium');

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Library className="h-7 w-7 text-primary" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </header>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="ltr:pl-9 rtl:pr-9"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder={t.subject} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t.subject}: {t.all}</SelectItem>
                  {uniques('subject').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger><SelectValue placeholder={t.topic} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t.topic}: {t.all}</SelectItem>
                  {uniques('topic').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger><SelectValue placeholder={t.skill} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t.skill}: {t.all}</SelectItem>
                  {uniques('skill').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue placeholder={t.difficulty} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t.difficulty}: {t.all}</SelectItem>
                  {['easy', 'medium', 'hard'].map(d => (
                    <SelectItem key={d} value={d}>{difficultyLabel(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={favoritesOnly} onCheckedChange={(v) => setFavoritesOnly(!!v)} />
                {t.favorites}
              </label>
              <Button variant="outline" size="sm" onClick={() => setSelected(filtered.map(q => q.id))}>
                {t.selectAll}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                {t.clear}
              </Button>
              <span className="text-sm text-muted-foreground ltr:ml-auto rtl:mr-auto">
                {t.selectedCount(selected.length)}
              </span>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={selected.length === 0}>
                    <Sparkles className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                    {t.buildExam}
                  </Button>
                </DialogTrigger>
                <DialogContent dir={dir}>
                  <DialogHeader>
                    <DialogTitle>{t.buildExam}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>{t.examTitle}</Label>
                      <Input
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        placeholder={t.examPlaceholder}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{t.selectedCount(selected.length)}</p>
                    <Button onClick={handleCreate} disabled={creating} className="w-full">
                      {creating
                        ? <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
                        : <Sparkles className="h-4 w-4 ltr:mr-2 rtl:ml-2" />}
                      {t.create}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileQuestion className="h-10 w-10 mx-auto mb-3 opacity-50" />
              {t.empty}
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">{t.noMatch}</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(q => (
              <Card key={q.id} className={selected.includes(q.id) ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-start gap-3">
                    <Checkbox
                      className="mt-1"
                      checked={selected.includes(q.id)}
                      onCheckedChange={() => toggleSelect(q.id)}
                    />
                    <span className="flex-1">{q.question_text}</span>
                    <Button variant="ghost" size="icon" onClick={() => toggleFavorite(q.id, !q.is_favorite)}>
                      <Star className={`h-4 w-4 ${q.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {q.subject && <Badge variant="secondary">{q.subject}</Badge>}
                    <Badge variant="outline">{q.topic || t.noTopic}</Badge>
                    {q.skill && <Badge variant="outline">{q.skill}</Badge>}
                    <Badge variant="outline">{difficultyLabel(q.difficulty)}</Badge>
                    <span className="text-muted-foreground">
                      {t.used} {q.times_used} {t.times}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
