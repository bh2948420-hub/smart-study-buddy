import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashSidebar } from '@/components/dashboard/DashSidebar';
import { DashHeader } from '@/components/dashboard/DashHeader';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Compass, Map, Sun, Brain, HeartHandshake, LogIn } from 'lucide-react';
import { AdventureMap } from '@/components/squest/AdventureMap';
import { TodayQuests } from '@/components/squest/TodayQuests';
import { MindSpace } from '@/components/squest/MindSpace';
import { MyLife } from '@/components/squest/MyLife';
import { cn } from '@/lib/utils';

type Tab = 'map' | 'today' | 'mind' | 'life';

export default function SmartQuest() {
  const { language, dir } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const requestedTab = searchParams.get('tab');
  const tab: Tab = requestedTab === 'today' || requestedTab === 'mind' || requestedTab === 'life' ? requestedTab : 'map';
  const selectTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'map') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setChecking(false);
    });
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof Map }[] = [
    { id: 'map', label: language === 'ar' ? 'رحلة الأسبوع' : 'Week Journey', icon: Map },
    { id: 'today', label: language === 'ar' ? 'النهاردة' : 'Today', icon: Sun },
    { id: 'mind', label: language === 'ar' ? 'تفريغ الدماغ' : 'Mind Dump', icon: Brain },
    { id: 'life', label: language === 'ar' ? 'حياتي' : 'My Life', icon: HeartHandshake },
  ];

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="container py-16">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-10 space-y-4">
            <Compass className="h-12 w-12 mx-auto text-primary" />
            <h1 className="text-xl font-bold">
              {language === 'ar' ? 'رحلتك مستنياك' : 'Your journey awaits'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === 'ar'
                ? 'سجّل دخولك الأول عشان تبدأ رحلة أسبوعك مع SmartQuest'
                : 'Sign in first to start your weekly SmartQuest journey'}
            </p>
            <Button asChild className="gap-2">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageName = profile?.display_name || (language === 'ar' ? 'زميلتي' : 'Student');

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <DashSidebar />
      <main className="px-4 py-6 sm:px-6 lg:ps-[17.5rem] lg:pe-8">
        <DashHeader name={pageName} avatarUrl={profile?.avatar_url ?? null} unreadCount={unreadCount} />
        <div className="container space-y-6 py-2">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-primary/5 px-6 py-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_60%)] opacity-[0.07]" />
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
            <Compass className="h-3.5 w-3.5" />
            SmartQuest
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {language === 'ar' ? 'رحلة أسبوعك' : 'Your Weekly Journey'}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            {language === 'ar'
              ? 'الهدف ثابت… والمسار بيتغيّر براحتك. مفيش لوم، ومفيش ضغط.'
              : 'The goal is fixed… the path can change anytime. No guilt, no pressure.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => selectTab(tb.id)}
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs sm:text-sm font-medium transition-all',
              tab === tb.id
                ? 'bg-primary text-primary-foreground border-primary shadow'
                : 'bg-card text-muted-foreground hover:text-foreground hover:border-primary/40'
            )}
          >
            <tb.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{tb.label}</span>
          </button>
        ))}
      </div>

      {tab === 'map' && <AdventureMap />}
      {tab === 'today' && <TodayQuests onGoLife={() => selectTab('life')} />}
      {tab === 'mind' && <MindSpace onGoMap={() => selectTab('map')} />}
      {tab === 'life' && <MyLife />}
        </div>
      </main>
    </div>
  );
}
