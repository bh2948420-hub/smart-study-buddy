import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============ SmartQuest core data layer ============
// Philosophy: the weekly goal stays fixed, the path can change.

export interface SqGoal {
  id: string;
  user_id: string;
  week_start: string;
  title: string;
  status: string;
  created_at: string;
}

export interface SqQuest {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  minutes: number;
  day: number | null;
  slot: string | null;
  position: number;
  status: string;
  week_start: string;
  created_at: string;
}

export interface SqProtected {
  id: string;
  title: string;
  days: string;
  start_time: string;
  end_time: string;
}

export interface SqPrefs {
  user_id: string;
  sleep_start: string;
  sleep_end: string;
  school_start: string;
  school_end: string;
  study_days: string;
  learned: { text: string }[];
}

export interface SqThought {
  id: string;
  dump_id: string;
  raw: string;
  title: string;
  category: string;
  link: string | null;
  suggestion: string;
  chosen: string | null;
}

export type EnergyLevel = 'light' | 'normal' | 'high';

// Week starts on Saturday (Egypt) → day index 0..6 where 0 = Saturday
export function getWeekStart(d: Date = new Date()): string {
  const date = new Date(d);
  const offset = (date.getDay() + 1) % 7;
  date.setDate(date.getDate() - offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dayIndexOf(d: Date = new Date()): number {
  return (d.getDay() + 1) % 7;
}

export const DAY_NAMES = {
  ar: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
  en: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
};

export const SLOT_ORDER: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };

export function sortQuests(quests: SqQuest[]): SqQuest[] {
  return [...quests].sort((a, b) => {
    const d = (a.day ?? 6) - (b.day ?? 6);
    if (d !== 0) return d;
    const s = (SLOT_ORDER[a.slot ?? 'afternoon'] ?? 1) - (SLOT_ORDER[b.slot ?? 'afternoon'] ?? 1);
    if (s !== 0) return s;
    return a.position - b.position;
  });
}

export function useSmartQuest() {
  const [goals, setGoals] = useState<SqGoal[]>([]);
  const [quests, setQuests] = useState<SqQuest[]>([]);
  const [protectedTime, setProtectedTime] = useState<SqProtected[]>([]);
  const [prefs, setPrefs] = useState<SqPrefs | null>(null);
  const [energy, setEnergyState] = useState<EnergyLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>('');

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const week = getWeekStart();
    const [g, q, p, pr, e] = await Promise.all([
      supabase.from('sq_weekly_goals').select('*').eq('user_id', user.id).eq('week_start', week).order('created_at'),
      supabase.from('sq_quests').select('*').eq('user_id', user.id).eq('week_start', week).order('position'),
      supabase.from('sq_protected_time').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('sq_life_prefs').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('sq_energy').select('level').eq('user_id', user.id).eq('day', week ? new Date().toISOString().slice(0, 10) : week).maybeSingle(),
    ]);
    setGoals((g.data || []) as unknown as SqGoal[]);
    setQuests((q.data || []) as unknown as SqQuest[]);
    setProtectedTime((p.data || []) as unknown as SqProtected[]);
    setPrefs((pr.data || null) as unknown as SqPrefs | null);
    if (e.data) setEnergyState((e.data as any).level);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const userId = async () => (await supabase.auth.getUser()).data.user?.id;

  // ---- Goals ----
  const addGoal = async (title: string): Promise<SqGoal | null> => {
    const uid = await userId();
    if (!uid || !title.trim()) return null;
    const { data, error } = await supabase
      .from('sq_weekly_goals')
      .insert({ user_id: uid, week_start: getWeekStart(), title: title.trim() })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    setGoals((prev) => [...prev, data as unknown as SqGoal]);
    return data as unknown as SqGoal;
  };

  const removeGoal = async (goalId: string) => {
    await supabase.from('sq_weekly_goals').delete().eq('id', goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setQuests((prev) => prev.filter((q) => q.goal_id !== goalId));
  };

  // ---- Quests ----
  const insertQuests = async (rows: Partial<SqQuest>[] & { goal_id: string; title: string; week_start: string }[]) => {
    const uid = await userId();
    if (!uid) return;
    const payload = rows.map((r, i) => ({
      user_id: uid,
      goal_id: r.goal_id,
      title: r.title!,
      minutes: r.minutes ?? 30,
      day: r.day ?? null,
      slot: r.slot ?? 'afternoon',
      position: i,
      week_start: r.week_start,
    }));
    const { data, error } = await supabase.from('sq_quests').insert(payload).select();
    if (error) { console.error(error); return; }
    setQuests((prev) => [...prev, ...(data as unknown as SqQuest[])]);
  };

  // Replace all pending quests of the week with a new AI plan
  const replacePendingQuests = async (newQuests: { goalTitle: string; title: string; minutes: number; day: number; slot: string }[]) => {
    const uid = await userId();
    if (!uid) return;
    const pending = quests.filter((q) => q.status === 'pending');
    if (pending.length) {
      await supabase.from('sq_quests').delete().in('id', pending.map((q) => q.id));
    }
    // Map AI goalTitle → actual goal (loose match, fallback to first goal)
    const matchGoal = (goalTitle: string): string => {
      const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
      const t = norm(goalTitle);
      const exact = goals.find((g) => norm(g.title) === t);
      if (exact) return exact.id;
      const partial = goals.find((g) => norm(g.title).includes(t) || t.includes(norm(g.title)));
      if (partial) return partial.id;
      return goals[0]?.id ?? pending[0]?.goal_id ?? '';
    };
    const week = getWeekStart();
    const payload = newQuests
      .filter((q) => q.title)
      .map((q, i) => ({
        user_id: uid,
        goal_id: matchGoal(q.goalTitle || '') || pending[0]?.goal_id,
        title: q.title,
        minutes: q.minutes ?? 30,
        day: q.day ?? 0,
        slot: q.slot ?? 'afternoon',
        position: i,
        week_start: week,
      }));
    if (!payload.length) { setQuests((prev) => prev.filter((q) => q.status !== 'pending')); return; }
    const { data, error } = await supabase.from('sq_quests').insert(payload).select();
    if (error) { console.error(error); return; }
    setQuests((prev) => [...prev.filter((q) => q.status !== 'pending'), ...(data as unknown as SqQuest[])]);
  };

  // ---- AI planning ----
  const invokeAI = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('smartquest-ai', { body });
    if (error) throw error;
    return data as any;
  };

  const aiContext = () => ({
    protectedTime: protectedTime.map((p) => ({ title: p.title, days: p.days, start: p.start_time, end: p.end_time })),
    prefs: prefs ? {
      sleep_start: prefs.sleep_start, sleep_end: prefs.sleep_end,
      school_start: prefs.school_start, school_end: prefs.school_end, study_days: prefs.study_days,
    } : {},
    energy: energy ?? 'normal',
  });

  const planWeek = async (language: 'en' | 'ar'): Promise<{ ok: boolean; message: string }> => {
    const activeGoals = goals.filter((g) => g.status === 'active');
    if (!activeGoals.length) return { ok: false, message: language === 'ar' ? 'مفيش أهداف لسه' : 'No goals yet' };
    setPlanning(true);
    try {
      const data = await invokeAI({
        action: 'plan',
        language,
        goals: activeGoals.map((g) => g.title),
        ...aiContext(),
      });
      await replacePendingQuests(data.quests || []);
      setAiMessage(data.message || '');
      return { ok: true, message: data.message || '' };
    } catch (err) {
      console.error(err);
      return { ok: false, message: language === 'ar' ? 'حصلت مشكلة، جرب تاني' : 'Something went wrong, try again' };
    } finally {
      setPlanning(false);
    }
  };

  const replan = async (language: 'en' | 'ar', whatChanged?: string): Promise<{ ok: boolean; message: string }> => {
    const pending = quests.filter((q) => q.status === 'pending');
    if (!pending.length) return { ok: false, message: language === 'ar' ? 'مفيش حاجة نعيد تخطيطها' : 'Nothing to replan' };
    setPlanning(true);
    try {
      const goalsById = new Map(goals.map((g) => [g.id, g.title]));
      const data = await invokeAI({
        action: 'replan',
        language,
        whatChanged,
        currentDay: dayIndexOf(),
        completedCount: quests.filter((q) => q.status === 'done').length,
        quests: pending.map((q) => ({
          goalTitle: goalsById.get(q.goal_id) ?? '',
          title: q.title, minutes: q.minutes, day: q.day, slot: q.slot,
        })),
        ...aiContext(),
      });
      await replacePendingQuests(data.quests || []);
      setAiMessage(data.message || '');
      return { ok: true, message: data.message || '' };
    } catch (err) {
      console.error(err);
      return { ok: false, message: language === 'ar' ? 'حصلت مشكلة، جرب تاني' : 'Something went wrong, try again' };
    } finally {
      setPlanning(false);
    }
  };

  // ---- Quest actions (student is always in control) ----
  const completeQuest = async (id: string) => {
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'done' } : q)));
    await supabase.from('sq_quests').update({ status: 'done' }).eq('id', id);
  };

  const skipQuest = async (id: string) => {
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'skipped' } : q)));
    await supabase.from('sq_quests').update({ status: 'skipped' }).eq('id', id);
  };

  const reopenQuest = async (id: string) => {
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'pending' } : q)));
    await supabase.from('sq_quests').update({ status: 'pending' }).eq('id', id);
  };

  const removeQuest = async (id: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== id));
    await supabase.from('sq_quests').delete().eq('id', id);
  };

  // "Make smaller" → split into two smaller quests
  const splitQuest = async (quest: SqQuest) => {
    const half = Math.max(10, Math.round(quest.minutes / 2));
    await supabase.from('sq_quests').update({ title: `${quest.title} (١)`, minutes: half }).eq('id', quest.id);
    const uid = await userId();
    if (!uid) return;
    const { data } = await supabase.from('sq_quests').insert({
      user_id: uid, goal_id: quest.goal_id, title: `${quest.title} (٢)`,
      minutes: half, day: quest.day, slot: quest.slot, position: quest.position + 1, week_start: quest.week_start,
    }).select().single();
    setQuests((prev) => prev.flatMap((q) =>
      q.id === quest.id ? [{ ...q, title: `${q.title} (١)`, minutes: half }, data as unknown as SqQuest] : q,
    ));
  };

  const moveQuest = async (id: string, day: number) => {
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, day } : q)));
    await supabase.from('sq_quests').update({ day }).eq('id', id);
  };

  // ---- Energy ----
  const setEnergy = async (level: EnergyLevel) => {
    const uid = await userId();
    if (!uid) return;
    setEnergyState(level);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('sq_energy').upsert({ user_id: uid, day: today, level }, { onConflict: 'user_id,day' });
  };

  // ---- Protected time ----
  const addProtected = async (p: { title: string; days: string; start_time: string; end_time: string }) => {
    const uid = await userId();
    if (!uid) return;
    const { data, error } = await supabase.from('sq_protected_time').insert({ user_id: uid, ...p }).select().single();
    if (error) { console.error(error); return; }
    setProtectedTime((prev) => [...prev, data as unknown as SqProtected]);
  };

  const removeProtected = async (id: string) => {
    setProtectedTime((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('sq_protected_time').delete().eq('id', id);
  };

  // ---- Life prefs ----
  const updatePrefs = async (patch: Partial<SqPrefs>) => {
    const uid = await userId();
    if (!uid) return;
    const { data } = await supabase
      .from('sq_life_prefs')
      .upsert({ user_id: uid, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single();
    if (data) setPrefs(data as unknown as SqPrefs);
  };

  const addLearned = async (text: string) => {
    if (!prefs) return;
    const learned = [...(prefs.learned || []), { text }].slice(-8);
    await updatePrefs({ learned });
  };

  const removeLearned = async (index: number) => {
    if (!prefs) return;
    const learned = (prefs.learned || []).filter((_, i) => i !== index);
    await updatePrefs({ learned });
  };

  // ---- Week summary ----
  const finishWeek = async (carryTitles: string[], language: 'en' | 'ar') => {
    const uid = await userId();
    if (!uid) return;
    const week = getWeekStart();
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + (7 - dayIndexOf()));
    const nextWeek = getWeekStart(nextWeekDate);
    const summary = {
      goalsTotal: goals.length,
      questsDone: quests.filter((q) => q.status === 'done').length,
      questsTotal: quests.length,
      protectedBlocks: protectedTime.length,
      carriedGoals: carryTitles.length,
    };
    await supabase.from('sq_journeys').upsert({ user_id: uid, week_start: week, summary }, { onConflict: 'user_id,week_start' });
    // mark active goals: done if all quests done, else carried
    for (const g of goals.filter((x) => x.status === 'active')) {
      const gq = quests.filter((q) => q.goal_id === g.id);
      const allDone = gq.length > 0 && gq.every((q) => q.status === 'done');
      const status = allDone ? 'done' : (carryTitles.includes(g.title) ? 'carried' : 'removed');
      await supabase.from('sq_weekly_goals').update({ status }).eq('id', g.id);
      if (carryTitles.includes(g.title)) {
        await supabase.from('sq_weekly_goals').insert({ user_id: uid, week_start: nextWeek, title: g.title });
      }
    }
    void language;
    await refresh();
  };

  const journeys = async () => {
    const uid = await userId();
    if (!uid) return [];
    const { data } = await supabase.from('sq_journeys').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(8);
    return (data || []) as unknown as { week_start: string; summary: Record<string, number> }[];
  };

  return {
    goals, quests, protectedTime, prefs, energy, loading, planning, aiMessage,
    refresh, addGoal, removeGoal,
    completeQuest, skipQuest, reopenQuest, removeQuest, splitQuest, moveQuest,
    planWeek, replan, setEnergy,
    addProtected, removeProtected, updatePrefs, addLearned, removeLearned,
    finishWeek, journeys,
  };
}
