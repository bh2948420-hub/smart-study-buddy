import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  onSessionComplete?: (duration: number) => void;
  onStart?: () => void;
  onPause?: () => void;
}

export const PomodoroTimer = ({ onSessionComplete, onStart, onPause }: PomodoroTimerProps) => {
  const { language } = useLanguage();
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [totalStudyTime, setTotalStudyTime] = useState(0);

  const STUDY_DURATION = 25 * 60;
  const BREAK_DURATION = 5 * 60;

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
  }, [mode]);

  const switchMode = useCallback(() => {
    if (mode === 'study') {
      onSessionComplete?.(STUDY_DURATION - timeLeft);
      setMode('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      setMode('study');
      setTimeLeft(STUDY_DURATION);
    }
    setIsRunning(false);
  }, [mode, timeLeft, onSessionComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        if (mode === 'study') {
          setTotalStudyTime((prev) => prev + 1);
        }
      }, 1000);
    } else if (timeLeft === 0) {
      // Time's up!
      if (mode === 'study') {
        onSessionComplete?.(STUDY_DURATION);
      }
      switchMode();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, switchMode, onSessionComplete]);

  return (
    <Card className={cn(
      'transition-colors duration-300',
      mode === 'study' ? 'border-primary/50' : 'border-green-500/50'
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {mode === 'study' ? (
            <>
              <Play className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'وقت الدراسة' : 'Study Time'}
            </>
          ) : (
            <>
              <Coffee className="h-5 w-5 text-green-500" />
              {language === 'ar' ? 'وقت الراحة' : 'Break Time'}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className={cn(
            'text-5xl font-bold font-mono',
            mode === 'study' ? 'text-primary' : 'text-green-500'
          )}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <Progress 
          value={progress} 
          className={cn(
            'h-2',
            mode === 'break' && '[&>div]:bg-green-500'
          )} 
        />

        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <Button onClick={handleStart} className="gap-2">
              <Play className="h-4 w-4" />
              {language === 'ar' ? 'ابدأ' : 'Start'}
            </Button>
          ) : (
            <Button onClick={handlePause} variant="secondary" className="gap-2">
              <Pause className="h-4 w-4" />
              {language === 'ar' ? 'إيقاف مؤقت' : 'Pause'}
            </Button>
          )}
          <Button onClick={handleReset} variant="outline" size="icon">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button onClick={switchMode} variant="outline" className="gap-2">
            <Coffee className="h-4 w-4" />
            {language === 'ar' ? 'تبديل' : 'Switch'}
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {language === 'ar' 
            ? `إجمالي الدراسة اليوم: ${Math.floor(totalStudyTime / 60)} دقيقة`
            : `Total study today: ${Math.floor(totalStudyTime / 60)} minutes`}
        </div>
      </CardContent>
    </Card>
  );
};
