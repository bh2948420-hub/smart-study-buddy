import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, GraduationCap } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('البريد الإلكتروني غير صالح');
const passwordSchema = z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');

const Auth = () => {
  const { dir, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ في البيانات' : 'Validation Error',
        description: error.errors?.[0]?.message || 'Invalid input',
        variant: 'destructive',
      });
      return false;
    }
  };

  const friendlyError = (msg: string) => {
    const isAr = language === 'ar';
    const m = msg.toLowerCase();
    if (m.includes('invalid login credentials')) return isAr ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password';
    if (m.includes('user already registered') || m.includes('already been registered')) return isAr ? 'هذا البريد مسجل بالفعل، اضغط "تسجيل الدخول"' : 'Email already registered — please sign in instead';
    if (m.includes('invalid') && m.includes('email')) return isAr ? 'صيغة البريد غير مقبولة، استخدم بريد حقيقي مثل name@gmail.com' : 'Invalid email — use a real address like name@gmail.com';
    if (m.includes('password') && m.includes('6')) return isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
    if (m.includes('rate limit') || m.includes('too many')) return isAr ? 'محاولات كتير، استنى دقيقة وجرب تاني' : 'Too many attempts, wait a minute and try again';
    if (m.includes('email not confirmed')) return isAr ? 'لازم تأكد البريد من الرسالة المرسلة لك' : 'Please confirm your email first';
    if (m.includes('failed to fetch') || m.includes('network')) return isAr ? 'مشكلة في الاتصال بالإنترنت، جرب تاني' : 'Network problem, please try again';
    return msg;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login Error',
        description: friendlyError(error.message),
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    const isAr = language === 'ar';
    try {
      emailSchema.parse(email);
    } catch {
      toast({
        title: isAr ? 'اكتب بريدك أولاً' : 'Enter your email first',
        description: isAr ? 'اكتب البريد الإلكتروني في الخانة ثم اضغط نسيت كلمة المرور' : 'Type your email in the field, then click forgot password',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({
        title: isAr ? 'تعذّر إرسال الرابط' : 'Could not send link',
        description: friendlyError(error.message),
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: isAr ? 'تم إرسال الرابط' : 'Link sent',
      description: isAr ? 'راجع بريدك واضغط على الرابط لتغيير كلمة المرور' : 'Check your inbox and click the link to reset your password',
    });
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ في التسجيل' : 'Signup Error',
        description: friendlyError(error.message),
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'ar' ? 'تم التسجيل بنجاح' : 'Signup Successful',
        description: language === 'ar' ? 'مرحباً بك!' : 'Welcome!',
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {language === 'ar' ? 'مساعد الدراسة الذكي' : 'Smart Study Assistant'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'سجل دخولك للمتابعة' : 'Sign in to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">
                {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </TabsTrigger>
              <TabsTrigger value="signup">
                {language === 'ar' ? 'حساب جديد' : 'Sign Up'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  language === 'ar' ? 'دخول' : 'Login'
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  language === 'ar' ? 'إنشاء حساب' : 'Create Account'
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
