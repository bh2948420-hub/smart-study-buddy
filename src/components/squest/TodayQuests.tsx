import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSmartQuest, sortQuests, dayIndexOf, SLOT_ORDER, DAY_NAMES } from '@/hooks/useSmartQuest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CloudSun, Moon, Sun, BatteryLow, BatteryMedium, BatteryFull, Loader2, RefreshCcw, SkipForward, Scissors, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const SLOT_ICON: Record<string, typeof Sun> = { morning: Sun, afternoon: CloudSun, evening: Moon };
const SLOT_LABEL = {
  ar: { morning: 'الصبح', afternoon: 'بعد المدرسة', evening: 'بالليل' },
  en: { morning: 'Morning', afternoon: 'After school', evening: 'Evening' },
};

export function TodayQuests({ onGoLife }: { onGoLife: () => void }) {
  const { language } = useLanguage();
  const {
    quests, loading, energy, setEnergy,
    completeQuest, skipQuest, splitQuest, replan, planning,
  } = useSmartQuest();
  const ar = language === 'ar';
  const today = dayIndexOf();
  const [busy, setBusy] = useState<string | null>(null);

  const todays = sortQuests(quests.filter((q) => q.day === today));

  const energies: { id: 'light' | 'normal' | 'high'; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: ar ? 'مُتعَب' : 'Tired', icon: BatteryLow },
    { id: 'normal', label: ar ? 'عادي' : 'Normal', icon: BatteryMedium },
    { id: 'high', label: ar ? 'فايق ومليان' : 'Full of energy', icon: BatteryFull },
  ];

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    await fn();
    setBusy(null);
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
      {/* Energy check-in */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            {ar ? 'إزاي طاقتك النهاردة؟' : 'How is your energy today?'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {energies.map((en) => (
              <button
                key={en.id}
                onClick={() => setEnergy(en.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all',
                  energy === en.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card hover:border-primary/40'
                )}
              >
                <en.icon className="h-5 w-5" />
                {en.label}
              </button>
            ))}
          </div>
          {energy === 'light' && (
            <p className="mt-3 text-xs text-muted-foreground">
              {ar ? 'مفيش مشكلة — خلي Quests النهاردة صغيرة أو استريح، المسار يقدر يتغير.' : 'No problem — keep today\'s quests small or rest, the route can change.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Today's quests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" />
            {ar ? `Quests ${DAY_NAMES.ar[today]}` : `${DAY_NAMES.en[today]}'s quests`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todays.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <Sparkles className="h-8 w-8 mx-auto text-primary/60" />
              <p className="text-sm font-medium">
                {ar ? 'يومك فاضي من الرحلة' : 'Your day is quest-free'}
              </p>
              <p className="text-xs text-muted-foreground">
                {ar ? 'الوقت الفاضي مقصود — ريّح دماغك أو استمتع بحياتك' : 'Free time is intentional — rest or enjoy your life'}
              </p>
            </div>
          ) : (
            todays.map((q) => {
              const SlotIcon = SLOT_ICON[q.slot ?? 'afternoon'];
              return (
                <div
                  key={q.id}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border p-3 transition-all',
                    q.status === 'done' && 'bg-primary/5 border-primary/25',
                    q.status === 'skipped' && 'opacity-55'
                  )}
                >
                  <button
                    aria-label={ar ? 'خلصتها' : 'Done'}
                    disabled={busy === q.id}
                    onClick={() => act(q.id, () => completeQuest(q.id))}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      q.status === 'done' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 hover:border-primary'
                    )}
                  >
                    {q.status === 'done' && <Check className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', q.status === 'done' && 'line-through text-muted-foreground')}>{q.title}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <SlotIcon className="h-3 w-3" />
                      <span>{SLOT_LABEL[language][q.slot ?? 'afternoon']}</span>
                      <span>·</span>
                      <span dir="ltr">{q.minutes} {ar ? 'دقيقة' : 'min'}</span>
                    </div>
                  </div>
                  {q.status === 'pending' && (
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={ar ? 'صغّرها' : 'Make smaller'}
                        onClick={() => act(q.id, () => splitQuest(q))}>
                        <Scissors className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={ar ? 'بعدين' : 'Skip'}
                        onClick={() => act(q.id, () => skipQuest(q.id))}>
                        <SkipForward className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {q.status !== 'pending' && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={ar ? 'ارجعها' : 'Reopen'}
                      onClick={() => act(q.id, () => useSmartQuestReopen(q.id))}>
                      <RefreshCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Life changed shortcut */}
      {todays.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="py-3 text-center">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" disabled={planning}
              onClick={async () => {
                const res = await replan(language);
                // no toast here; map tab shows the AI message
              }}>
              <Sparkles className="h-3.5 w-3.5" />
              {ar ? 'مش قادر النهاردة؟ غيّر المسار' : 'Can\'t today? Change the route'}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-1">
              {ar ? 'الهدف لسه ثابت ومفيش لوم' : 'The goal is still fixed — and no guilt'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
