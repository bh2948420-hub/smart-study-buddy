import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, geminiText, imagePart } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weakSubjects, studyHoursPerDay, goals, language = 'ar', scheduleImageBase64 } = await req.json();

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

    let userText: string;
    const parts: any[] = [];

    if (scheduleImageBase64) {
      userText = language === 'ar'
        ? `المواد الضعيفة: ${weakSubjects || 'مش محدد'}
عدد ساعات المذاكرة يومياً: ${studyHoursPerDay || 'مش محدد'}
أهداف الطالب: ${goals || 'مش محدد'}
الصورة المرفقة هي جدول المدرسة. حلل الصورة واستخرج المواد والأوقات.`
        : `Weak subjects: ${weakSubjects || 'Not specified'}
Study hours per day: ${studyHoursPerDay || 'Not specified'}
Student goals: ${goals || 'Not specified'}
The attached image is the school schedule. Analyze it and extract subjects/times.`;
      parts.push({ text: userText }, imagePart(scheduleImageBase64));
    } else {
      userText = language === 'ar'
        ? `المواد الضعيفة: ${weakSubjects || 'مش محدد'}
عدد ساعات المذاكرة يومياً: ${studyHoursPerDay || 'مش محدد'}
أهداف الطالب: ${goals || 'مش محدد'}`
        : `Weak subjects: ${weakSubjects || 'Not specified'}
Study hours per day: ${studyHoursPerDay || 'Not specified'}
Student goals: ${goals || 'Not specified'}`;
      parts.push({ text: userText });
    }

    const rawContent = await geminiText({
      system: systemPrompt,
      parts,
      temperature: 0.7,
      json: true,
    });

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
    const status = (error as any)?.status === 429 ? 429 : 500;
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
