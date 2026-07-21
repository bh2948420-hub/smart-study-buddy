import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userRes.user.id;

    const { quizId } = await req.json();
    if (!quizId) throw new Error("quizId required");

    // Admin client to read correct answers server-side
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: quiz, error: qErr } = await admin
      .from("quizzes")
      .select("id, title, subject, user_id")
      .eq("id", quizId)
      .maybeSingle();
    if (qErr || !quiz) throw new Error("Quiz not found");
    if (quiz.user_id !== userId) throw new Error("Access denied");

    const { data: questions } = await admin
      .from("quiz_questions")
      .select("question_text, correct_answer, explanation")
      .eq("quiz_id", quizId)
      .order("order_index");

    if (!questions || questions.length === 0) throw new Error("No questions");

    const summary = questions.slice(0, 10).map((q, i) =>
      `${i + 1}. ${q.question_text}\n   الإجابة: ${q.correct_answer}${q.explanation ? `\n   الشرح: ${q.explanation}` : ""}`
    ).join("\n\n");

    const systemPrompt = `أنت مقيّم تعليمي خبير. مهمتك بناء "سؤال نقل" (Transfer Question) يكشف لو الطالب فهم فعلاً أم مجرد حفظ.

قواعد صارمة:
- السؤال يقيس نفس المفهوم الأساسي في الاختبار الأصلي، لكن بسيناريو/مثال/سياق جديد تماماً لم يظهر في أي سؤال أصلي.
- لا تعيد نفس الأرقام أو نفس الأمثلة أو نفس الصياغة.
- 4 خيارات، واحدة صحيحة فقط، والباقي مموِّهات معقولة.
- صياغة عربية واضحة ومباشرة.
- اذكر الموضوع الأساسي (topic) الذي يقيسه السؤال.
- الشرح يوضّح لماذا الإجابة صحيحة ولماذا الخيارات الأخرى خاطئة.`;

    const userPrompt = `الاختبار الأصلي: "${quiz.title}" - المادة: ${quiz.subject || 'عام'}
أسئلة الاختبار الأصلي وإجاباتها:

${summary}

ولّد سؤال نقل واحد يقيس نفس المفهوم الجوهري بسيناريو مختلف تماماً.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_transfer_question",
            description: "إنشاء سؤال نقل واحد",
            parameters: {
              type: "object",
              properties: {
                question_text: { type: "string" },
                options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                correct_answer: { type: "string", description: "نص الخيار الصحيح بالضبط" },
                explanation: { type: "string" },
                topic: { type: "string", description: "المفهوم الأساسي الذي يقيسه السؤال" },
              },
              required: ["question_text", "options", "correct_answer", "explanation", "topic"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_transfer_question" } },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI error", aiResp.status, text);
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للذكاء الاصطناعي" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      throw new Error(`AI gateway error ${aiResp.status}`);
    }

    const data = await aiResp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("No tool call");
    const parsed = JSON.parse(call.function.arguments);

    // Ensure correct_answer matches one of the options
    if (!parsed.options.includes(parsed.correct_answer)) {
      parsed.correct_answer = parsed.options[0];
    }

    // Save attempt with correct answer hidden from client
    const { data: inserted, error: insErr } = await admin
      .from("transfer_question_attempts")
      .insert({
        user_id: userId,
        quiz_id: quizId,
        question_text: parsed.question_text,
        options: parsed.options,
        correct_answer: parsed.correct_answer,
        explanation: parsed.explanation,
        topic: parsed.topic,
      })
      .select("id, question_text, options, topic")
      .single();

    if (insErr) throw insErr;

    return new Response(JSON.stringify(inserted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-transfer-question error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
