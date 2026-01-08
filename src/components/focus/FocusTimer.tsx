import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Coffee, SkipForward, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  onSessionComplete?: (duration: number) => void;
  onStart?: () => void;
  onPause?: () => void;
  studyDuration?: number;
  breakDuration?: number;
}

// Sound URLs for notifications
const SOUND_URLS = {
  sessionComplete: 'https://cdn.pixabay.com/audio/2022/03/24/audio_d5a1d0d2de.mp3',
  breakComplete: 'https://cdn.pixabay.com/audio/2022/11/21/audio_febc508520.mp3',
  tick: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b24e1.mp3',
};

export const FocusTimer = ({ 
  onSessionComplete, 
  onStart, 
  onPause,
  studyDuration = 25,
  breakDuration = 5,
}: FocusTimerProps) => {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState(studyDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const STUDY_DURATION = studyDuration * 60;
  const BREAK_DURATION = breakDuration * 60;

  // Play sound notification
  const playSound = useCallback((type: 'sessionComplete' | 'breakComplete' | 'tick') => {
    if (!soundEnabled) return;
    
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      const audio = new Audio(SOUND_URLS[type]);
      audio.volume = 0.7;
      audioRef.current = audio;
      
      audio.play().catch((error) => {
        console.log('Audio play failed:', error);
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }, [soundEnabled]);

  // Request notification permission and show browser notification
  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'study' 
    ? ((STUDY_DURATION - timeLeft) / STUDY_DURATION) * 100
    : ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100;

  const handleStart = useCallback(() => {
    setIsRunning(true);
    onStart?.();
  }, [onStart]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    onPause?.();
  }, [onPause]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(mode === 'study' ? STUDY_DURATION : BREAK_DURATION);
  }, [mode, STUDY_DURATION, BREAK_DURATION]);

  const switchMode = useCallback(() => {
    if (mode === 'study') {
      // Study session completed
      onSessionComplete?.(STUDY_DURATION - timeLeft);
      setSessionsCompleted(prev => prev + 1);
      playSound('sessionComplete');
      showNotification(
        language === 'ar' ? 'جلسة مكتملة! 🎉' : 'Session Complete! 🎉',
        language === 'ar' ? 'حان وقت الراحة' : 'Time for a break'
      );
      setMode('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      // Break completed
      playSound('breakComplete');
      showNotification(
        language === 'ar' ? 'انتهت الراحة! 📚' : 'Break Over! 📚',
        language === 'ar' ? 'حان وقت الدراسة' : 'Time to focus'
      );
      setMode('study');
      setTimeLeft(STUDY_DURATION);
    }
    setIsRunning(false);
  }, [mode, timeLeft, onSessionComplete, STUDY_DURATION, BREAK_DURATION, playSound, showNotification, language]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          // Play tick sound at 10, 5, 4, 3, 2, 1 seconds
          if (prev <= 11 && prev > 1) {
            playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      switchMode();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, switchMode, playSound]);

  // Update timeLeft when duration props change
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === 'study' ? studyDuration * 60 : breakDuration * 60);
    }
  }, [studyDuration, breakDuration, mode, isRunning]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* Mode indicator */}
      <div className={cn(
        'flex items-center gap-3 px-6 py-3 rounded-full transition-colors',
        mode === 'study' 
          ? 'bg-primary/10 text-primary' 
          : 'bg-green-500/10 text-green-500'
      )}>
        {mode === 'study' ? (
          <Play className="h-5 w-5" />
        ) : (
          <Coffee className="h-5 w-5" />
        )}
        <span className="text-lg font-medium">
          {mode === 'study' 
            ? t('focusTime')
            : t('breakTime')}
        </span>
      </div>

      {/* Timer display */}
      <div className="relative">
        <div className={cn(
          'w-64 h-64 rounded-full flex items-center justify-center',
          'border-8 transition-colors duration-500',
          mode === 'study' 
            ? 'border-primary/20' 
            : 'border-green-500/20'
        )}>
          <span className={cn(
            'text-6xl font-bold font-mono tracking-tight',
            mode === 'study' ? 'text-primary' : 'text-green-500'
          )}>
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {/* Circular progress overlay */}
        <svg 
          className="absolute inset-0 w-64 h-64 -rotate-90" 
          viewBox="0 0 256 256"
        >
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke={mode === 'study' ? 'hsl(var(--primary))' : '#22c55e'}
            strokeWidth="8"
            strokeDasharray={`${progress * 7.54} 754`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
      </div>

      {/* Progress bar */}
      <Progress 
        value={progress} 
        className={cn(
          'h-2 w-64',
          mode === 'break' && '[&>div]:bg-green-500'
        )} 
      />

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={handleReset} 
          variant="outline" 
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        
        {!isRunning ? (
          <Button 
            onClick={handleStart} 
            size="lg"
            className="h-16 w-16 rounded-full"
          >
            <Play className="h-6 w-6" />
          </Button>
        ) : (
          <Button 
            onClick={handlePause} 
            variant="secondary" 
            size="lg"
            className="h-16 w-16 rounded-full"
          >
            <Pause className="h-6 w-6" />
          </Button>
        )}
        
        <Button 
          onClick={switchMode} 
          variant="outline" 
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Sound toggle and sessions completed */}
      <div className="flex items-center justify-center gap-6 text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(
            'gap-2',
            soundEnabled && 'text-primary'
          )}
        >
          <Volume2 className="h-4 w-4" />
          <span className="text-sm">
            {soundEnabled 
              ? (language === 'ar' ? 'الصوت مفعل' : 'Sound On')
              : (language === 'ar' ? 'الصوت مغلق' : 'Sound Off')}
          </span>
        </Button>
        
        <span className="text-sm">
          {t('sessionsCompleted')}: {sessionsCompleted}
        </span>
      </div>
    </div>
  );
};
