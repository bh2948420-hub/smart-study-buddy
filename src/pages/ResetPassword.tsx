import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const { dir, language } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async () => {
    if (password.length < 6) {
      toast({
        title: isAr ? 'كلمة المرور قصيرة' : 'Password too short',
        description: isAr ? 'لازم 6 أحرف على الأقل' : 'Must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({
        title: isAr ? 'تعذّر تغيير كلمة المرور' : 'Could not update password',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: isAr ? 'تم تغيير كلمة المرور' : 'Password updated',
      description: isAr ? 'تقدر تدخل بكلمة المرور الجديدة' : 'You can now sign in with your new password',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {isAr ? 'تعيين كلمة مرور جديدة' : 'Set a new password'}
          </CardTitle>
          <CardDescription>
            {ready
              ? (isAr ? 'اكتب كلمة المرور الجديدة مرتين' : 'Enter your new password twice')
              : (isAr ? 'افتح الرابط اللي وصلك على الإيميل عشان تكمل' : 'Open the link sent to your email to continue')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">{isAr ? 'كلمة المرور الجديدة' : 'New password'}</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!ready}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{isAr ? 'تأكيد كلمة المرور' : 'Confirm password'}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={!ready}
            />
          </div>
          <Button className="w-full" onClick={handleUpdate} disabled={loading || !ready}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? 'حفظ كلمة المرور' : 'Save password')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
            {isAr ? 'رجوع لتسجيل الدخول' : 'Back to sign in'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
