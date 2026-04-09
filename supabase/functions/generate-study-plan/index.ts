import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weakSubjects, studyHoursPerDay, goals, language = 'ar' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = language === 'ar'
      ? `أنت مستشار تعليمي ذكي. مهمتك إنك تعمل خطة دراسية مخصصة للطالب بناءً على المعلومات اللي هيقولهالك. اكتب الخطة بالعربية بشكل منظم وعملي. استخدم إيموجي عشان تكون جذابة. قسم الخطة لـ:
1. 📋 ملخص الحالة
2. 📅 خطة أسبوعية مقترحة  
3. 💡 نصائح لتحسين المواد الضعيفة
4. 🎯 أهداف قصيرة المدى (أسبوع)
5. 🏆 أهداف طويلة المدى (شهر)
6. 💪 رسالة تحفيزية شخصية`
      : `You are a smart educational consultant. Create a personalized study plan based on the student's info. Make it organized and practical with emojis. Sections:
1. 📋 Situation Summary
2. 📅 Suggested Weekly Plan
3. 💡 Tips for Weak Subjects
4. 🎯 Short-term Goals (1 week)
5. 🏆 Long-term Goals (1 month)
6. 💪 Personal Motivational Message`;

    const userPrompt = language === 'ar'
      ? `المواد الضعيفة: ${weakSubjects || 'مش محدد'}
عدد ساعات المذاكرة يومياً: ${studyHoursPerDay || 'مش محدد'}
أهداف الطالب: ${goals || 'مش محدد'}
اعملي خطة دراسية مفصلة ومحفزة!`
      : `Weak subjects: ${weakSubjects || 'Not specified'}
Study hours per day: ${studyHoursPerDay || 'Not specified'}
Student goals: ${goals || 'Not specified'}
Create a detailed and motivating study plan!`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const plan = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
