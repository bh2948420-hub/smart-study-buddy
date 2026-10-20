import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, geminiStream } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'en', curriculumContext = '' } = await req.json();

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

    return await geminiStream({
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
