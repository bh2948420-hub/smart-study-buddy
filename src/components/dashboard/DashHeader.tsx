import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck, Globe, Menu } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface DashHeaderProps {
  name: string;
  avatarUrl: string | null;
  unreadCount: number;
  onMenuClick: () => void;
}

// Top header: greeting + language / notifications / profile controls.
export const DashHeader = ({ name, avatarUrl, unreadCount, onMenuClick }: DashHeaderProps) => {
  const { language, setLanguage, dir } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';

  return (
    <header className="mb-6 flex items-start justify-between gap-4" dir={dir}>
      <div className="min-w-0">
        <h1 className="truncate font-display text-3xl font-extrabold text-navy md:text-4xl">
          {ar ? 'أهلًا' : 'Hello'}, {name}! <span className="inline-block animate-bounce-gentle">✨</span>
        </h1>
        <p className="mt-1 text-sm font-bold text-navy/70 md:text-base">
          {ar ? 'خلّي النهاردة خطوة جديدة ناحية هدفك!' : "Let's make today another step towards your goals!"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Mobile menu */}
        <Button variant="ghost" size="icon" className="glass-card rounded-full border-0 text-navy lg:hidden" onClick={onMenuClick} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Language switch */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="glass-card h-10 gap-2 rounded-full border-0 px-4 text-navy">
              <Globe className="h-4 w-4" />
              {ar ? 'English' : 'العربية'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('ar')}>العربية</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="glass-card relative rounded-full border-0 text-navy" aria-label={ar ? 'الإشعارات' : 'Notifications'}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <NotificationsDropdown />
        </DropdownMenu>

        {/* Profile avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-base font-extrabold text-primary-foreground shadow-glow ring-2 ring-white/60 transition-transform hover:scale-105"
          aria-label={ar ? 'الملف الشخصي' : 'Profile'}
        >
          {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
        </button>
      </div>
    </header>
  );
};

const NotificationsDropdown = () => {
  const { language } = useLanguage();
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const recent = notifications.slice(0, 6);

  return (
    <DropdownMenuContent align="end" className="max-h-96 w-80 overflow-y-auto">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="font-bold text-navy">{ar ? 'الإشعارات' : 'Notifications'}</span>
        <button className="flex items-center gap-1 text-xs font-bold text-primary" onClick={() => markAllAsRead()}>
          <CheckCheck className="h-3.5 w-3.5" /> {ar ? 'قرأت الكل' : 'Mark all read'}
        </button>
      </div>
      {recent.length === 0 && (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          {ar ? 'مفيش إشعارات لسه' : 'No notifications yet'}
        </div>
      )}
      {recent.map((n) => (
        <DropdownMenuItem
          key={n.id}
          className={cn('flex flex-col items-start gap-0.5 py-2', !n.is_read && 'bg-primary/5')}
          onClick={() => {
            markAsRead(n.id);
            if (n.link) navigate(n.link);
          }}
        >
          <span className="text-sm font-bold text-navy">{n.title}</span>
          <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  );
};
