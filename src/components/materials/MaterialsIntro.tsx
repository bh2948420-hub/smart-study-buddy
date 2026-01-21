import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Brain, Sparkles, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function MaterialsIntro() {
  const { language } = useLanguage();

  const t = {
    title: language === 'ar' ? 'مكتبة المواد الذكية' : 'Smart Materials Library',
    subtitle: language === 'ar' 
      ? 'ارفع موادك الدراسية وحولها إلى أدوات تعليمية تفاعلية'
      : 'Upload your study materials and transform them into interactive learning tools',
    features: [
      {
        icon: Brain,
        title: language === 'ar' ? 'تعلم ذكي' : 'Smart Learning',
        desc: language === 'ar' 
          ? 'المساعد الذكي يستخدم موادك للإجابة على أسئلتك'
          : 'AI assistant uses your materials to answer your questions'
      },
      {
        icon: Sparkles,
        title: language === 'ar' ? 'اختبارات تلقائية' : 'Auto Quizzes',
        desc: language === 'ar'
          ? 'أنشئ اختبارات من أي ملف بضغطة واحدة'
          : 'Generate quizzes from any file with one click'
      },
      {
        icon: BarChart3,
        title: language === 'ar' ? 'تحليل متقدم' : 'Advanced Analytics',
        desc: language === 'ar'
          ? 'تتبع تقدمك وحدد نقاط القوة والضعف'
          : 'Track progress and identify strengths and weaknesses'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {t.features.map((feature, index) => (
          <Card key={index} className="border-dashed hover:border-primary/50 transition-colors">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
