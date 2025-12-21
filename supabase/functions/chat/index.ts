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
    const { messages, language = 'en', curriculumContext = '' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build system prompt with curriculum context
    let systemPrompt = language === 'ar' 
      ? `أنت مساعد دراسة ذكي اسمه "لميس" يساعد الطلاب في فهم المواد الدراسية. أنت ودود ومتعاون وتشرح المفاهيم بوضوح. قدم إجابات مفصلة ومفيدة. استخدم أمثلة عملية عند الإمكان. تحدث باللغة العربية دائماً.`
      : `You are a smart study assistant named "Lamees" helping students understand their curriculum. You are friendly, helpful, and explain concepts clearly. Provide detailed and useful answers. Use practical examples when possible.`;
    
    // Add curriculum context if available
    if (curriculumContext) {
      systemPrompt += language === 'ar'
        ? `\n\nلديك معرفة بالمنهج التالي الذي رفعه الطالب، استخدمه للإجابة على أسئلته:\n${curriculumContext}`
        : `\n\nYou have knowledge of the following curriculum uploaded by the student, use it to answer their questions:\n${curriculumContext}`;
    }

    console.log('Calling AI with messages:', messages.length, 'curriculum context length:', curriculumContext.length);

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
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
