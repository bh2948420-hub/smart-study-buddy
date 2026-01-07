import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FocusTimer } from '@/components/focus/FocusTimer';
import { AmbientSoundPlayer } from '@/components/focus/AmbientSoundPlayer';
import { 
  X, 
  Settings2, 
  BellOff, 
  Bell,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const FocusMode = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { startSession, endSession, activeSession } = useStudySessions();
  const { addNotification } = useNotifications();
  
  const [user, setUser] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [studyDuration, setStudyDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [notificationsPaused, setNotificationsPaused] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [navigate]);

  const handleSessionStart = async () => {
    if (!sessionStarted) {
      await startSession(undefined, 'Focus Mode');
      setSessionStarted(true);
      
      if (notificationsPaused) {
        toast({
          title: language === 'ar' ? 'تم تفعيل وضع التركيز' : 'Focus Mode Activated',
          description: language === 'ar' 
            ? 'تم إيقاف الإشعارات مؤقتاً' 
            : 'Notifications paused during your session',
        });
      }
    }
  };

  const handleSessionComplete = async (duration: number) => {
    const minutes = Math.round(duration / 60);
    
    if (activeSession) {
      await endSession();
    }
    
    await addNotification({
      title: language === 'ar' ? 'أحسنت! 🎉' : 'Great work! 🎉',
      message: language === 'ar' 
        ? `أكملت جلسة تركيز لمدة ${minutes} دقيقة`
        : `You completed a ${minutes} minute focus session`,
      type: 'success',
    });

    toast({
      title: language === 'ar' ? 'جلسة مكتملة!' : 'Session Complete!',
      description: language === 'ar' 
        ? 'حان وقت الراحة القصيرة' 
        : 'Time for a short break',
    });
  };

  const handleExit = async () => {
    if (activeSession) {
      await endSession();
    }
    navigate('/dashboard');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!user) return null;

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-b from-background via-background to-muted/20',
      'flex flex-col items-center justify-center p-4 relative'
    )}>
      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleExit}
          className="rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsPaused(!notificationsPaused)}
            className={cn(
              'rounded-full',
              notificationsPaused && 'text-primary'
            )}
          >
            {notificationsPaused ? (
              <BellOff className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="rounded-full"
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={cn('rounded-full', showSettings && 'bg-muted')}
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 max-w-lg w-full">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'وضع التركيز' : 'Focus Mode'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'ركز على دراستك بدون تشتيت'
              : 'Stay focused and distraction-free'}
          </p>
        </div>

        {/* Timer */}
        <FocusTimer
          onSessionComplete={handleSessionComplete}
          onStart={handleSessionStart}
          studyDuration={studyDuration}
          breakDuration={breakDuration}
        />

        {/* Ambient sounds */}
        <Card className="w-full">
          <CardContent className="pt-6">
            <AmbientSoundPlayer />
          </CardContent>
        </Card>

        {/* Settings panel */}
        {showSettings && (
          <Card className="w-full animate-fade-in">
            <CardContent className="pt-6 space-y-6">
              <h3 className="font-medium">
                {language === 'ar' ? 'إعدادات المؤقت' : 'Timer Settings'}
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>
                      {language === 'ar' ? 'مدة التركيز' : 'Focus Duration'}
                    </Label>
                    <span className="text-muted-foreground">
                      {studyDuration} {language === 'ar' ? 'دقيقة' : 'min'}
                    </span>
                  </div>
                  <Slider
                    value={[studyDuration]}
                    onValueChange={(v) => setStudyDuration(v[0])}
                    min={5}
                    max={60}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>
                      {language === 'ar' ? 'مدة الراحة' : 'Break Duration'}
                    </Label>
                    <span className="text-muted-foreground">
                      {breakDuration} {language === 'ar' ? 'دقيقة' : 'min'}
                    </span>
                  </div>
                  <Slider
                    value={[breakDuration]}
                    onValueChange={(v) => setBreakDuration(v[0])}
                    min={1}
                    max={15}
                    step={1}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="pause-notifications">
                    {language === 'ar' 
                      ? 'إيقاف الإشعارات أثناء الجلسة'
                      : 'Pause notifications during session'}
                  </Label>
                  <Switch
                    id="pause-notifications"
                    checked={notificationsPaused}
                    onCheckedChange={setNotificationsPaused}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Motivational quote */}
      <div className="absolute bottom-8 text-center text-muted-foreground text-sm max-w-md px-4">
        <p className="italic">
          {language === 'ar' 
            ? '"النجاح هو مجموع الجهود الصغيرة التي تُكرر يوماً بعد يوم"'
            : '"Success is the sum of small efforts repeated day in and day out"'}
        </p>
      </div>
    </div>
  );
};

export default FocusMode;
