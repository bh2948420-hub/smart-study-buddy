import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export type BuddyMood = 'happy' | 'proud' | 'worried' | 'excited' | 'sleepy' | 'thinking';

interface BuddyMessage {
  text: string;
  mood: BuddyMood;
  priority: number;
}

interface StudentContext {
  streakDays: number;
  tasksToday: number;
  completedToday: number;
  studyMinutesToday: number;
  quizzesCompleted: number;
  averageScore: number;
  lastActiveDate: string | null;
  daysSinceLastActivity: number;
}

export const useStudyBuddy = () => {
  const { language } = useLanguage();
  const [mood, setMood] = useState<BuddyMood>('happy');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [studentMood, setStudentMood] = useState<string | null>(null);
  const [context, setContext] = useState<StudentContext | null>(null);

  const fetchContext = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [tasksRes, sessionsRes, profileRes, quizRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('study_sessions').select('*').eq('user_id', user.id).gte('start_time', today.toISOString()),
        supabase.from('user_profiles').select('streak_days, xp_points').eq('user_id', user.id).single(),
        supabase.from('quiz_results').select('percentage').eq('user_id', user.id),
      ]);

      const todayTasks = (tasksRes.data || []).filter(t => {
        const d = new Date(t.due_date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });

      const todayMinutes = (sessionsRes.data || []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const avgScore = quizRes.data?.length
        ? quizRes.data.reduce((a, r) => a + Number(r.percentage), 0) / quizRes.data.length
        : 0;

      // Check last activity
      const allSessions = await supabase.from('study_sessions').select('start_time').eq('user_id', user.id).order('start_time', { ascending: false }).limit(1);
      const lastActive = allSessions.data?.[0]?.start_time || null;
      const daysSince = lastActive ? Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000) : 999;

      const ctx: StudentContext = {
        streakDays: profileRes.data?.streak_days || 0,
        tasksToday: todayTasks.length,
        completedToday: todayTasks.filter(t => t.completed).length,
        studyMinutesToday: todayMinutes,
        quizzesCompleted: quizRes.data?.length || 0,
        averageScore: Math.round(avgScore),
        lastActiveDate: lastActive,
        daysSinceLastActivity: daysSince,
      };

      setContext(ctx);
      generateMessage(ctx);
    } catch (err) {
      console.error('Buddy context error:', err);
    }
  }, [language, studentMood]);

  const generateMessage = (ctx: StudentContext) => {
    const messages: BuddyMessage[] = [];
    const isAr = language === 'ar';

    // Student mood responses
    if (studentMood === 'stressed') {
      messages.push({
        text: isAr ? 'خد نفس عميق.. أنا معاك خطوة بخطوة 💆‍♂️ يلا نبدأ بمهمة صغيرة!' : "Take a deep breath.. I'm with you step by step 💆‍♂️ Let's start with a small task!",
        mood: 'thinking', priority: 10,
      });
    } else if (studentMood === 'tired') {
      messages.push({
        text: isAr ? 'تعبان؟ لا بأس! خد راحة قصيرة وارجع أقوى 😴☕' : "Tired? No worries! Take a short break and come back stronger 😴☕",
        mood: 'sleepy', priority: 10,
      });
    } else if (studentMood === 'motivated') {
      messages.push({
        text: isAr ? 'ماشاء الله! حماسك عالي 🔥 يلا نستغل الطاقة دي!' : "Amazing energy! 🔥 Let's use this momentum!",
        mood: 'excited', priority: 10,
      });
    }

    // Streak-based
    if (ctx.streakDays >= 30) {
      messages.push({
        text: isAr ? `${ctx.streakDays} يوم سلسلة! أنت أسطورة! 🏆🔥` : `${ctx.streakDays} day streak! You're a legend! 🏆🔥`,
        mood: 'proud', priority: 8,
      });
    } else if (ctx.streakDays >= 7) {
      messages.push({
        text: isAr ? `${ctx.streakDays} يوم متواصل! استمر كدا! 💪` : `${ctx.streakDays} days in a row! Keep it up! 💪`,
        mood: 'happy', priority: 6,
      });
    }

    // Inactivity warning
    if (ctx.daysSinceLastActivity >= 3) {
      messages.push({
        text: isAr ? `وحشتني! من ${ctx.daysSinceLastActivity} أيام مذاكرتش 😢 يلا نبدأ مع بعض!` : `I missed you! It's been ${ctx.daysSinceLastActivity} days 😢 Let's start together!`,
        mood: 'worried', priority: 9,
      });
    } else if (ctx.daysSinceLastActivity >= 1) {
      messages.push({
        text: isAr ? 'مرحبا! جاهز تذاكر النهارده؟ 📚' : "Hi there! Ready to study today? 📚",
        mood: 'happy', priority: 5,
      });
    }

    // Tasks progress
    if (ctx.tasksToday > 0 && ctx.completedToday === ctx.tasksToday) {
      messages.push({
        text: isAr ? 'خلصت كل مهام اليوم! أنت بطل! 🎉✨' : "You finished all today's tasks! You're a champion! 🎉✨",
        mood: 'proud', priority: 9,
      });
    } else if (ctx.tasksToday > 0 && ctx.completedToday > 0) {
      const remaining = ctx.tasksToday - ctx.completedToday;
      messages.push({
        text: isAr ? `فاضلك ${remaining} مهمة بس! يلا خلصها! 💪` : `Only ${remaining} tasks left! Let's finish them! 💪`,
        mood: 'excited', priority: 7,
      });
    } else if (ctx.tasksToday > 0) {
      messages.push({
        text: isAr ? `عندك ${ctx.tasksToday} مهام النهارده. يلا نبدأ! 📝` : `You have ${ctx.tasksToday} tasks today. Let's go! 📝`,
        mood: 'thinking', priority: 4,
      });
    }

    // Study time
    if (ctx.studyMinutesToday >= 60) {
      messages.push({
        text: isAr ? `ذاكرت ${Math.round(ctx.studyMinutesToday / 60)} ساعة النهارده! فخور بيك! 🌟` : `You studied ${Math.round(ctx.studyMinutesToday / 60)}h today! So proud! 🌟`,
        mood: 'proud', priority: 7,
      });
    }

    // Quiz performance
    if (ctx.averageScore >= 80 && ctx.quizzesCompleted > 0) {
      messages.push({
        text: isAr ? `متوسط درجاتك ${ctx.averageScore}%! ممتاز! 🧠✨` : `Your average score is ${ctx.averageScore}%! Excellent! 🧠✨`,
        mood: 'proud', priority: 6,
      });
    } else if (ctx.averageScore > 0 && ctx.averageScore < 50) {
      messages.push({
        text: isAr ? 'المراجعة هتحسن درجاتك! جرب تذاكر من الخريطة الذهنية 🗺️' : "Review will improve your scores! Try the mind map 🗺️",
        mood: 'thinking', priority: 7,
      });
    }

    // Default
    if (messages.length === 0) {
      messages.push({
        text: isAr ? 'أهلاً! أنا صاحبك في الدراسة 😊 يلا نبدأ!' : "Hi! I'm your study buddy 😊 Let's begin!",
        mood: 'happy', priority: 1,
      });
    }

    // Pick highest priority
    const best = messages.sort((a, b) => b.priority - a.priority)[0];
    setMood(best.mood);
    setMessage(best.text);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsVisible(true);
        fetchContext();
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsVisible(true);
        fetchContext();
      } else {
        setIsVisible(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchContext]);

  // Refresh context periodically
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(fetchContext, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isVisible, fetchContext]);

  const setStudentMoodAndRefresh = (newMood: string) => {
    setStudentMood(newMood);
    if (context) {
      // Re-generate with the new mood
      setTimeout(() => fetchContext(), 100);
    }
  };

  return {
    mood,
    message,
    isVisible,
    isMinimized,
    setIsMinimized,
    studentMood,
    setStudentMood: setStudentMoodAndRefresh,
    refreshContext: fetchContext,
  };
};
