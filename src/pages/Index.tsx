import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';
import {
  GraduationCap,
  Calendar,
  MessageSquare,
  Brain,
  Coffee,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const Index = () => {
  const { t, dir } = useLanguage();

  const features = [
    {
      icon: Calendar,
      title: t('studyPlanner'),
      description: t('studyPlannerDesc'),
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: MessageSquare,
      title: t('aiAssistant'),
      description: t('aiAssistantDesc'),
      color: 'bg-accent/10 text-accent',
    },
    {
      icon: Brain,
      title: t('quizzes'),
      description: t('quizzesDesc'),
      color: 'bg-warning/10 text-warning',
    },
    {
      icon: Coffee,
      title: t('breakReminders'),
      description: t('breakRemindersDesc'),
      color: 'bg-secondary text-secondary-foreground',
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>{dir === 'rtl' ? 'مدعوم بالذكاء الاصطناعي' : 'Powered by AI'}</span>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  {t('heroTitle')}
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                {t('heroSubtitle')}
              </p>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              {t('heroDescription')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="gap-2 text-base" asChild>
                <Link to="/dashboard">
                  {t('getStarted')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link to="/chat">{t('learnMore')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('features')}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {dir === 'rtl'
                ? 'كل ما تحتاجه للتفوق في دراستك'
                : 'Everything you need to excel in your studies'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`inline-flex p-3 rounded-lg ${feature.color} mb-4 transition-transform group-hover:scale-110`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center text-muted-foreground text-sm">
          <p>© 2024 SmartEdu. {dir === 'rtl' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
