import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSmartQuest, DAY_NAMES } from '@/hooks/useSmartQuest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Plus, Trash2, Clock, GraduationCap, Lightbulb, CalendarCheck2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MyLife() {
  const { language } = useLanguage();
  const {
    protectedTime, prefs, goals, quests, loading,
    addProtected, removeProtected, updatePrefs, addLearned, removeLearned, finishWeek, journeys,
  } = useSmartQuest();
  const { toast } = useToast();
  const ar = language === 'ar';

  // protected-time form
  const [pTitle, setPTitle] = useState('');
  const [pDays, setPDays] = useState<string>('all');
  const [pStart, setPStart] = useState('19:00');
  const [pEnd, setPEnd] = useState('21:00');

  // prefs local form
  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  const [schoolStart, setSchoolStart] = useState('');
  const [schoolEnd, setSchoolEnd] = useState('');
  const [studyDays, setStudyDays] = useState<string>('');

  // finish week
  const [carry, setCarry] = useState<string[]>([]);
  const [showFinish, setShowFinish] = useState(false);
  const [closing, setClosing] = useState(false);
  const [pastJourneys, setPastJourneys] = useState<{ week_start: string; summary: Record<string, number> }[]>([]);

  useEffect(() => {
    if (prefs) {
      setSleepStart(prefs.sleep_start);
      setSleepEnd(prefs.sleep_end);
      setSchoolStart(prefs.school_start);
      setSchoolEnd(prefs.school_end);
      setStudyDays(prefs.study_days);
    }
  }, [prefs]);

  useEffect(() => {
    journeys().then(setPastJourneys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const toggleDayIn = (current: string, day: number) => {
    const parts = current === 'all' ? [0, 1, 2, 3, 4, 5, 6] : current.split(',').map(Number).filter((n) => !isNaN(n));
    const set = new Set(parts);
    if (set.has(day)) set.delete(day); else set.add(day);
    return [...set].sort().join(',');
  };

  const savePrefs = async () => {
    await updatePrefs({
      sleep_start: sleepStart, sleep_end: sleepEnd,
      school_start: schoolStart, school_end: schoolEnd, study_days: studyDays,
    });
    toast({ title: ar ? 'حياتك اتحدثت ✓' : 'Your life settings updated ✓' });
  };

  const handleFinishWeek = async () => {
    setClosing(true);
    await finishWeek(carry, language);
    setClosing(false);
    setShowFinish(false);
    setCarry([]);
    toast({ title: ar ? 'الأسبوع اتقفل… أسبوع جديد يبدأ 🎒' : 'Week closed… a new one begins 🎒' });
    journeys().then(setPastJourneys);
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const doneCount = quests.filter((q) => q.status === 'done').length;

  return (
    <div className="space-y-4">
      {/* Protected time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {ar ? 'وقتي المحمي (مقدس)' : 'My protected time (sacred)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {ar ? 'الوقت ده مفيش أي Quest يدخله — نوم، مسلسل، أهل، هوايات.' : 'No quest ever enters this time — sleep, shows, family, hobbies.'}
          </p>
          <div className="space-y-1.5">
            {protectedTime.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{p.title}</span>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap" dir="ltr">
                  {p.start_time}–{p.end_time}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {p.days === 'all' ? (ar ? 'كل الأيام' : 'All days') : p.days.split(',').map((d) => DAY_NAMES[language][Number(d)]?.slice(0, 3)).join('، ')}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={ar ? 'شيله' : 'Remove'}
                  onClick={() => removeProtected(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {protectedTime.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                {ar ? 'مفيش وقت محمي لسه — حمي حاجة بتحبها' : 'No protected time yet — protect something you love'}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-dashed p-3 space-y-2">
            <div className="flex gap-2">
              <Input value={pTitle} onChange={(e) => setPTitle(e.target.value)}
                placeholder={ar ? 'إيه الوقت اللي عايز تحميه؟ زي "وقت المسلسل"' : 'What time to protect? e.g. "Show time"'} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setPDays('all')}
                className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                  pDays === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary/40')}
              >
                {ar ? 'كل الأيام' : 'All days'}
              </button>
              {DAY_NAMES[language].map((d, i) => (
                <button
                  key={i}
                  onClick={() => setPDays(toggleDayIn(pDays, i))}
                  className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    pDays !== 'all' && pDays.split(',').includes(String(i))
                      ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary/40')}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
              <div className="flex items-center gap-1 text-xs text-muted-foreground ms-auto" dir="ltr">
                <Input type="time" className="h-8 w-[105px] px-1 text-xs" value={pStart} onChange={(e) => setPStart(e.target.value)} />
                <span>→</span>
                <Input type="time" className="h-8 w-[105px] px-1 text-xs" value={pEnd} onChange={(e) => setPEnd(e.target.value)} />
              </div>
              <Button size="sm" className="gap-1" onClick={() => {
                if (!pTitle.trim()) return;
                addProtected({ title: pTitle.trim(), days: pDays, start_time: pStart, end_time: pEnd });
                setPTitle('');
                setPDays('all');
              }}>
                <Plus className="h-3.5 w-3.5" />
                {ar ? 'حميه' : 'Protect'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Life rhythm */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            {ar ? 'إيقاع يومك' : 'My daily rhythm'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">{ar ? 'النوم من' : 'Sleep from'}</span>
              <Input type="time" dir="ltr" value={sleepStart} onChange={(e) => setSleepStart(e.target.value)} className="h-9" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">{ar ? 'لـ' : 'To'}</span>
              <Input type="time" dir="ltr" value={sleepEnd} onChange={(e) => setSleepEnd(e.target.value)} className="h-9" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">{ar ? 'المدرسة من' : 'School from'}</span>
              <Input type="time" dir="ltr" value={schoolStart} onChange={(e) => setSchoolStart(e.target.value)} className="h-9" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">{ar ? 'لـ' : 'To'}</span>
              <Input type="time" dir="ltr" value={schoolEnd} onChange={(e) => setSchoolEnd(e.target.value)} className="h-9" />
            </label>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{ar ? 'أيام المذاكرة' : 'Study days'}</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {DAY_NAMES[language].map((d, i) => (
                <button
                  key={i}
                  onClick={() => setStudyDays(toggleDayIn(studyDays, i))}
                  className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    studyDays.split(',').includes(String(i))
                      ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary/40')}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={savePrefs}>{ar ? 'حفظ' : 'Save'}</Button>
        </CardContent>
      </Card>

      {/* Learned about me */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            {ar ? 'حاجات اكتشفتها عن نفسي' : 'Things I learned about me'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(prefs?.learned || []).map((l, i) => (
              <Badge key={i} variant="secondary" className="gap-1.5 py-1.5 px-3">
                {l.text}
                <button onClick={() => removeLearned(i)} aria-label={ar ? 'شيلها' : 'Remove'}>
                  <Trash2 className="h-3 w-3 opacity-60 hover:opacity-100" />
                </button>
              </Badge>
            ))}
            {(prefs?.learned || []).length === 0 && (
              <p className="text-xs text-muted-foreground">
                {ar ? 'اكتب حاجة اتعلمتها عن نفسك — زي "بفهم أحسن بالليل"' : 'Write something you learned about yourself — e.g. "I focus better at night"'}
              </p>
            )}
          </div>
          <AddLearned onAdd={addLearned} ar={ar} />
        </CardContent>
      </Card>

      {/* Finish week */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-primary" />
            {ar ? 'قفل الأسبوع' : 'Close the week'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {ar ? 'لما الأسبوع يخلص: شوف إيه اللي تم، وقرر إيه اللي يكمل معاك لأسبوع جديد.' : 'When the week ends: see what got done, decide what continues into a new week.'}
          </p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowFinish(!showFinish)}>
            {showFinish ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showFinish ? (ar ? 'اقفل' : 'Collapse') : ar ? 'افتح ملخص الأسبوع' : 'Open week summary'}
          </Button>
          {showFinish && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-lg font-bold text-primary" dir="ltr">{doneCount}</p><p className="text-muted-foreground">{ar ? 'Quests تمت' : 'Quests done'}</p></div>
                <div><p className="text-lg font-bold text-primary" dir="ltr">{quests.length}</p><p className="text-muted-foreground">{ar ? 'إجمالي' : 'Total'}</p></div>
                <div><p className="text-lg font-bold text-primary" dir="ltr">{activeGoals.length}</p><p className="text-muted-foreground">{ar ? 'أهداف شغالة' : 'Active goals'}</p></div>
              </div>
              {activeGoals.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">{ar ? 'إيه اللي يكمل معاك الأسبوع الجديد؟' : 'What continues into the new week?'}</p>
                  {activeGoals.map((g) => (
                    <label key={g.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={carry.includes(g.title)}
                        onChange={(e) => setCarry((prev) => e.target.checked ? [...prev, g.title] : prev.filter((t) => t !== g.title))}
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                      {g.title}
                    </label>
                  ))}
                </div>
              )}
              <Button size="sm" disabled={closing} onClick={handleFinishWeek} className="gap-2">
                {closing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarCheck2 className="h-3.5 w-3.5" />}
                {ar ? 'اقفل الأسبوع وابدأ جديد' : 'Close the week & start fresh'}
              </Button>
            </div>
          )}
          {pastJourneys.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t">
              <p className="text-xs font-medium">{ar ? 'رحلاتك السابقة' : 'Past journeys'}</p>
              {pastJourneys.map((j) => (
                <div key={j.week_start} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span dir="ltr">{j.week_start}</span>
                  <span dir="ltr">
                    {j.summary?.questsDone ?? 0}/{j.summary?.questsTotal ?? 0} {ar ? 'تمت' : 'done'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AddLearned({ onAdd, ar }: { onAdd: (t: string) => Promise<void>; ar: boolean }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); } }}
        placeholder={ar ? 'اكتب ملاحظة عن نفسك…' : 'Write a note about yourself…'}
      />
      <Button size="icon" aria-label={ar ? 'ضيفها' : 'Add'}
        onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
