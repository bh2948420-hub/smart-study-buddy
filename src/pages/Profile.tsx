import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { User, Settings, Award, Target, Clock, Flame, Save, Loader2 } from 'lucide-react';

const Profile = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const { profile, loading, updateProfile } = useProfile();
  const [userEmail, setUserEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    display_name: '',
    study_goal_minutes: 120,
    pomodoro_duration: 25,
    break_duration: 5,
    notifications_enabled: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      } else {
        setUserEmail(user.email || '');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        study_goal_minutes: profile.study_goal_minutes,
        pomodoro_duration: profile.pomodoro_duration,
        break_duration: profile.break_duration,
        notifications_enabled: profile.notifications_enabled,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
    } finally {
      setSaving(false);
    }
  };

  const xpToNextLevel = profile ? (profile.level * 100) - profile.xp_points : 0;
  const xpProgress = profile ? ((profile.xp_points % 100) / 100) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'إدارة حسابك وإعداداتك' : 'Manage your account and settings'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-yellow-500" />
                {language === 'ar' ? 'المستوى والخبرة' : 'Level & XP'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary">{profile?.level || 1}</div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'المستوى الحالي' : 'Current Level'}
                </p>
              </div>
              <Progress value={xpProgress} className="h-2 mb-2" />
              <p className="text-xs text-center text-muted-foreground">
                {profile?.xp_points || 0} XP - {xpToNextLevel} {language === 'ar' ? 'للمستوى التالي' : 'to next level'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5 text-orange-500" />
                {language === 'ar' ? 'الالتزام' : 'Streak'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500">{profile?.streak_days || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'أيام متتالية' : 'Days in a row'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-green-500" />
                {language === 'ar' ? 'هدف الدراسة' : 'Study Goal'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-500">
                  {Math.floor((profile?.study_goal_minutes || 120) / 60)}h
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'يومياً' : 'per day'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {language === 'ar' ? 'معلومات الحساب' : 'Account Info'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'معلوماتك الشخصية' : 'Your personal information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input value={userEmail} disabled className="mt-1" />
              </div>
              <div>
                <Label htmlFor="display_name">
                  {language === 'ar' ? 'اسم العرض' : 'Display Name'}
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder={language === 'ar' ? 'اسمك' : 'Your name'}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Study Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {language === 'ar' ? 'إعدادات الدراسة' : 'Study Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تخصيص جلسات الدراسة' : 'Customize your study sessions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="study_goal">
                  {language === 'ar' ? 'هدف الدراسة اليومي (دقائق)' : 'Daily Study Goal (minutes)'}
                </Label>
                <Input
                  id="study_goal"
                  type="number"
                  value={formData.study_goal_minutes}
                  onChange={(e) => setFormData({ ...formData, study_goal_minutes: parseInt(e.target.value) || 120 })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pomodoro">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {language === 'ar' ? 'مدة التركيز (دقائق)' : 'Focus Duration (min)'}
                  </Label>
                  <Input
                    id="pomodoro"
                    type="number"
                    value={formData.pomodoro_duration}
                    onChange={(e) => setFormData({ ...formData, pomodoro_duration: parseInt(e.target.value) || 25 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="break">
                    {language === 'ar' ? 'مدة الاستراحة (دقائق)' : 'Break Duration (min)'}
                  </Label>
                  <Input
                    id="break"
                    type="number"
                    value={formData.break_duration}
                    onChange={(e) => setFormData({ ...formData, break_duration: parseInt(e.target.value) || 5 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="flex items-center gap-2 cursor-pointer">
                  {language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
                </Label>
                <Switch
                  id="notifications"
                  checked={formData.notifications_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
