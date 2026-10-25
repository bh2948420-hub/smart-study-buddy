import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSmartQuest, DAY_NAMES } from '@/hooks/useSmartQuest';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Brain, Sparkles, Loader2, Eye, Check, Cloud, Zap, Clock, Heart, Star, BookOpen, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_META: Record<string, { icon: typeof BookOpen; ar: string; en: string }> = {
  school: { icon: BookOpen, ar: 'دراسة', en: 'School' },
  quick: { icon: Zap, ar: 'حاجة سريعة', en: 'Quick' },
  fixed: { icon: Clock, ar: 'معاد ثابت', en: 'Fixed event' },
  personal: { icon: Heart, ar: 'حاجة بتحبها', en: 'Personal' },
  wish: { icon: Star, ar: 'حلم/أمنية', en: 'Wish' },
  clutter: { icon: Cloud, ar: 'فكرة مشتتة', en: 'Clutter' },
};

const SUGGESTION_LABEL: Record<string, { ar: string; en: string }> = {
  this_week: { ar: 'الأسبوع ده', en: 'This week' },
  later: { ar: 'بعدين', en: 'Later' },
  thought: { ar: 'مجرد فكرة', en: 'Just a thought' },
  fixed_event: { ar: 'معاد ثابت', en: 'Fixed event' },
  personal_time: { ar: 'وقت محمي ليك', en: 'Protected time' },
  optional: { ar: 'اختياري', en: 'Optional' },
};

interface UntangledItem {
  title: string;
  category: string;
  suggestion: string;
}

export function MindSpace({ onGoMap }: { onGoMap: () => void }) {
  const { language } = useLanguage();
  const { addGoal, addProtected } = useSmartQuest();
  const { toast } = useToast();
  const ar = language === 'ar';

  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [observations, setObservations] = useState<string[]>([]);
  const [items, setItems] = useState<(UntangledItem & { handled: boolean })[]>([]);
  const [dumpId, setDumpId] = useState<string | null>(null);
  const [times, setTimes] = useState<Record<number, { start: string; end: string }>>({});

  const untangle = async () => {
    if (!text.trim() || text.trim().length < 5) {
      toast({ title: ar ? 'اكتب شوية كلام الأول' : 'Write a few words first', variant: 'destructive' });
      return;
    }
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('smartquest-ai', {
        body: { action: 'untangle', text: text.trim(), language },
      });
      if (error) throw error;
      const parsed = data as { items: UntangledItem[]; observations: string[] };
      setItems((parsed.items || []).map((it) => ({ ...it, handled: false })));
      setObservations(parsed.observations || []);
      setDumpId(crypto.randomUUID());
    } catch {
      toast({ title: ar ? 'الشبكة مش راضية… جرب تاني' : 'Something went wrong… try again', variant: 'destructive' });
    } finally {
      setThinking(false);
    }
  };

  // Save every item once, then mark the choice the student makes
  const persistChoice = async (index: number, chosen: string) => {
    const item = items[index];
    if (!dumpId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('sq_thoughts').insert({
      user_id: user.id,
      dump_id: dumpId,
      raw: text.trim(),
      title: item.title,
      category: item.category,
      suggestion: item.suggestion,
      chosen,
    });
  };

  const handleItem = async (index: number, choice: 'goal' | 'protected' | 'keep') => {
    const item = items[index];
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, handled: true } : it)));
    if (choice === 'goal') {
      await addGoal(item.title);
      await persistChoice(index, 'this_week');
      toast({ title: ar ? 'بقى هدف الأسبوع 🎯' : 'Added as a weekly goal 🎯' });
      onGoMap();
    } else if (choice === 'protected') {
      const t = times[index] ?? { start: '19:00', end: '21:00' };
      await addProtected({ title: item.title, days: 'all', start_time: t.start, end_time: t.end });
      await persistChoice(index, 'personal_time');
      toast({ title: ar ? 'وقتك ده بقى محمي 🛡️' : 'This time is now protected 🛡️' });
    } else {
      await persistChoice(index, 'kept');
    }
  };

  const reset = () => {
    setText('');
    setItems([]);
    setObservations([]);
    setDumpId(null);
    setTimes({});
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {ar ? 'فرّغ اللي في دماغك' : 'Empty your head'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {ar
              ? 'اكتب كل اللي مخلٍط في دماغك زي ما هو — مش مهم الترتيب ولا الإملاء. بنفهمه مع بعض.'
              : 'Write everything that\'s tangled in your head as-is — order and spelling don\'t matter. We\'ll untangle it together.'}
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={
              ar
                ? 'مثال: عندي امتحان علوم وكمان المطلوب أبعت ملف للمدرس وأنا مش عارف أبدأ منين وعايز أتابع مسلسلي ولو تقيّم أتعلم جيتار…'
                : 'Example: science exam coming up, also need to email a teacher, no idea where to start, want to watch my show and someday learn guitar…'
            }
          />
          <Button className="w-full gap-2" disabled={thinking} onClick={untangle}>
            {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {thinking ? (ar ? 'بنفهم مع بعض…' : 'Untangling…') : ar ? 'فهّملي اللي في دماغي' : 'Untangle my head'}
          </Button>
        </CardContent>
      </Card>

      {observations.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4 space-y-1.5">
            <p className="text-xs font-medium text-primary flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {ar ? 'بنفهم من كلامك' : 'What we noticed'}
            </p>
            {observations.map((o, i) => (
              <p key={i} className="text-sm text-muted-foreground">· {o}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {ar ? 'اللي طلع من دماغك:' : 'What came out of your head:'}
            </p>
            <Button variant="ghost" size="sm" onClick={reset}>{ar ? 'ابدأ جديد' : 'Start fresh'}</Button>
          </div>
          {items.map((item, i) => {
            const meta = CATEGORY_META[item.category] ?? CATEGORY_META.clutter;
            const CatIcon = meta.icon;
            const isProtectedType = item.suggestion === 'personal_time' || item.suggestion === 'fixed_event';
            return (
              <Card key={i} className={cn(item.handled && 'opacity-55')}>
                <CardContent className="py-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{ar ? meta.ar : meta.en}</Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {SUGGESTION_LABEL[item.suggestion]?.[language] ?? item.suggestion}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {!item.handled ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {item.suggestion === 'this_week' && (
                        <Button size="sm" className="gap-1.5" onClick={() => handleItem(i, 'goal')}>
                          <Check className="h-3.5 w-3.5" />
                          {ar ? 'خلّيه هدف الأسبوع' : 'Make it a weekly goal'}
                        </Button>
                      )}
                      {isProtectedType && (
                        <>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground" dir="ltr">
                            <Input type="time" className="h-7 w-[100px] px-1 text-xs" value={times[i]?.start ?? '19:00'}
                              onChange={(e) => setTimes((p) => ({ ...p, [i]: { start: e.target.value, end: p[i]?.end ?? '21:00' } }))} />
                            <span>→</span>
                            <Input type="time" className="h-7 w-[100px] px-1 text-xs" value={times[i]?.end ?? '21:00'}
                              onChange={(e) => setTimes((p) => ({ ...p, [i]: { start: p[i]?.start ?? '19:00', end: e.target.value } }))} />
                          </div>
                          <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => handleItem(i, 'protected')}>
                            {ar ? 'احميه في وقتي' : 'Protect this time'}
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => handleItem(i, 'keep')}>
                        {ar ? 'خليها فكرة بس' : 'Just keep it as a thought'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{ar ? 'تم ✓' : 'Done ✓'}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
          <Button variant="outline" className="w-full gap-2" onClick={onGoMap}>
            {ar ? 'روح خطة الأسبوع' : 'Go to the week plan'}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      )}
    </div>
  );
}
