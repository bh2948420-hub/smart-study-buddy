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

  // General
  loading: { en: 'Loading...', ar: 'جاري التحميل...' },
  error: { en: 'An error occurred', ar: 'حدث خطأ' },
  success: { en: 'Success!', ar: 'تم بنجاح!' },
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
