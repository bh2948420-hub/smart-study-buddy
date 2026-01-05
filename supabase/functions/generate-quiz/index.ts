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
    const { content, title, subject, difficulty, questionCount } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const numQuestions = questionCount || 10;
    
    const systemPrompt = `أنت مساعد تعليمي ذكي متخصص في إنشاء اختبارات تعليمية.

مهمتك إنشاء اختبار بناءً على المحتوى المقدم.

يجب أن تكون الأسئلة:
- متنوعة: 70% اختيار متعدد (4 خيارات) و 30% صح/خطأ
- مناسبة لمستوى الصعوبة: ${difficulty || 'متوسط'}
  - سهل: أسئلة مباشرة من النص
  - متوسط: أسئلة تتطلب فهم
  - صعب: أسئلة تتطلب تحليل وتطبيق
- واضحة ومحددة بدون غموض
- تغطي جميع النقاط الأساسية في المحتوى بشكل متوازن
- كل سؤال يجب أن يكون له تفسير للإجابة الصحيحة

أنشئ بالضبط ${numQuestions} سؤال.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `أنشئ اختبار بعنوان "${title}" للمادة "${subject}" بناءً على المحتوى التالي:\n\n${content}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_quiz",
              description: "إنشاء اختبار مع أسئلة متعددة",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_type: { 
                          type: "string", 
                          enum: ["multiple_choice", "true_false"],
                          description: "نوع السؤال"
                        },
                        question_text: { 
                          type: "string",
                          description: "نص السؤال"
                        },
                        options: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "الخيارات المتاحة للإجابة"
                        },
                        correct_answer: { 
                          type: "string",
                          description: "الإجابة الصحيحة"
                        },
                        explanation: { 
                          type: "string",
                          description: "شرح الإجابة الصحيحة"
                        }
                      },
                      required: ["question_type", "question_text", "correct_answer"]
                    }
                  }
                },
                required: ["questions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_quiz" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للمتابعة" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));
    
    // Extract questions from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call response from AI");
    }

    const quizData = JSON.parse(toolCall.function.arguments);
    
    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-quiz function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
