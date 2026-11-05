import { GraduationCap, Home, Bot, BookOpen, CalendarDays, Compass, Network, ClipboardCheck, BarChart3, LayoutGrid, Trophy, Settings, LogOut, Sparkles } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface DashNavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}

export function useDashNavItems(): DashNavItem[] {
  const { language } = useLanguage();
  const ar = language === 'ar';
  return [
    { to: '/dashboard', label: ar ? 'الرئيسية' : 'Home', icon: Home, end: true },
    { to: '/chat', label: ar ? 'المساعد الذكي' : 'AI Assistant', icon: Bot },
    { to: '/materials', label: ar ? 'موادي الدراسية' : 'My Materials', icon: BookOpen },
    { to: '/study-hub?tab=plan', label: ar ? 'خطة مذاكرتي' : 'My Study Plan', icon: CalendarDays },
    { to: '/quest', label: ar ? 'رحلة SmartQuest' : 'Smart Quest', icon: Compass },
    { to: '/quest?tab=mind', label: ar ? 'عقلي' : 'Mind Space', icon: Network },
    { to: '/quizzes', label: ar ? 'الاختبارات' : 'Quizzes', icon: ClipboardCheck },
    { to: '/reports', label: ar ? 'تقاريري' : 'My Reports', icon: BarChart3 },
    { to: '/study-hub', label: ar ? 'مركز المذاكرة' : 'Study Hub', icon: LayoutGrid },
  ];
}

// Shared nav item list — used by the desktop sidebar and the mobile sheet.
export function DashNavList({ onNavigate }: { onNavigate?: () => void }) {
  const items = useDashNavItems();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
              isActive
                ? 'bg-white/20 text-white shadow-inner'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            )
          }
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// Desktop floating glass sidebar that matches the reference design.
export const DashSidebar = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';

  return (
    <aside className="fixed inset-y-2 start-2 z-40 hidden w-60 flex-col overflow-y-auto rounded-3xl bg-gradient-sidebar p-4 shadow-glow lg:flex">
      {/* Logo */}
      <NavLink to="/dashboard" className="mb-6 flex items-center justify-center gap-2 pt-2">
        <GraduationCap className="h-9 w-9 text-white" />
        <span className="font-display text-2xl font-extrabold text-white">SmartEdu</span>
      </NavLink>

      <DashNavList />

      {/* Encouragement badge */}
      <div className="mt-6 rounded-2xl bg-gradient-gold p-3 text-center shadow-lg">
        <Trophy className="mx-auto h-7 w-7 text-primary-foreground drop-shadow" />
        <p className="mt-1 text-sm font-extrabold leading-snug text-primary-foreground">
          {ar ? 'كمّل! إنت عامل فرق ✨' : 'Keep Going! ✨'}
        </p>
        <p className="text-xs font-bold text-primary-foreground/85">
          {ar ? 'إنت بتعمل رائع' : "You're doing great"}
        </p>
      </div>

      {/* Bottom actions */}
      <div className="mt-auto space-y-1 pt-6">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
              isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            )
          }
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span>{ar ? 'الإعدادات' : 'Settings'}</span>
        </NavLink>
        <button
          onClick={async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            await supabase.auth.signOut();
            navigate('/auth');
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/80 transition-all hover:bg-destructive/20 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>{ar ? 'تسجيل الخروج' : 'Logout'}</span>
        </button>
        <div className="flex items-center justify-center gap-1 pt-2 text-[10px] font-bold text-white/50">
          <Sparkles className="h-3 w-3" /> SmartEdu
        </div>
      </div>
    </aside>
  );
};
