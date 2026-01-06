import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, TrendingDown, Clock, CheckCircle2, BookOpen, Sparkles } from 'lucide-react';
import { StudyInsight } from '@/hooks/useInsights';
import { format, parseISO } from 'date-fns';

interface InsightCardProps {
  insight: StudyInsight;
}

export const InsightCard = ({ insight }: InsightCardProps) => {
  const weekRange = `${format(parseISO(insight.week_start), 'MMM d')} - ${format(parseISO(insight.week_end), 'MMM d, yyyy')}`;
  
  return (
    <div className="space-y-6">
      {/* Week Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Weekly Study Insights</h2>
            <p className="text-sm text-muted-foreground">{weekRange}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          AI Generated
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Study Time</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(insight.total_study_minutes / 60 * 10) / 10}h</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Tasks Done</span>
            </div>
            <p className="text-2xl font-bold">{insight.total_tasks_completed}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-medium">Quizzes</span>
            </div>
            <p className="text-2xl font-bold">{insight.total_quizzes_completed}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium">Avg Score</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(insight.average_quiz_score)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Analysis */}
      {(insight.strongest_subject || insight.weakest_subject) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insight.strongest_subject && (
            <Card className="border-green-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Strongest Subject</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{insight.strongest_subject}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {insight.weakest_subject && insight.weakest_subject !== insight.strongest_subject && (
            <Card className="border-orange-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Needs Improvement</p>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">{insight.weakest_subject}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pattern Analysis */}
      {insight.study_pattern_analysis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Study Pattern Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{insight.study_pattern_analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {insight.improvement_recommendations && insight.improvement_recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Improvement Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insight.improvement_recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <p className="text-muted-foreground pt-0.5">{rec}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Motivation Message */}
      {insight.motivation_message && (
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-lg font-medium italic text-foreground">"{insight.motivation_message}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
