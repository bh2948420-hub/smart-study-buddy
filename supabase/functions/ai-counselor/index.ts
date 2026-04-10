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
    const { messages, language = 'ar' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = language === 'ar'
      ? `أنت مستشار نفسي وتعليمي اسمه "سند" متخصص في دعم الطلاب. دورك إنك:
- تسمع الطالب وتفهم مشكلته سواء كانت دراسية أو نفسية أو اجتماعية
- تديله دعم نفسي ومعنوي وتشجعه
- تديله حلول عملية ومنطقية يقدر يطبقها فعلاً
- لو سقط في مادة، ادعمه نفسياً الأول وبعدين اديله خطة تحسين مدروسة
- لو عنده ضغط أو قلق، ساعده يفهم مشاعره واديله تقنيات للتعامل معاها
- لو عنده مشاكل في البيت، كن متعاطف واديله نصايح عملية

قواعد مهمة:
- كلامك يكون بالعامية المصرية عشان الطالب يحس بالراحة
- متبالغش في التفاؤل، كن واقعي ومتفهم
- لو المشكلة خطيرة (إيذاء نفس، اكتئاب شديد) انصحه يكلم شخص كبير يثق فيه أو متخصص
- خليك إيجابي بس واقعي في نفس الوقت
- استخدم إيموجي بشكل معتدل
- كل رد يكون فيه: تفهم للمشكلة + دعم نفسي + حل عملي`
      : `You are a psychological and educational counselor named "Sanad" specialized in student support. Your role is to:
- Listen to the student and understand their problem whether academic, psychological, or social
- Provide emotional support and encouragement
- Give practical, actionable solutions they can actually implement
- If they failed a subject, first support them emotionally, then provide a structured improvement plan
- If they're stressed or anxious, help them understand their feelings and give coping techniques
- If they have home issues, be empathetic and give practical advice

Important rules:
- Keep your tone warm, friendly, and conversational
- Don't be overly optimistic, be realistic and understanding
- If the issue is serious (self-harm, severe depression), advise them to talk to a trusted adult or professional
- Be positive but realistic
- Use emojis moderately
- Every response should contain: understanding of the problem + emotional support + practical solution`;

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
          ...messages,
        ],
        stream: true,
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
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Counselor error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
