import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { en: 'Home', ar: 'الرئيسية' },
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  chat: { en: 'AI Chat', ar: 'المحادثة الذكية' },
  login: { en: 'Login', ar: 'تسجيل الدخول' },
  signUp: { en: 'Sign Up', ar: 'إنشاء حساب' },
  logout: { en: 'Logout', ar: 'تسجيل الخروج' },
  materials: { en: 'Materials', ar: 'المواد' },
  profile: { en: 'Profile', ar: 'الملف الشخصي' },
  reports: { en: 'Reports', ar: 'التقارير' },
  leaderboard: { en: 'Leaderboard', ar: 'لوحة المتصدرين' },
  insights: { en: 'Insights', ar: 'التحليلات' },
  focusMode: { en: 'Focus Mode', ar: 'وضع التركيز' },

  // Home Page
  heroTitle: { en: 'SmartEdu', ar: 'سمارت إيدو' },
  heroSubtitle: { en: 'Smart Study Assistant', ar: 'مساعدك الذكي للدراسة' },
  heroDescription: {
    en: 'Personalized learning powered by AI. Plan your studies, take quizzes, and get instant help with your curriculum.',
    ar: 'تعلم مخصص بقوة الذكاء الاصطناعي. خطط لدراستك، أجب على الاختبارات، واحصل على مساعدة فورية في مناهجك.',
  },
  getStarted: { en: 'Get Started', ar: 'ابدأ الآن' },
  learnMore: { en: 'Learn More', ar: 'اعرف المزيد' },
  
  // Features
  features: { en: 'Features', ar: 'المميزات' },
  studyPlanner: { en: 'Study Planner', ar: 'مخطط الدراسة' },
  studyPlannerDesc: {
    en: 'Organize your study schedule with calendar and task views',
    ar: 'نظم جدولك الدراسي مع عرض التقويم والمهام',
  },
  aiAssistant: { en: 'AI Assistant', ar: 'المساعد الذكي' },
  aiAssistantDesc: {
    en: 'Get instant answers to your curriculum questions',
    ar: 'احصل على إجابات فورية لأسئلة المنهج',
  },
  quizzes: { en: 'Quizzes & Tests', ar: 'الاختبارات' },
  quizzesDesc: {
    en: 'Test your knowledge with interactive quizzes',
    ar: 'اختبر معلوماتك مع اختبارات تفاعلية',
  },
  breakReminders: { en: 'Break Reminders', ar: 'تذكير الاستراحة' },
  breakRemindersDesc: {
    en: 'Stay fresh with smart break notifications',
    ar: 'حافظ على نشاطك مع تذكيرات الاستراحة الذكية',
  },

  // Dashboard
  welcomeBack: { en: 'Welcome back', ar: 'مرحباً بعودتك' },
  student: { en: 'Student', ar: 'الطالب' },
  todayTasks: { en: "Today's Tasks", ar: 'مهام اليوم' },
  upcomingSessions: { en: 'Upcoming Study Sessions', ar: 'الجلسات الدراسية القادمة' },
  startQuiz: { en: 'Start Quiz', ar: 'ابدأ الاختبار' },
  takeBreak: { en: 'Take a Break', ar: 'خذ استراحة' },
  viewCalendar: { en: 'Calendar View', ar: 'عرض التقويم' },
  viewList: { en: 'List View', ar: 'عرض القائمة' },
  addTask: { en: 'Add Task', ar: 'إضافة مهمة' },
  taskTitle: { en: 'Task Title', ar: 'عنوان المهمة' },
  taskDate: { en: 'Date', ar: 'التاريخ' },
  taskTime: { en: 'Time', ar: 'الوقت' },
  priority: { en: 'Priority', ar: 'الأولوية' },
  high: { en: 'High', ar: 'عالية' },
  medium: { en: 'Medium', ar: 'متوسطة' },
  low: { en: 'Low', ar: 'منخفضة' },
  save: { en: 'Save', ar: 'حفظ' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  noTasks: { en: 'No tasks for today', ar: 'لا توجد مهام لليوم' },

  // Chat
  chatPlaceholder: { en: 'Ask a question about your curriculum...', ar: 'اسأل سؤالاً عن منهجك...' },
  send: { en: 'Send', ar: 'إرسال' },
  chatWelcome: { en: 'Hello! How can I help you with your studies today?', ar: 'مرحباً! كيف يمكنني مساعدتك في دراستك اليوم؟' },
  typing: { en: 'Typing...', ar: 'جاري الكتابة...' },
  uploadCurriculum: { en: 'Upload Curriculum', ar: 'رفع المنهج' },

  // Insights Page
  smartInsights: { en: 'Smart Study Insights', ar: 'تحليلات الدراسة الذكية' },
  insightsDescription: { en: 'AI-powered analysis of your study patterns and personalized recommendations', ar: 'تحليل ذكي لأنماط دراستك وتوصيات مخصصة' },
  generateReport: { en: 'Generate New Report', ar: 'إنشاء تقرير جديد' },
  generating: { en: 'Generating...', ar: 'جاري الإنشاء...' },
  noInsightsYet: { en: 'No Insights Yet', ar: 'لا توجد تحليلات بعد' },
  noInsightsDesc: { en: 'Generate your first weekly study report to get personalized recommendations and discover patterns in your learning journey.', ar: 'أنشئ أول تقرير دراسي أسبوعي للحصول على توصيات مخصصة واكتشاف أنماط في رحلة تعلمك.' },
  generateFirstReport: { en: 'Generate First Report', ar: 'إنشاء التقرير الأول' },
  weeklyInsights: { en: 'Weekly Study Insights', ar: 'تحليلات الدراسة الأسبوعية' },
  weekOf: { en: 'Week of', ar: 'أسبوع' },
  aiGenerated: { en: 'AI Generated', ar: 'تم بواسطة الذكاء الاصطناعي' },
  studyTime: { en: 'Study Time', ar: 'وقت الدراسة' },
  tasksDone: { en: 'Tasks Done', ar: 'المهام المكتملة' },
  avgScore: { en: 'Avg Score', ar: 'متوسط الدرجات' },
  strongestSubject: { en: 'Strongest Subject', ar: 'أقوى مادة' },
  needsImprovement: { en: 'Needs Improvement', ar: 'تحتاج تحسين' },
  studyPatternAnalysis: { en: 'Study Pattern Analysis', ar: 'تحليل نمط الدراسة' },
  improvementRecommendations: { en: 'Improvement Recommendations', ar: 'توصيات التحسين' },

  // Leaderboard
  leaderboardTitle: { en: 'Leaderboard', ar: 'لوحة المتصدرين' },
  leaderboardSubtitle: { en: 'Compete with classmates and climb the ranks', ar: 'تنافس مع زملائك وحقق أعلى المراتب' },
  allTime: { en: 'All Time', ar: 'الكل' },
  weekly: { en: 'Weekly', ar: 'أسبوعي' },
  monthly: { en: 'Monthly', ar: 'شهري' },
  rank: { en: 'Rank', ar: 'المرتبة' },
  level: { en: 'Level', ar: 'المستوى' },
  streak: { en: 'Streak', ar: 'السلسلة' },
  studyHours: { en: 'Study Hours', ar: 'ساعات الدراسة' },
  noDataYet: { en: 'No data yet', ar: 'لا توجد بيانات بعد' },
  topStudents: { en: 'Top Students', ar: 'أفضل الطلاب' },
  yourRank: { en: 'Your Rank', ar: 'ترتيبك' },
  yourProgress: { en: 'Your Progress', ar: 'تقدمك' },
  keepStudying: { en: 'Keep studying to climb the ranks!', ar: 'واصل الدراسة لتحقق مراتب أعلى!' },
  challengeFriends: { en: 'Challenge your friends and earn more XP!', ar: 'تحدى أصدقاءك واكسب المزيد من النقاط!' },

  // Focus Mode
  focusModeTitle: { en: 'Focus Mode', ar: 'وضع التركيز' },
  focusModeSubtitle: { en: 'Stay focused and distraction-free', ar: 'ركز على دراستك بدون تشتيت' },
  focusTime: { en: 'Focus Time', ar: 'وقت التركيز' },
  breakTime: { en: 'Break Time', ar: 'وقت الراحة' },
  sessionsCompleted: { en: 'Sessions completed', ar: 'الجلسات المكتملة' },
  timerSettings: { en: 'Timer Settings', ar: 'إعدادات المؤقت' },
  focusDuration: { en: 'Focus Duration', ar: 'مدة التركيز' },
  breakDuration: { en: 'Break Duration', ar: 'مدة الراحة' },
  pauseNotifications: { en: 'Pause notifications during session', ar: 'إيقاف الإشعارات أثناء الجلسة' },
  focusModeActivated: { en: 'Focus Mode Activated', ar: 'تم تفعيل وضع التركيز' },
  notificationsPaused: { en: 'Notifications paused during your session', ar: 'تم إيقاف الإشعارات مؤقتاً' },
  sessionComplete: { en: 'Session Complete!', ar: 'جلسة مكتملة!' },
  timeForBreak: { en: 'Time for a short break', ar: 'حان وقت الراحة القصيرة' },
  greatWork: { en: 'Great work!', ar: 'أحسنت!' },
  completedFocusSession: { en: 'You completed a focus session', ar: 'أكملت جلسة تركيز' },
  minute: { en: 'min', ar: 'دقيقة' },
  ambientSounds: { en: 'Ambient Sounds', ar: 'الأصوات المحيطة' },
  selectSound: { en: 'Select a sound', ar: 'اختر صوتاً' },
  volume: { en: 'Volume', ar: 'مستوى الصوت' },
  stopSound: { en: 'Stop', ar: 'إيقاف' },

  // Reports
  reportsTitle: { en: 'Reports & Statistics', ar: 'التقارير والإحصائيات' },
  reportsSubtitle: { en: 'Track your progress and achievements', ar: 'تتبع تقدمك وإنجازاتك' },
  totalStudy: { en: 'Total Study', ar: 'إجمالي الدراسة' },
  tasksCompleted: { en: 'Tasks Completed', ar: 'مهام مكتملة' },
  quizzesTaken: { en: 'Quizzes Taken', ar: 'اختبارات' },
  thisWeekStudy: { en: "This Week's Study", ar: 'الدراسة هذا الأسبوع' },
  dailyStudyHours: { en: 'Daily study hours', ar: 'ساعات الدراسة اليومية' },
  tasksDistribution: { en: 'Tasks Distribution', ar: 'توزيع المهام' },
  completionRate: { en: 'completion rate', ar: 'نسبة الإنجاز' },
  quizPerformanceTrend: { en: 'Quiz Performance Trend', ar: 'تطور أداء الاختبارات' },
  lastQuizzes: { en: 'Last 10 quizzes', ar: 'آخر 10 اختبارات' },
  completed: { en: 'Completed', ar: 'مكتملة' },
  pending: { en: 'Pending', ar: 'قيد الانتظار' },

  // Weekly Challenges
  weeklyChallenges: { en: 'Weekly Challenges', ar: 'تحديات الأسبوع' },
  noActiveChallenges: { en: 'No active challenges this week', ar: 'لا توجد تحديات حالية' },
  done: { en: 'Done', ar: 'مكتمل' },
  claimXP: { en: 'Claim XP', ar: 'استلم المكافأة' },
  claimed: { en: 'Claimed', ar: 'تم الاستلام' },

  // Daily Quiz
  dailyQuiz: { en: 'Daily Quiz', ar: 'الاختبار اليومي' },
  quickQuestions: { en: '5 Quick Questions', ar: '5 أسئلة سريعة' },
  twoMinutesChallenge: { en: '2 minutes to complete and earn bonus XP!', ar: 'لديك دقيقتان لإكمال الاختبار واكسب XP إضافي!' },
  startNow: { en: 'Start Now', ar: 'ابدأ الآن' },
  quizResults: { en: 'Quiz Results', ar: 'نتيجة الاختبار' },
  excellent: { en: 'Excellent!', ar: 'ممتاز!' },
  greatJob: { en: 'Great job!', ar: 'جيد جداً!' },
  keepPracticing: { en: 'Keep practicing!', ar: 'استمر في المحاولة!' },
  completedTodayQuiz: { en: "Great job! You completed today's quiz", ar: 'أحسنت! أكملت اختبار اليوم' },
  yourScore: { en: 'Your score', ar: 'نتيجتك' },
  comeBackTomorrow: { en: 'Come back tomorrow for a new quiz!', ar: 'عد غداً لاختبار جديد!' },
  noQuestionsAvailable: { en: 'No questions available. Upload materials and create quizzes first!', ar: 'لا توجد أسئلة متاحة. ارفع بعض المواد وأنشئ اختبارات أولاً!' },
  uploadMaterials: { en: 'Upload Materials', ar: 'رفع المواد' },
  submitQuiz: { en: 'Submit Quiz', ar: 'إنهاء الاختبار' },

  // General
  loading: { en: 'Loading...', ar: 'جاري التحميل...' },
  error: { en: 'An error occurred', ar: 'حدث خطأ' },
  success: { en: 'Success!', ar: 'تم بنجاح!' },
  xpPoints: { en: 'XP', ar: 'نقاط' },
  days: { en: 'days', ar: 'يوم' },
  hours: { en: 'hours', ar: 'ساعات' },
  minutes: { en: 'minutes', ar: 'دقائق' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
