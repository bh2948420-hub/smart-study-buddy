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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { useStats } from '@/hooks/useStats';
import { AchievementsList } from '@/components/achievements/AchievementsList';
import { supabase } from '@/integrations/supabase/client';
import { User, Settings, Award, Target, Clock, Flame, Save, Loader2, BookOpen, Trophy, BarChart3 } from 'lucide-react';

const Profile = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const { profile, loading, updateProfile } = useProfile();
  const { stats, loading: statsLoading } = useStats();
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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-xs">{language === 'ar' ? 'المستوى' : 'Level'}</span>
              </div>
              <div className="text-2xl font-bold">{profile?.level || 1}</div>
              <Progress value={xpProgress} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs">{language === 'ar' ? 'الالتزام' : 'Streak'}</span>
              </div>
              <div className="text-2xl font-bold">{stats.streakDays} <span className="text-sm font-normal">{language === 'ar' ? 'يوم' : 'days'}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-xs">{language === 'ar' ? 'ساعات الدراسة' : 'Study Hours'}</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalStudyHours}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Trophy className="h-4 w-4 text-green-500" />
                <span className="text-xs">{language === 'ar' ? 'الاختبارات' : 'Quizzes'}</span>
              </div>
              <div className="text-2xl font-bold">{stats.completedQuizzes}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'الإنجازات' : 'Achievements'}</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'الإحصائيات' : 'Statistics'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-6">
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
                        {language === 'ar' ? 'مدة التركيز' : 'Focus (min)'}
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
                        {language === 'ar' ? 'استراحة' : 'Break (min)'}
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
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementsList />
          </TabsContent>

          <TabsContent value="statistics">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'ar' ? 'إجمالي الدراسة' : 'Total Study'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.totalStudyHours}h</div>
                  <p className="text-sm text-muted-foreground">{stats.totalStudyMinutes} {language === 'ar' ? 'دقيقة' : 'minutes'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'ar' ? 'دراسة اليوم' : "Today's Study"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500">{Math.round(stats.todayStudyMinutes / 60 * 10) / 10}h</div>
                  <Progress 
                    value={Math.min(100, (stats.todayStudyMinutes / (profile?.study_goal_minutes || 120)) * 100)} 
                    className="mt-2 h-2" 
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.todayStudyMinutes}/{profile?.study_goal_minutes || 120} {language === 'ar' ? 'دقيقة' : 'min'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{Math.round(stats.weeklyStudyMinutes / 60 * 10) / 10}h</div>
                  <p className="text-sm text-muted-foreground">{stats.totalSessions} {language === 'ar' ? 'جلسة' : 'sessions'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'ar' ? 'الاختبارات المكتملة' : 'Quizzes Completed'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-500">{stats.completedQuizzes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'ar' ? 'متوسط الدرجات' : 'Average Score'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-500">{stats.averageScore}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'ar' ? 'نقاط الخبرة' : 'XP Points'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-500">{profile?.xp_points || 0}</div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? `المستوى ${profile?.level || 1}` : `Level ${profile?.level || 1}`}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
