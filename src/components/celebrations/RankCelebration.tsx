import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Zap, Trophy, Sparkles } from 'lucide-react';

const RANKS = [
  { level: 1, name: 'Beginner', nameAr: 'مبتدئ', icon: '🌱', color: 'from-gray-400 to-gray-500', minXP: 0 },
  { level: 2, name: 'Learner', nameAr: 'متعلم', icon: '📚', color: 'from-green-400 to-green-600', minXP: 100 },
  { level: 3, name: 'Scholar', nameAr: 'دارس', icon: '🎓', color: 'from-blue-400 to-blue-600', minXP: 300 },
  { level: 4, name: 'Expert', nameAr: 'خبير', icon: '⭐', color: 'from-purple-400 to-purple-600', minXP: 600 },
  { level: 5, name: 'Master', nameAr: 'محترف', icon: '👑', color: 'from-amber-400 to-amber-600', minXP: 1000 },
  { level: 6, name: 'Genius', nameAr: 'عبقري', icon: '🧠', color: 'from-pink-400 to-pink-600', minXP: 1500 },
  { level: 7, name: 'Legend', nameAr: 'أسطورة', icon: '🏆', color: 'from-red-400 to-red-600', minXP: 2500 },
  { level: 8, name: 'Champion', nameAr: 'بطل', icon: '💎', color: 'from-cyan-400 to-cyan-600', minXP: 4000 },
  { level: 9, name: 'Titan', nameAr: 'عملاق', icon: '🔥', color: 'from-orange-400 to-orange-600', minXP: 6000 },
  { level: 10, name: 'Immortal', nameAr: 'خالد', icon: '✨', color: 'from-yellow-300 to-yellow-500', minXP: 10000 },
];

const getRankForXP = (xp: number) => {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r;
  }
  return rank;
};

const getNextRank = (currentLevel: number) => {
  return RANKS.find(r => r.level === currentLevel + 1) || null;
};

export const RankCelebration = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [showCelebration, setShowCelebration] = useState(false);
  const [newRank, setNewRank] = useState(RANKS[0]);
  const [xp, setXP] = useState(0);

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    setTimeout(() => {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 }, colors: ['#FFD700', '#FF6B6B', '#4ECDC4'] });
    }, 500);
  }, []);

  useEffect(() => {
    const checkRankUp = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('xp_points, level')
        .eq('user_id', user.id)
        .single();
      if (!profile) return;
      const currentXP = profile.xp_points || 0;
      const storedLevel = profile.level || 1;
      const calculatedRank = getRankForXP(currentXP);
      setXP(currentXP);
      if (calculatedRank.level > storedLevel) {
        setNewRank(calculatedRank);
        setShowCelebration(true);
        fireConfetti();
        await supabase.from('user_profiles').update({ level: calculatedRank.level }).eq('user_id', user.id);
      }
    };
    checkRankUp();
    const interval = setInterval(checkRankUp, 30000);
    return () => clearInterval(interval);
  }, [fireConfetti]);

  const nextRank = getNextRank(newRank.level);
  const xpToNext = nextRank ? nextRank.minXP - xp : 0;

  return (
    <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
      <DialogContent className="sm:max-w-md text-center border-0 bg-gradient-to-b from-background to-muted overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute animate-pulse" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, fontSize: `${Math.random() * 16 + 8}px`, opacity: 0.3 }}>✨</div>
          ))}
        </div>
        <div className="relative z-10 py-4 space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${newRank.color} flex items-center justify-center text-5xl animate-bounce shadow-2xl`}>{newRank.icon}</div>
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold animate-pulse">{newRank.level}</div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">{isAr ? '🎉 ترقية جديدة!' : '🎉 Rank Up!'}</h2>
            <p className="text-muted-foreground mt-1">{isAr ? 'وصلت لمرتبة جديدة!' : 'You reached a new rank!'}</p>
          </div>
          <div className={`text-3xl font-black bg-gradient-to-r ${newRank.color} bg-clip-text text-transparent`}>{isAr ? newRank.nameAr : newRank.name}</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 mx-auto text-amber-500" />
              <div className="text-lg font-bold">{xp}</div>
              <div className="text-[10px] text-muted-foreground">XP</div>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Star className="h-4 w-4 mx-auto text-primary" />
              <div className="text-lg font-bold">{newRank.level}</div>
              <div className="text-[10px] text-muted-foreground">{isAr ? 'المستوى' : 'Level'}</div>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-4 w-4 mx-auto text-emerald-500" />
              <div className="text-lg font-bold">{xpToNext}</div>
              <div className="text-[10px] text-muted-foreground">{isAr ? 'للترقية' : 'To Next'}</div>
            </div>
          </div>
          {nextRank && (
            <p className="text-xs text-muted-foreground">
              {isAr ? `المرتبة القادمة: ${nextRank.icon} ${nextRank.nameAr} (${nextRank.minXP} XP)` : `Next: ${nextRank.icon} ${nextRank.name} (${nextRank.minXP} XP)`}
            </p>
          )}
          <Button onClick={() => setShowCelebration(false)} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            {isAr ? 'يلا نكمل! 💪' : "Let's keep going! 💪"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
