import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { GraduationCap, Menu, X, Globe, Trophy, Brain, Focus, Swords, Heart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { t, language, setLanguage, dir } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/dashboard', label: t('dashboard') },
    { to: '/focus', label: language === 'ar' ? 'وضع التركيز' : 'Focus Mode', icon: Focus },
    { to: '/chat', label: t('chat') },
    { to: '/materials', label: language === 'ar' ? 'المواد' : 'Materials' },
    { to: '/quizzes', label: language === 'ar' ? 'الاختبارات' : 'Quizzes' },
    { to: '/leaderboard', label: language === 'ar' ? 'المتصدرين' : 'Leaderboard', icon: Trophy },
    { to: '/challenge', label: language === 'ar' ? 'تحدي مباشر' : 'Live Battle', icon: Swords },
    { to: '/insights', label: language === 'ar' ? 'التحليلات' : 'Insights', icon: Brain },
    { to: '/support', label: language === 'ar' ? 'الدعم النفسي' : 'Support', icon: Heart },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline-block">SmartEdu</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isActive(link.to) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium">{language === 'en' ? 'عربي' : 'EN'}</span>
          </Button>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">{t('login')}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">{t('signUp')}</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block py-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive(link.to) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" className="flex-1" asChild>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  {t('login')}
                </Link>
              </Button>
              <Button size="sm" className="flex-1" asChild>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  {t('signUp')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
