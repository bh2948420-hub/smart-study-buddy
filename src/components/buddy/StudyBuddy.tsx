import { useState } from 'react';
import { useStudyBuddy, BuddyMood } from '@/hooks/useStudyBuddy';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, Minimize2, Maximize2, Smile, Frown, Zap, Coffee, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const moodEmojis: Record<BuddyMood, string> = {
  happy: '😊',
  proud: '🤩',
  worried: '😟',
  excited: '🔥',
  sleepy: '😴',
  thinking: '🤔',
};

const moodColors: Record<BuddyMood, string> = {
  happy: 'from-blue-400 to-cyan-400',
  proud: 'from-yellow-400 to-orange-400',
  worried: 'from-purple-400 to-pink-400',
  excited: 'from-red-400 to-orange-400',
  sleepy: 'from-indigo-400 to-blue-400',
  thinking: 'from-teal-400 to-green-400',
};

const studentMoodOptions = [
  { key: 'motivated', icon: <Zap className="h-4 w-4" />, labelEn: 'Motivated', labelAr: 'متحمس' },
  { key: 'stressed', icon: <Frown className="h-4 w-4" />, labelEn: 'Stressed', labelAr: 'متوتر' },
  { key: 'tired', icon: <Coffee className="h-4 w-4" />, labelEn: 'Tired', labelAr: 'تعبان' },
  { key: 'happy', icon: <Smile className="h-4 w-4" />, labelEn: 'Happy', labelAr: 'مبسوط' },
];

export const StudyBuddy = () => {
  const { mood, message, isVisible, isMinimized, setIsMinimized, studentMood, setStudentMood } = useStudyBuddy();
  const { language } = useLanguage();
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!isVisible || dismissed) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl",
          "bg-gradient-to-br", moodColors[mood],
          "flex items-center justify-center text-3xl",
          "hover:scale-110 transition-all duration-300",
          "animate-bounce-gentle cursor-pointer border-2 border-white/30"
        )}
        aria-label="Open Study Buddy"
      >
        {moodEmojis[mood]}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      {/* Main card */}
      <div className="w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with avatar */}
        <div className={cn("bg-gradient-to-r p-4 flex items-center gap-3", moodColors[mood])}>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl animate-bounce-gentle border-2 border-white/40">
            {moodEmojis[mood]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm">
              {language === 'ar' ? 'صاحب الدراسة' : 'Study Buddy'}
            </h3>
            <p className="text-white/80 text-xs">
              {language === 'ar' ? 'مساعدك الشخصي' : 'Your personal helper'}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setIsMinimized(true)} className="text-white/70 hover:text-white p-1">
              <Minimize2 className="h-4 w-4" />
            </button>
            <button onClick={() => setDismissed(true)} className="text-white/70 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message bubble */}
        <div className="p-4">
          <div className="bg-muted rounded-2xl rounded-tl-sm p-3 text-sm leading-relaxed">
            {message}
          </div>
        </div>

        {/* Mood picker */}
        <div className="px-4 pb-4">
          {!showMoodPicker ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => setShowMoodPicker(true)}
            >
              <MessageCircle className="h-3 w-3" />
              {language === 'ar' ? 'حاسس بإيه النهارده؟' : 'How are you feeling today?'}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                {language === 'ar' ? 'اختار مزاجك:' : 'Pick your mood:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {studentMoodOptions.map(opt => (
                  <Button
                    key={opt.key}
                    variant={studentMood === opt.key ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1 text-xs h-8"
                    onClick={() => {
                      setStudentMood(opt.key);
                      setShowMoodPicker(false);
                    }}
                  >
                    {opt.icon}
                    {language === 'ar' ? opt.labelAr : opt.labelEn}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
