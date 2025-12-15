import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

const Signup = () => {
  const { t, dir, language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Demo mode - simulate signup
    setTimeout(() => {
      setLoading(false);
      toast.success(
        language === 'ar'
          ? 'تم إنشاء الحساب بنجاح! (وضع تجريبي)'
          : 'Account created successfully! (Demo mode)'
      );
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />

      <main className="container py-12 flex items-center justify-center">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <GraduationCap className="h-7 w-7" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t('signUp')}</CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'أنشئ حسابك للبدء'
                : 'Create your account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={language === 'ar' ? 'أحمد محمد' : 'John Doe'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? language === 'ar'
                    ? 'جاري التحميل...'
                    : 'Loading...'
                  : t('signUp')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('login')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Signup;
