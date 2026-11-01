import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSmartQuest, sortQuests, DAY_NAMES, dayIndexOf, SLOT_ORDER, type SqQuest } from '@/hooks/useSmartQuest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Flag, Sparkles, Check, SkipForward, Scissors, ChevronLeft, ChevronRight,
  Trash2, Plus, Sun, CloudSun, Moon, Loader2, RefreshCcw,

} from 'lucide-react';
import { cn } from '@/lib/utils';

const SLOT_ICON: Record<string, typeof Sun> = { morning: Sun, afternoon: CloudSun, evening: Moon };
const SLOT_LABEL = {
  ar: { morning: 'الصبح', afternoon: 'بعد المدرسة', evening: 'بالليل' },
  en: { morning: 'Morning', afternoon: 'After school', evening: 'Evening' },
};

export function AdventureMap() {
  const { language, dir } = useLanguage();
  const {
    goals, quests, loading, planning, aiMessage,
    addGoal, removeGoal, planWeek, replan,
    completeQuest, skipQuest, reopenQuest, removeQuest, splitQuest, moveQuest,
  } = useSmartQuest();
  const { toast } = useToast();
  const [newGoal, setNewGoal] = useState('');
  const [whatChanged, setWhatChanged] = useState('');
  const [showReplan, setShowReplan] = useState(false);
  const [busyQuest, setBusyQuest] = useState<string | null>(null);

  const ar = language === 'ar';
  const today = dayIndexOf();
  const sorted = sortQuests(quests);
  const doneCount = quests.filter((q) => q.status === 'done').length;
  const pct = quests.length ? Math.round((doneCount / quests.length) * 100) : 0;

  const handlePlan = async () => {
    const res = await planWeek(language);
    if (!res.ok) toast({ title: res.message, variant: 'destructive' });
    else toast({ title: ar ? 'الخطة جاهزة! 🗺️' : 'Plan ready! 🗺️' });
  };

  const handleReplan = async () => {
    const res = await replan(language, whatChanged.trim() || undefined);
    setShowReplan(false);
    setWhatChanged('');
    if (!res.ok) toast({ title: res.message, variant: 'destructive' });
    else toast({ title: res.message || (ar ? 'المسار اتظبط ✨' : 'Route adjusted ✨') });
  };

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyQuest(id);
    await fn();
    setBusyQuest(null);
  };

  const QuestRow = ({ q }: { q: SqQuest }) => {
    const SlotIcon = SLOT_ICON[q.slot ?? 'afternoon'];
    const busy = busyQuest === q.id;
    const nextDir = ar ? ChevronLeft : ChevronRight;
    const NextDir = nextDir;
    return (
      <div
        className={cn(
          'group flex items-center gap-2 rounded-lg border p-2.5 transition-all',
          q.status === 'done' && 'bg-primary/5 border-primary/25',
          q.status === 'skipped' && 'opacity-55'
        )}
      >
        {busy ? (
          <Loader className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <button
            aria-label={q.status === 'done' ? (ar ? 'ارجعها' : 'Reopen') : ar ? 'خلصتها' : 'Done'}
            onClick={() => withBusy(q.id, () => (q.status === 'done' ? reopenQuest(q.id) : completeQuest(q.id)))}
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              q.status === 'done' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 hover:border-primary'
            )}
          >
            {q.status === 'done' && <Check className="h-3.5 w-3.5" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', q.status === 'done' && 'line-through text-muted-foreground')}>
            {q.title}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <SlotIcon className="h-3 w-3" />
            <span>{SLOT_LABEL[language][q.slot ?? 'afternoon']}</span>
            <span>·</span>
            <span dir="ltr">{q.minutes} {ar ? 'د' : 'min'}</span>
          </div>
        </div>
        {q.status === 'pending' && (
          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={ar ? 'صغّرها' : 'Make smaller'}
              onClick={() => withBusy(q.id, () => splitQuest(q))}>
              <Scissors className="h-3.5 w-3.5" />
            </Button>
            {q.day !== null && q.day > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7"
                aria-label={ar ? 'بكرا؟ لأ، قبل كده' : 'Earlier day'}
                onClick={() => moveQuest(q.id, q.day - 1)}>
                {ar ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </Button>
            )}
            {q.day !== null && q.day < 6 && (
              <Button variant="ghost" size="icon" className="h-7 w-7"
                aria-label={ar ? 'بعدين' : 'Later day'}
                onClick={() => moveQuest(q.id, q.day + 1)}>
                <NextDir className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={ar ? 'تخطي' : 'Skip'}
              onClick={() => withBusy(q.id, () => skipQuest(q.id))}>
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {(q.status === 'done' || q.status === 'skipped') && (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={ar ? 'ارجعها' : 'Reopen'}
            onClick={() => withBusy(q.id, () => reopenQuest(q.id))}>
            <RefreshCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={ar ? 'شيلها خالص' : 'Remove'}
          onClick={() => withBusy(q.id, () => removeQuest(q.id))}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium">
              {ar ? 'تقدم الرحلة' : 'Journey progress'}
            </span>
            <span className="text-muted-foreground" dir="ltr">{doneCount}/{quests.length}</span>
          </div>
          <Progress value={pct} className="h-2.5" />
          {aiMessage && (
            <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              💬 {aiMessage}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-4 w-4 text-primary" />
            {ar ? 'أهداف الأسبوع (ثابتة)' : 'Weekly goals (fixed)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newGoal.trim()) { addGoal(newGoal); setNewGoal(''); }
              }}
              placeholder={ar ? 'اكتب هدف الأسبوع… زي "أخلص مذاكرة العلوم"' : 'Type a weekly goal… e.g. "Finish science revision"'}
            />
            <Button size="icon" aria-label={ar ? 'ضيف الهدف' : 'Add goal'}
              onClick={() => { if (newGoal.trim()) { addGoal(newGoal); setNewGoal(''); } }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <Badge
                key={g.id}
                variant={g.status === 'active' ? 'default' : 'secondary'}
                className={cn('gap-1.5 py-1.5 px-3', g.status === 'done' && 'opacity-60')}
              >
                {g.status === 'done' && <Check className="h-3 w-3" />}
                {g.title}
                {g.status === 'active' && (
                  <button onClick={() => removeGoal(g.id)} aria-label={ar ? 'شيله' : 'Remove'}>
                    <Trash2 className="h-3 w-3 opacity-60 hover:opacity-100" />
                  </button>
                )}
              </Badge>
            ))}
            {goals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {ar ? 'مفيش أهداف لسه — اكتب واحد فوق، أو فرّغ دماغك من تاب "تفريغ الدماغ"' : 'No goals yet — write one above, or dump your head in the Mind Dump tab'}
              </p>
            )}
          </div>
          <Button className="w-full gap-2" disabled={planning || goals.filter((g) => g.status === 'active').length === 0} onClick={handlePlan}>
            {planning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {planning
              ? (ar ? 'بيخطط رحلتك…' : 'Planning your journey…')
              : quests.length === 0
                ? (ar ? 'ابدأ الرحلة 🗺️' : 'Start the journey 🗺️')
                : (ar ? 'أعد خطة المسار' : 'Re-plan the route')}
          </Button>
        </CardContent>
      </Card>

      {/* Replan trigger */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          {!showReplan ? (
            <button
              className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
              onClick={() => setShowReplan(true)}
            >
              <FlagTriangleBottom className="h-4 w-4" />
              {ar ? 'حصل حاجة؟ (خروج، تعب، مدرسة زودت) — وضّبط المسار من غير لوم' : 'Something changed? (outing, tiredness, extra school) — adjust the route, no guilt'}
            </button>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={whatChanged}
                onChange={(e) => setWhatChanged(e.target.value)}
                placeholder={ar ? 'إيه اللي اتغير؟ (اختياري) زي: "خرجنا مع أهلي يوم الثلاثاء"' : 'What changed? (optional) e.g. "Family outing on Tuesday"'}
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowReplan(false)}>{ar ? 'إلغاء' : 'Cancel'}</Button>
                <Button size="sm" disabled={planning} onClick={handleReplan} className="gap-1.5">
                  {planning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {ar ? 'ظبّط المسار' : 'Adjust route'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* The adventure map — 7 day stations */}
      <div className="relative">
        <div className="absolute top-0 bottom-0 start-[22px] border-s-2 border-dashed border-primary/25" />
        <div className="space-y-4">
          {DAY_NAMES[language].map((dayName, day) => {
            const dayQuests = sorted.filter((q) => q.day === day);
            const isToday = day === today;
            return (
              <div key={day} className="relative ps-14">
                <div
                  className={cn(
                    'absolute start-0 top-3 flex h-11 w-11 items-center justify-center rounded-full border-2 font-bold text-xs shadow-sm',
                    isToday ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'
                  )}
                >
                  {dayName.slice(0, ar ? 3 : 3)}
                </div>
                <Card className={cn(isToday && 'border-primary/50 shadow-md')}>
                  <CardContent className="py-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{dayName}</span>
                      {isToday && (
                        <Badge className="text-[10px] px-2 py-0">
                          {ar ? 'النهاردة' : 'Today'}
                        </Badge>
                      )}
                      <span className="ms-auto text-[11px] text-muted-foreground">
                        {dayQuests.length > 0
                          ? ar ? `${dayQuests.length} مهمات` : `${dayQuests.length} quests`
                          : ar ? 'وقت فاضي مقصود ✨' : 'Intentionally free ✨'}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {dayQuests.map((q) => <QuestRow key={q.id} q={q} />)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
