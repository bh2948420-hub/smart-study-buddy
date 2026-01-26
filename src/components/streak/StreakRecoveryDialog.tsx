import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Flame, Coins, AlertTriangle, Loader2, Sparkles } from 'lucide-react';

// XP cost scales with streak length to recover
const calculateRecoveryCost = (previousStreak: number): number => {
  // Base cost of 50 XP, plus 10 XP per day of streak to recover
  // Capped at 500 XP for very long streaks
  return Math.min(50 + previousStreak * 10, 500);
};

interface StreakRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousStreak: number;
  currentXP: number;
  onRecover: () => Promise<void>;
  onDecline: () => void;
}

export const StreakRecoveryDialog = ({
  open,
  onOpenChange,
  previousStreak,
  currentXP,
  onRecover,
  onDecline,
}: StreakRecoveryDialogProps) => {
  const { language } = useLanguage();
  const [recovering, setRecovering] = useState(false);

  const recoveryCost = calculateRecoveryCost(previousStreak);
  const canAfford = currentXP >= recoveryCost;
  const xpAfterRecovery = currentXP - recoveryCost;

  const t = {
    title: language === 'ar' ? '🔥 سلسلتك انقطعت!' : '🔥 Your Streak Broke!',
    description: language === 'ar' 
      ? `كانت لديك سلسلة ${previousStreak} يوم. يمكنك استعادتها باستخدام نقاط الخبرة.`
      : `You had a ${previousStreak}-day streak. You can recover it using XP points.`,
    cost: language === 'ar' ? 'تكلفة الاستعادة' : 'Recovery Cost',
    yourXP: language === 'ar' ? 'نقاطك الحالية' : 'Your XP',
    afterRecovery: language === 'ar' ? 'بعد الاستعادة' : 'After Recovery',
    recover: language === 'ar' ? 'استعادة السلسلة' : 'Recover Streak',
    decline: language === 'ar' ? 'البدء من جديد' : 'Start Fresh',
    recovering: language === 'ar' ? 'جاري الاستعادة...' : 'Recovering...',
    notEnoughXP: language === 'ar' 
      ? 'لا تملك نقاط خبرة كافية للاستعادة'
      : "You don't have enough XP to recover",
    streakWillBe: language === 'ar' ? 'ستصبح سلسلتك' : 'Your streak will be',
    days: language === 'ar' ? 'يوم' : 'days',
  };

  const handleRecover = async () => {
    setRecovering(true);
    try {
      await onRecover();
    } finally {
      setRecovering(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Flame className="h-6 w-6 text-orange-500" />
            {t.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {t.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Streak Preview */}
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Flame className="h-10 w-10 text-orange-500" />
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{previousStreak}</p>
              <p className="text-sm text-muted-foreground">{t.streakWillBe} {previousStreak} {t.days}</p>
            </div>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.cost}</span>
              <span className="font-bold text-destructive flex items-center gap-1">
                <Coins className="h-4 w-4" />
                -{recoveryCost} XP
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.yourXP}</span>
              <span className="font-medium">{currentXP} XP</span>
            </div>

            <Progress 
              value={(recoveryCost / currentXP) * 100} 
              className="h-2"
            />

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">{t.afterRecovery}</span>
              <span className={`font-bold ${canAfford ? 'text-green-500' : 'text-destructive'}`}>
                {canAfford ? xpAfterRecovery : currentXP} XP
              </span>
            </div>
          </div>

          {/* Warning if can't afford */}
          {!canAfford && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {t.notEnoughXP}
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onDecline} className="w-full sm:w-auto">
              {t.decline}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              onClick={handleRecover} 
              disabled={!canAfford || recovering}
              className="w-full sm:w-auto gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {recovering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.recovering}
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  {t.recover}
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { calculateRecoveryCost };
