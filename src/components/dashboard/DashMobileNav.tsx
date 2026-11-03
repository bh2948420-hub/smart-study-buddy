import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashNavList } from './DashSidebar';

// Mobile navigation drawer — mirrors the desktop glass sidebar
// with the same nav items and logout action.
export const DashMobileNav = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="glass-card rounded-full border-0 text-navy lg:hidden" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={ar ? 'right' : 'left'} className="w-72 overflow-y-auto bg-gradient-sidebar p-4 text-white outline-none">
        <SheetHeader className="mb-4 border-0 p-0">
          <SheetTitle className="font-display text-2xl font-extrabold text-white">SmartEdu</SheetTitle>
        </SheetHeader>
        <DashNavList onNavigate={() => setOpen(false)} />
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/auth');
          }}
          className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/80 transition-all hover:bg-white/10"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>{ar ? 'تسجيل الخروج' : 'Logout'}</span>
        </button>
      </SheetContent>
    </Sheet>
  );
};
