import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Auth from './Auth';
import welcomeHero from '@/assets/welcome-hero.jpg';
import {
  GraduationCap, Rocket, LogIn, PlayCircle, Star, Brain, Trophy, Gift, Globe, ArrowRight, ArrowLeft,
  Bot, Network, Swords, ClipboardCheck,
} from 'lucide-react';

const Index = () => {
  const { language, setLanguage, dir } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const [authTab, setAuthTab] = useState<'login' | 'signup' | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  const features = [
    { icon: Star, title: isAr ? 'مهام ذكية' : 'Smart Quests', sub: isAr ? 'تعلّم ممتع' : 'Fun Learning', color: 'text-warning' },
    { icon: Brain, title: isAr ? 'المساعد الذكي' : 'AI Assistant', sub: isAr ? 'رفيق مذاكرتك' : 'Your Study Buddy', color: 'text-primary' },
    { icon: Trophy, title: isAr ? 'تابع تقدّمك' : 'Track Progress', sub: isAr ? 'اوصل لأعلى' : 'Reach Higher', color: 'text-warning' },
    { icon: Gift, title: isAr ? 'اكسب مكافآت' : 'Earn Rewards', sub: isAr ? 'وإنجازات' : '& Achievements', color: 'text-primary' },
  ];

  const demo = [
    { icon: Bot, title: isAr ? 'لميس — المساعد الذكي' : 'AI Study Buddy', desc: isAr ? 'اسأل أي سؤال في دروسك واحصل على شرح مبسّط فورًا.' : 'Ask anything about your lessons and get simple explanations instantly.' },
    { icon: ClipboardCheck, title: isAr ? 'كويزات ذكية' : 'Smart Quizzes', desc: isAr ? 'اختبارات تتولد من ملفاتك مع تصحيح تلقائي.' : 'Quizzes generated from your own files, auto-graded.' },
    { icon: Network, title: isAr ? 'خرائط ذهنية' : 'Mind Maps', desc: isAr ? 'حوّل أي درس لخريطة ذهنية تفاعلية.' : 'Turn any lesson into an interactive mind map.' },
    { icon: Swords, title: isAr ? 'تحديات مباشرة' : 'Live Battles', desc: isAr ? 'نافس أصحابك في كويز مباشر واكسب نقاط.' : 'Challenge friends in live quiz battles and earn XP.' },
  ];

  return (
    <div dir={dir} className="relative min-h-screen overflow-hidden font-display">
      <img src={welcomeHero} alt="" className={`absolute inset-0 h-full w-full object-cover ${isAr ? 'scale-x-[-1]' : ''}`} />
      <div className={`absolute inset-0 ${isAr ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-background/85 via-background/40 to-transparent`} />

      <div className="relative z-10 flex min-h-screen flex-col px-5 py-5 md:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-9 w-9 text-navy" />
            <span className="text-2xl font-extrabold text-navy">SmartEdu</span>
          </div>
          <Button variant="outline" className="glass-card rounded-full border-0 h-10" onClick={() => setLanguage(isAr ? 'en' : 'ar')}>
            <Globe className="h-4 w-4" /> {isAr ? 'English' : 'العربية'}
          </Button>
        </header>

        <main className="flex flex-1 flex-col justify-center max-w-xl py-10">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-navy">
            {isAr ? 'رحلة تعلّمك' : 'Your learning'}<br />
            {isAr ? 'بتبدأ ' : 'journey '}
            <span className="text-gradient-primary">{isAr ? 'من هنا!' : 'starts here!'}</span>
          </h1>
          <p className="mt-5 text-2xl font-bold text-navy">{isAr ? 'استكشف. اتعلّم. حقّق.' : 'Explore. Learn. Achieve.'}</p>
          <p className="mt-3 border-s-4 border-primary ps-3 text-base text-navy/80 max-w-md">
            {isAr
              ? 'SmartEdu رفيقك الذكي في التعلّم، بيساعدك تذاكر بذكاء وتوصل لأهدافك.'
              : 'SmartEdu is your personalized AI learning companion, helping you study smarter and reach your goals.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button size="lg" className="rounded-full bg-gradient-primary h-12 px-7 text-base shadow-lg" onClick={() => setAuthTab('signup')}>
              <Rocket className="h-5 w-5" /> {isAr ? 'إنشاء حساب' : 'Create Account'} <Arrow className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="glass-card rounded-full h-12 px-7 text-base text-navy" onClick={() => setAuthTab('login')}>
              <LogIn className="h-5 w-5" /> {isAr ? 'تسجيل الدخول' : 'Login'}
            </Button>
          </div>
          <div className="mt-3 w-fit ps-24 text-sm text-navy/60">{isAr ? 'أو' : 'or'}</div>
          <Button variant="outline" className="glass-card mt-2 w-fit rounded-full h-10 px-5 text-navy" onClick={() => setDemoOpen(true)}>
            <PlayCircle className="h-5 w-5 text-primary" /> {isAr ? 'شاهد العرض' : 'Watch Demo'}
          </Button>
        </main>

        <footer className="glass-card mx-auto grid w-full max-w-4xl grid-cols-2 gap-4 p-4 md:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <f.icon className={`h-8 w-8 shrink-0 ${f.color}`} />
              <div>
                <div className="font-bold text-navy leading-tight">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.sub}</div>
              </div>
            </div>
          ))}
        </footer>
      </div>

      <Dialog open={authTab !== null} onOpenChange={(o) => !o && setAuthTab(null)}>
        <DialogContent className="glass-card max-w-md">
          <DialogTitle className="sr-only">{isAr ? 'تسجيل الدخول' : 'Sign in'}</DialogTitle>
          {authTab && <Auth embedded defaultTab={authTab} key={authTab} />}
        </DialogContent>
      </Dialog>

      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="glass-card max-w-2xl" dir={dir}>
          <DialogTitle className="text-2xl font-extrabold text-navy font-display">
            {isAr ? 'اكتشف SmartEdu' : 'Discover SmartEdu'}
          </DialogTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {demo.map((d, i) => (
              <div key={d.title} className="rounded-2xl bg-background/70 p-4 float-slow" style={{ animationDelay: `${i * 0.4}s` }}>
                <d.icon className="h-8 w-8 text-primary" />
                <div className="mt-2 font-bold text-navy">{d.title}</div>
                <p className="text-sm text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
          <Button className="rounded-full bg-gradient-primary" onClick={() => { setDemoOpen(false); setAuthTab('signup'); }}>
            {isAr ? 'ابدأ رحلتك دلوقتي' : 'Start your journey'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
