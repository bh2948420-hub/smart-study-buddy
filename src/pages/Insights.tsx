import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInsights } from '@/hooks/useInsights';
import { InsightCard } from '@/components/insights/InsightCard';
import { Brain, RefreshCw, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const Insights = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { insights, currentInsight, loading: insightsLoading, generating, generateInsight } = useInsights();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [navigate]);

  const handleGenerate = async () => {
    await generateInsight();
    setSelectedIndex(0);
  };

  const selectedInsight = insights[selectedIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Smart Study Insights
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered analysis of your study patterns and personalized recommendations
            </p>
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={generating}
            className="gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate New Report
              </>
            )}
          </Button>
        </div>

        {/* Week Navigation */}
        {insights.length > 1 && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedIndex(Math.min(selectedIndex + 1, insights.length - 1))}
              disabled={selectedIndex >= insights.length - 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedInsight && (
                <>Week of {format(parseISO(selectedInsight.week_start), 'MMM d, yyyy')}</>
              )}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedIndex(Math.max(selectedIndex - 1, 0))}
              disabled={selectedIndex <= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        {insightsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : selectedInsight ? (
          <InsightCard insight={selectedInsight} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Brain className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Insights Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Generate your first weekly study report to get personalized recommendations 
                and discover patterns in your learning journey.
              </p>
              <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate First Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Insights;
