import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Calculate week boundaries (last 7 days)
    const now = new Date();
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    // Fetch study sessions for the week
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', now.toISOString());

    // Fetch tasks for the week
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', now.toISOString());

    // Fetch quiz results for the week
    const { data: quizResults } = await supabase
      .from('quiz_results')
      .select('*, quizzes(subject)')
      .eq('user_id', user.id)
      .gte('completed_at', weekStart.toISOString())
      .lte('completed_at', now.toISOString());

    // Calculate statistics
    const totalStudyMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
    const totalTasksCompleted = tasks?.length || 0;
    const totalQuizzesCompleted = quizResults?.length || 0;
    
    const averageQuizScore = quizResults && quizResults.length > 0
      ? quizResults.reduce((sum, r) => sum + r.percentage, 0) / quizResults.length
      : 0;

    // Analyze subjects from quiz results
    const subjectScores: Record<string, { total: number; count: number }> = {};
    quizResults?.forEach(result => {
      const subject = (result.quizzes as any)?.subject || 'General';
      if (!subjectScores[subject]) {
        subjectScores[subject] = { total: 0, count: 0 };
      }
      subjectScores[subject].total += result.percentage;
      subjectScores[subject].count += 1;
    });

    let strongestSubject = null;
    let weakestSubject = null;
    let maxAvg = -1;
    let minAvg = 101;

    Object.entries(subjectScores).forEach(([subject, data]) => {
      const avg = data.total / data.count;
      if (avg > maxAvg) {
        maxAvg = avg;
        strongestSubject = subject;
      }
      if (avg < minAvg) {
        minAvg = avg;
        weakestSubject = subject;
      }
    });

    // Prepare data summary for AI
    const dataSummary = {
      totalStudyHours: Math.round(totalStudyMinutes / 60 * 10) / 10,
      totalTasksCompleted,
      totalQuizzesCompleted,
      averageQuizScore: Math.round(averageQuizScore),
      strongestSubject,
      weakestSubject,
      subjectBreakdown: Object.entries(subjectScores).map(([subject, data]) => ({
        subject,
        averageScore: Math.round(data.total / data.count),
        quizzesTaken: data.count
      }))
    };

    // Generate AI insights using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a supportive study coach analyzing a student's weekly performance. Based on their data, provide:
1. A brief pattern analysis (2-3 sentences about their study habits)
2. 3-4 specific, actionable improvement recommendations
3. A short motivational message (1-2 sentences)

Be encouraging but honest. Focus on practical advice. Respond in JSON format:
{
  "patternAnalysis": "...",
  "recommendations": ["...", "...", "..."],
  "motivationMessage": "..."
}`
          },
          {
            role: 'user',
            content: `Here's my study data for this week:\n${JSON.stringify(dataSummary, null, 2)}`
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate AI insights');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    // Parse AI response
    let parsedAI;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent];
      parsedAI = JSON.parse(jsonMatch[1] || aiContent);
    } catch {
      parsedAI = {
        patternAnalysis: 'Keep up the great work! Your study patterns show dedication.',
        recommendations: [
          'Try to maintain a consistent study schedule',
          'Focus on your weaker subjects for better overall performance',
          'Take regular breaks to stay refreshed'
        ],
        motivationMessage: 'Every minute of study brings you closer to your goals!'
      };
    }

    // Store the insight
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const { data: insight, error: insertError } = await supabase
      .from('study_insights')
      .upsert({
        user_id: user.id,
        week_start: weekStartStr,
        week_end: weekEndStr,
        total_study_minutes: totalStudyMinutes,
        total_tasks_completed: totalTasksCompleted,
        total_quizzes_completed: totalQuizzesCompleted,
        average_quiz_score: averageQuizScore,
        strongest_subject: strongestSubject,
        weakest_subject: weakestSubject,
        study_pattern_analysis: parsedAI.patternAnalysis,
        improvement_recommendations: parsedAI.recommendations,
        motivation_message: parsedAI.motivationMessage,
      }, {
        onConflict: 'user_id,week_start'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-insights:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
