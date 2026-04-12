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
    const { studentData, language = 'ar' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = language === 'ar'
      ? `أنت محلل أداء أكاديمي متقدم بالذكاء الاصطناعي. مهمتك تحلل بيانات الطالب وتتنبأ بأدائه في الامتحانات القادمة.

مهم جداً: لازم ترد بـ JSON فقط بالشكل ده:
{
  "overall_prediction": {
    "grade": "A+ أو A أو B+ أو B أو C+ أو C أو D أو F",
    "percentage": رقم من 0 لـ 100,
    "confidence": رقم من 0 لـ 100,
    "trend": "improving أو stable أو declining"
  },
  "subject_predictions": [
    {
      "subject": "اسم المادة",
      "predicted_grade": "الدرجة المتوقعة",
      "predicted_percentage": رقم,
      "risk_level": "low أو medium أو high",
      "key_insight": "ملاحظة قصيرة عن المادة دي",
      "action_item": "حاجة عملية يعملها عشان يتحسن"
    }
  ],
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "warnings": ["تحذير 1 لو في حاجة محتاج ينتبهلها"],
  "motivational_message": "رسالة تحفيزية شخصية",
  "study_efficiency_score": رقم من 0 لـ 100,
  "predicted_rank_change": "up أو same أو down"
}

حلل البيانات بدقة:
- نتائج الكويزات = مؤشر قوي للفهم
- إكمال المهام = مؤشر للالتزام
- وقت المذاكرة = مؤشر للجهد
- الـ streak = مؤشر للاستمرارية
- لو مفيش بيانات كافية لمادة، قدّر بناءً على الأداء العام

رد بـ JSON فقط بدون أي نص إضافي.`
      : `You are an advanced AI academic performance analyst. Analyze student data and predict exam performance.

Respond with JSON only:
{
  "overall_prediction": {
    "grade": "A+/A/B+/B/C+/C/D/F",
    "percentage": 0-100,
    "confidence": 0-100,
    "trend": "improving/stable/declining"
  },
  "subject_predictions": [
    {
      "subject": "Subject name",
      "predicted_grade": "Grade",
      "predicted_percentage": number,
      "risk_level": "low/medium/high",
      "key_insight": "Short insight",
      "action_item": "Actionable advice"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "warnings": ["warning if any"],
  "motivational_message": "Personal motivational message",
  "study_efficiency_score": 0-100,
  "predicted_rank_change": "up/same/down"
}

JSON only, no extra text.`;

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
          { role: 'user', content: JSON.stringify(studentData) },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse prediction' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
