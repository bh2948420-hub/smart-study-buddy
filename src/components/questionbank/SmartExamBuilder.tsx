import { useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Wand2, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BankQuestion } from '@/hooks/useQuestionBank';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  questions: BankQuestion[];
  creating: boolean;
  onGenerate: (title: string, subject: string | null, ids: string[]) => void | Promise<void>;
}

type Diff = 'easy' | 'medium' | 'hard';
const DIFFS: Diff[] = ['easy', 'medium', 'hard'];

export function SmartExamBuilder({ questions, creating, onGenerate }: Props) {
  const { language, dir } = useLanguage();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState([10]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [ratios, setRatios] = useState<Record<Diff, number>>({ easy: 30, medium: 50, hard: 20 });

  const t = {
    open: language === 'ar' ? 'مولّد امتحان ذكي' : 'Smart exam builder',
    title: language === 'ar' ? 'مولّد امتحان ذكي' : 'Smart Exam Builder',
    desc: language === 'ar'
      ? 'حدد المواضيع والمهارات ونِسَب الصعوبة، وسيتم اختيار الأسئلة تلقائياً من بنك الأسئلة'
      : 'Pick topics, skills and difficulty ratios — questions are auto-selected from your bank',
    examTitle: language === 'ar' ? 'عنوان الامتحان' : 'Exam title',
    placeholder: language === 'ar' ? 'مثال: مراجعة الوحدة الثانية' : 'e.g., Unit 2 revision',
    totalQ: language === 'ar' ? 'عدد الأسئلة' : 'Number of questions',
    subject: language === 'ar' ? 'المواد' : 'Subjects',
    topics: language === 'ar' ? 'المواضيع' : 'Topics',
    skills: language === 'ar' ? 'المهارات' : 'Skills',
    anyHint: language === 'ar' ? '(اتركه فارغاً = الكل)' : '(leave empty = all)',
    ratios: language === 'ar' ? 'نِسَب الصعوبة' : 'Difficulty ratios',
    easy: language === 'ar' ? 'سهل' : 'Easy',
    medium: language === 'ar' ? 'متوسط' : 'Medium',
    hard: language === 'ar' ? 'صعب' : 'Hard',
    plan: language === 'ar' ? 'خطة الامتحان' : 'Exam blueprint',
    available: language === 'ar' ? 'متاح' : 'available',
    shortage: language === 'ar'
      ? 'الأسئلة المتاحة أقل من المطلوب — سيتم التعويض من مستويات الصعوبة الأخرى'
      : 'Not enough questions — the rest will be filled from other difficulty levels',
    willPick: (n: number) => language === 'ar' ? `سيتم اختيار ${n} سؤال` : `${n} questions will be picked`,
    generate: language === 'ar' ? 'ولّد الامتحان' : 'Generate exam',
    noPool: language === 'ar' ? 'لا توجد أسئلة مطابقة للاختيارات' : 'No questions match your selection',
  };

  const uniques = (key: 'subject' | 'topic' | 'skill') =>
    Array.from(new Set(questions.map(q => q[key] || '').filter(Boolean))).sort();

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const pool = useMemo(() => questions.filter(q => {
    if (subjects.length && !subjects.includes(q.subject || '')) return false;
    if (topics.length && !topics.includes(q.topic || '')) return false;
    if (skills.length && !skills.includes(q.skill || '')) return false;
    return true;
  }), [questions, subjects, topics, skills]);

  const sumRatio = DIFFS.reduce((s, d) => s + ratios[d], 0) || 1;

  // Target count per difficulty, normalized to the requested total
  const plan = useMemo(() => {
    const n = total[0];
    const raw = DIFFS.map(d => ({ d, exact: (ratios[d] / sumRatio) * n }));
    const counts: Record<Diff, number> = { easy: 0, medium: 0, hard: 0 };
    raw.forEach(r => { counts[r.d] = Math.floor(r.exact); });
    let rest = n - DIFFS.reduce((s, d) => s + counts[d], 0);
    raw.sort((a, b) => (b.exact % 1) - (a.exact % 1));
    for (let i = 0; rest > 0; i = (i + 1) % raw.length, rest--) counts[raw[i].d] += 1;
    return counts;
  }, [total, ratios, sumRatio]);

  const availability = useMemo(() => {
    const map: Record<Diff, BankQuestion[]> = { easy: [], medium: [], hard: [] };
    pool.forEach(q => {
      const d = (DIFFS.includes(q.difficulty as Diff) ? q.difficulty : 'medium') as Diff;
      map[d].push(q);
    });
    return map;
  }, [pool]);

  const picked = useMemo(() => {
    // Prefer least-used questions, then random within the same usage count
    const sortPool = (arr: BankQuestion[]) =>
      [...arr].sort((a, b) => (a.times_used - b.times_used) || (Math.random() - 0.5));

    const chosen: BankQuestion[] = [];
    const leftovers: BankQuestion[] = [];

    DIFFS.forEach(d => {
      const sorted = sortPool(availability[d]);
      chosen.push(...sorted.slice(0, plan[d]));
      leftovers.push(...sorted.slice(plan[d]));
    });

    // Fill any shortage from the remaining questions of other difficulties
    const missing = total[0] - chosen.length;
    if (missing > 0) chosen.push(...sortPool(leftovers).slice(0, missing));

    return chosen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability, plan, total]);

  const hasShortage = picked.length < total[0];

  const handleGenerate = async () => {
    await onGenerate(
      title || (language === 'ar' ? 'امتحان ذكي من بنك الأسئلة' : 'Smart exam from Question Bank'),
      subjects.length === 1 ? subjects[0] : null,
      picked.map(q => q.id),
    );
    setOpen(false);
    setTitle('');
  };

  const chip = (v: string, active: boolean, onClick: () => void) => (
    <button key={v} type="button" onClick={onClick}>
      <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer">{v}</Badge>
    </button>
  );

  const label: Record<Diff, string> = { easy: t.easy, medium: t.medium, hard: t.hard };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Wand2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {t.open}
        </Button>
      </DialogTrigger>
      <DialogContent dir={dir} className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>{t.examTitle}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.placeholder} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{t.totalQ}</span>
              <span className="text-primary font-medium">{total[0]}</span>
            </Label>
            <Slider value={total} onValueChange={setTotal} min={3} max={40} step={1} />
          </div>

          {(['subject', 'topic', 'skill'] as const).map((key) => {
            const values = uniques(key);
            if (!values.length) return null;
            const [list, set] =
              key === 'subject' ? [subjects, setSubjects] as const
                : key === 'topic' ? [topics, setTopics] as const
                  : [skills, setSkills] as const;
            const heading = key === 'subject' ? t.subject : key === 'topic' ? t.topics : t.skills;
            return (
              <div key={key} className="space-y-2">
                <Label className="text-sm">
                  {heading} <span className="text-muted-foreground font-normal">{t.anyHint}</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {values.map(v => chip(v, list.includes(v), () => toggle(list, set, v)))}
                </div>
              </div>
            );
          })}

          <div className="space-y-3">
            <Label>{t.ratios}</Label>
            {DIFFS.map(d => (
              <div key={d} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{label[d]}</span>
                  <span className="text-muted-foreground">
                    {Math.round((ratios[d] / sumRatio) * 100)}% · {plan[d]} / {availability[d].length} {t.available}
                  </span>
                </div>
                <Slider
                  value={[ratios[d]]}
                  onValueChange={(v) => setRatios(prev => ({ ...prev, [d]: v[0] }))}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-3 text-sm space-y-1">
            <div className="flex items-center gap-2 font-medium">
              {hasShortage
                ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                : <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {t.plan}
            </div>
            <p className="text-muted-foreground">{t.willPick(picked.length)}</p>
            {hasShortage && picked.length > 0 && (
              <p className="text-amber-600 text-xs">{t.shortage}</p>
            )}
            {picked.length === 0 && <p className="text-destructive text-xs">{t.noPool}</p>}
          </div>

          <Button onClick={handleGenerate} disabled={creating || picked.length === 0} className="w-full">
            {creating
              ? <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
              : <Wand2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />}
            {t.generate}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
