import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStreakFreeze } from '@/hooks/useStreakFreeze';
import { Loader2, Snowflake, Coins, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export const StreakFreezeShop = () => {
  const { language } = useLanguage();
  const { freezesAvailable, currentXP, freezeCost, canAfford, purchaseFreeze, loading } = useStreakFreeze();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    await purchaseFreeze();
    setPurchasing(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-cyan-500" />
          {language === 'ar' ? 'تجميد السلسلة' : 'Streak Freeze'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? 'احمِ سلسلتك ليوم واحد من عدم النشاط' 
            : 'Protect your streak for one day of inactivity'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current freeze count */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-cyan-500/20">
              <ShieldCheck className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <div className="font-semibold">
                {language === 'ar' ? 'التجميدات المتاحة' : 'Available Freezes'}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'تُستخدم تلقائياً عند تفويت يوم' 
                  : 'Auto-used when you miss a day'}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            ❄️ {freezesAvailable}
          </Badge>
        </div>

        {/* Purchase section */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-cyan-500" />
              <span className="font-medium">
                {language === 'ar' ? 'شراء تجميد' : 'Buy Freeze'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <Coins className="h-4 w-4" />
              {freezeCost} XP
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {language === 'ar' ? 'رصيدك:' : 'Your balance:'}{' '}
              <span className="font-medium text-foreground">{currentXP} XP</span>
            </div>
            <Button 
              onClick={handlePurchase}
              disabled={!canAfford || purchasing}
              size="sm"
              className="gap-2"
            >
              {purchasing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جاري الشراء...' : 'Buying...'}
                </>
              ) : (
                <>
                  <Snowflake className="h-4 w-4" />
                  {language === 'ar' ? 'شراء' : 'Purchase'}
                </>
              )}
            </Button>
          </div>

          {!canAfford && (
            <p className="text-xs text-destructive mt-2">
              {language === 'ar' 
                ? `تحتاج ${freezeCost - currentXP} XP إضافية` 
                : `You need ${freezeCost - currentXP} more XP`}
            </p>
          )}
        </div>

        {/* How it works */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/50">
          <p className="font-medium">
            {language === 'ar' ? 'كيف يعمل:' : 'How it works:'}
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>
              {language === 'ar' 
                ? 'يُستخدم التجميد تلقائياً عند تفويت يوم دراسة' 
                : 'Freeze is auto-used when you miss a study day'}
            </li>
            <li>
              {language === 'ar' 
                ? 'يحمي سلسلتك الحالية من الكسر' 
                : 'Protects your current streak from breaking'}
            </li>
            <li>
              {language === 'ar' 
                ? 'يمكنك تخزين عدة تجميدات' 
                : 'You can store multiple freezes'}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
