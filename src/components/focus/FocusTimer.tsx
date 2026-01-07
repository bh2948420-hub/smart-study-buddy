import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Coffee, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  onSessionComplete?: (duration: number) => void;
  onStart?: () => void;
  onPause?: () => void;
  studyDuration?: number;
  breakDuration?: number;
}

export const FocusTimer = ({ 
  onSessionComplete, 
  onStart, 
  onPause,
  studyDuration = 25,
  breakDuration = 5,
}: FocusTimerProps) => {
  const { language } = useLanguage();
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState(studyDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const STUDY_DURATION = studyDuration * 60;
  const BREAK_DURATION = breakDuration * 60;

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
      onSessionComplete?.(STUDY_DURATION - timeLeft);
      setSessionsCompleted(prev => prev + 1);
      setMode('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      setMode('study');
      setTimeLeft(STUDY_DURATION);
    }
    setIsRunning(false);
  }, [mode, timeLeft, onSessionComplete, STUDY_DURATION, BREAK_DURATION]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'study') {
        onSessionComplete?.(STUDY_DURATION);
      }
      switchMode();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, switchMode, onSessionComplete, STUDY_DURATION]);

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
            ? (language === 'ar' ? 'وقت التركيز' : 'Focus Time')
            : (language === 'ar' ? 'وقت الراحة' : 'Break Time')}
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

      {/* Sessions completed */}
      <div className="text-center text-muted-foreground">
        <span className="text-sm">
          {language === 'ar' 
            ? `الجلسات المكتملة: ${sessionsCompleted}`
            : `Sessions completed: ${sessionsCompleted}`}
        </span>
      </div>
    </div>
  );
};
