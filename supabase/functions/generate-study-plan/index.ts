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
    const { weakSubjects, studyHoursPerDay, goals, language = 'ar', scheduleImageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const today = new Date();
    const dayNames = language === 'ar' 
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Generate next 7 days
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return { date: d.toISOString().split('T')[0], dayName: dayNames[d.getDay()] };
    });

    const daysInfo = next7Days.map(d => `${d.dayName} (${d.date})`).join(', ');

    const systemPrompt = language === 'ar'
      ? `أنت مستشار تعليمي ذكي. مهمتك إنك تعمل خطة دراسية مخصصة للطالب.

مهم جداً: لازم ترد بـ JSON فقط بالشكل ده:
{
  "plan": "النص الكامل للخطة بالماركداون",
  "tasks": [
    {
      "title": "عنوان المهمة",
      "description": "وصف قصير",
      "due_date": "YYYY-MM-DD",
      "priority": "high أو medium أو low"
    }
  ]
}

قواعد مهمة:
1. الخطة (plan) لازم تكون بالماركداون وتشمل:
   - 📋 ملخص الحالة
   - 📅 خطة يومية مفصلة لكل يوم من الأسبوع (مش المواد الضعيفة بس - كل المواد!)
   - 💡 نصائح لتحسين المواد الضعيفة
   - 🎯 أهداف قصيرة المدى
   - 🏆 أهداف طويلة المدى
   - 💪 رسالة تحفيزية

2. المهام (tasks) لازم تكون مهام يومية عملية لكل يوم من الـ 7 أيام الجاية.
   - كل يوم يكون فيه 2-4 مهام على الأقل
   - المهام تشمل كل المواد مش بس الضعيفة
   - المواد الضعيفة تاخد وقت أكتر
   - كل مهمة ليها تاريخ محدد من: ${daysInfo}
   - الأولوية "high" للمواد الضعيفة و"medium" للباقي

3. لو الطالب رفع صورة جدول مدرسي، حللها واستخرج المواد والأوقات واستخدمها في توزيع المهام.

رد بـ JSON فقط بدون أي نص إضافي.`
      : `You are a smart educational consultant. Create a personalized study plan.

IMPORTANT: You MUST respond with JSON only in this format:
{
  "plan": "Full plan text in markdown",
  "tasks": [
    {
      "title": "Task title",
      "description": "Short description",
      "due_date": "YYYY-MM-DD",
      "priority": "high or medium or low"
    }
  ]
}

Rules:
1. The plan (plan) should be in markdown and include:
   - 📋 Situation Summary
   - 📅 Detailed daily plan for each day (ALL subjects, not just weak ones!)
   - 💡 Tips for Weak Subjects
   - 🎯 Short-term Goals
   - 🏆 Long-term Goals
   - 💪 Motivational Message

2. Tasks must be practical daily tasks for the next 7 days.
   - Each day should have 2-4 tasks minimum
   - Tasks cover ALL subjects, not just weak ones
   - Weak subjects get more time
   - Each task has a specific date from: ${daysInfo}
   - Priority "high" for weak subjects, "medium" for others

3. If the student uploaded a school schedule image, analyze it and use subjects/times to distribute tasks.

Respond with JSON only, no extra text.`;

    let userContent: any;
    
    if (scheduleImageBase64) {
      const textPart = language === 'ar'
        ? `المواد الضعيفة: ${weakSubjects || 'مش محدد'}
عدد ساعات المذاكرة يومياً: ${studyHoursPerDay || 'مش محدد'}
أهداف الطالب: ${goals || 'مش محدد'}
الصورة المرفقة هي جدول المدرسة. حلل الصورة واستخرج المواد والأوقات.`
        : `Weak subjects: ${weakSubjects || 'Not specified'}
Study hours per day: ${studyHoursPerDay || 'Not specified'}
Student goals: ${goals || 'Not specified'}
The attached image is the school schedule. Analyze it and extract subjects/times.`;

      userContent = [
        { type: 'text', text: textPart },
        { type: 'image_url', image_url: { url: scheduleImageBase64 } },
      ];
    } else {
      userContent = language === 'ar'
        ? `المواد الضعيفة: ${weakSubjects || 'مش محدد'}
عدد ساعات المذاكرة يومياً: ${studyHoursPerDay || 'مش محدد'}
أهداف الطالب: ${goals || 'مش محدد'}`
        : `Weak subjects: ${weakSubjects || 'Not specified'}
Study hours per day: ${studyHoursPerDay || 'Not specified'}
Student goals: ${goals || 'Not specified'}`;
    }

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
          { role: 'user', content: userContent },
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
    const rawContent = data.choices?.[0]?.message?.content || '';

    // Try to parse as JSON
    let plan = '';
    let tasks: any[] = [];
    
    try {
      // Clean markdown code blocks if present
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      plan = parsed.plan || rawContent;
      tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    } catch {
      // Fallback: use raw content as plan, no auto tasks
      plan = rawContent;
      tasks = [];
    }

    return new Response(JSON.stringify({ plan, tasks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
