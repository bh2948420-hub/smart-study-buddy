import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, geminiText } from "../_shared/gemini.ts";

type Question = {
  question_type: 'multiple_choice' | 'true_false';
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  skill?: string;
  topic?: string;
};

// Detect dominant script of the material to auto-pick the quiz language
function detectLanguage(text: string): 'ar' | 'en' {
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return arabic >= latin ? 'ar' : 'en';
}

const DIFFICULTY_SPEC: Record<string, { ar: string; en: string }> = {
  easy: {
    ar: 'سهل: 60% تذكّر وفهم، 40% تطبيق مباشر. لا أسئلة تحليل معقّدة.',
    en: 'Easy: 60% recall/understanding, 40% direct application. No complex analysis.',
  },
  medium: {
    ar: 'متوسط: 25% فهم، 45% تطبيق، 30% تحليل. الأسئلة تحتاج ربط بين أكثر من فكرة.',
    en: 'Medium: 25% understanding, 45% application, 30% analysis. Questions must connect multiple ideas.',
  },
  hard: {
    ar: 'صعب: 20% تطبيق، 45% تحليل، 35% تقييم/سيناريوهات جديدة لم ترد حرفياً في النص.',
    en: 'Hard: 20% application, 45% analysis, 35% evaluation/novel scenarios not stated verbatim in the text.',
  },
};

function buildSystemPrompt(lang: 'ar' | 'en', difficulty: string, numQuestions: number) {
  const spec = (DIFFICULTY_SPEC[difficulty] || DIFFICULTY_SPEC.medium)[lang];

  if (lang === 'ar') {
    return `أنت خبير قياس وتقويم تربوي (Assessment Designer) بخبرة 15 سنة في بناء اختبارات معيارية عالية الجودة.

مهمتك: بناء اختبار احترافي من ${numQuestions} سؤال بالضبط من المحتوى المُعطى، بجودة أسئلة الامتحانات الرسمية.

## قواعد الجودة (إلزامية)
1. **ممنوع الأسئلة التافهة**: لا تسأل عن عنوان الملف، أرقام الصفحات، اسم المؤلف، تنسيق النص، أو معلومات عامة خارج المحتوى.
2. **كل سؤال يقيس مفهوماً أساسياً** من الدرس، وليس كلمة منعزلة.
3. **مستوى الصعوبة**: ${spec}
4. **تغطية متوازنة**: وزّع الأسئلة على مختلف أقسام المحتوى، ولا تكرّر نفس الفكرة في سؤالين.
5. **صياغة السؤال**: جملة واحدة واضحة، بدون نفي مزدوج، وبدون "أي مما يلي ليس..." إلا نادراً، وبدون تلميح للإجابة داخل السؤال.
6. **جودة المشتّتات (الخيارات الخاطئة)** — أهم معيار:
   - 4 خيارات دائماً لأسئلة الاختيار من متعدد.
   - كل خيار خاطئ يمثّل **خطأً شائعاً حقيقياً** يقع فيه الطالب (خلط بين مفهومين، خطأ في خطوة حسابية، تعميم خاطئ).
   - الخيارات متقاربة في الطول والتركيب النحوي، وممنوع "كل ما سبق" أو "لا شيء مما سبق".
   - ممنوع خيار سخيف أو واضح البطلان.
7. **التوزيع**: 80% اختيار من متعدد و20% صح/خطأ كحد أقصى. أسئلة الصح/الخطأ يجب أن تكون عبارات دقيقة قابلة للجدل ظاهرياً، لا بديهيات.
8. **الإجابة الصحيحة** يجب أن تطابق نص أحد الخيارات حرفياً (وللصح/الخطأ: "صحيح" أو "خطأ" فقط).
9. **الشرح**: 1-3 جمل تفسّر *لماذا* الإجابة صحيحة، و*لماذا* المشتّت الأقرب خاطئ. لا تكتفِ بإعادة الإجابة.
10. **اللغة**: كل النصوص بالعربية الفصحى الأكاديمية (مع إبقاء المصطلحات العلمية الأجنبية كما هي عند اللزوم).
11. حدّد لكل سؤال: \`topic\` (الموضوع الفرعي) و \`skill\` (فهم / تطبيق / تحليل / تقييم).

إن كان المحتوى قصيراً أو ناقصاً، ابنِ الأسئلة على المفاهيم الأساسية للمادة والموضوع المذكور بجودة عالية، ولا تخترع تفاصيل رقمية غير موجودة.`;
  }

  return `You are a senior educational assessment designer with 15 years of experience writing standardized, high-quality exam items.

Task: build a professional quiz of exactly ${numQuestions} items from the provided content, at official exam quality.

## Mandatory quality rules
1. **No trivial questions**: never ask about the file name, page numbers, author, formatting, or generic facts outside the content.
2. **Every item measures a core concept** from the lesson, not an isolated word.
3. **Difficulty**: ${spec}
4. **Balanced coverage**: spread items across the content sections; never test the same idea twice.
5. **Stem wording**: one clear sentence, no double negatives, avoid "which of the following is NOT" except rarely, and never leak the answer in the stem.
6. **Distractor quality** — the most important criterion:
   - Always 4 options for multiple choice.
   - Each wrong option must reflect a **real, common student misconception** (concept confusion, a plausible calculation slip, a faulty generalization).
   - Options must be parallel in length and grammar. Never use "All of the above" or "None of the above".
   - No absurd or obviously invalid options.
7. **Mix**: at least 80% multiple choice, at most 20% true/false. True/false statements must be genuinely debatable, never obvious.
8. **correct_answer must exactly match one option string** (for true/false use exactly "True" or "False").
9. **Explanation**: 1-3 sentences saying *why* the answer is right and *why* the closest distractor is wrong. Do not just restate the answer.
10. **Language**: all text in clear academic English.
11. For each item provide \`topic\` (sub-topic) and \`skill\` (understanding / application / analysis / evaluation).

If the content is short or incomplete, build high-quality items on the core concepts of the stated subject and topic; never invent numeric details that are not present.`;
}

// Repair / validate model output so the student never sees a broken item
function sanitize(questions: Question[], lang: 'ar' | 'en'): Question[] {
  const TRUE = lang === 'ar' ? 'صحيح' : 'True';
  const FALSE = lang === 'ar' ? 'خطأ' : 'False';
  const seen = new Set<string>();
  const out: Question[] = [];

  for (const q of questions) {
    if (!q?.question_text || !q?.correct_answer) continue;
    const key = q.question_text.trim().toLowerCase();
    if (seen.has(key)) continue; // drop duplicates
    seen.add(key);

    if (q.question_type === 'true_false') {
      const isTrue = /^(true|صحيح|صح|نعم)$/i.test(q.correct_answer.trim());
      out.push({
        ...q,
        options: [TRUE, FALSE],
        correct_answer: isTrue ? TRUE : FALSE,
      });
      continue;
    }

    let options = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
    options = Array.from(new Set(options));
    // Reject junk options
    const banned = ['كل ما سبق', 'لا شيء مما سبق', 'all of the above', 'none of the above'];
    options = options.filter((o) => !banned.includes(o.toLowerCase()));
    if (options.length < 3) continue; // unusable item

    const answer = String(q.correct_answer).trim();
    if (!options.some((o) => o.toLowerCase() === answer.toLowerCase())) continue; // answer not in options -> drop

    out.push({
      ...q,
      question_type: 'multiple_choice',
      options,
      correct_answer: options.find((o) => o.toLowerCase() === answer.toLowerCase())!,
    });
  }

  return out;
}

// JSON schema forcing a well-formed quiz object
const QUIZ_SCHEMA = {
  type: 'OBJECT',
  properties: {
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          question_type: { type: 'STRING', enum: ['multiple_choice', 'true_false'] },
          question_text: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correct_answer: { type: 'STRING' },
          explanation: { type: 'STRING' },
          topic: { type: 'STRING' },
          skill: { type: 'STRING', enum: ['understanding', 'application', 'analysis', 'evaluation'] },
        },
        required: ['question_type', 'question_text', 'correct_answer', 'explanation'],
      },
    },
  },
  required: ['questions'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, subject, difficulty, questionCount, language } = await req.json();

    const numQuestions = questionCount || 10;
    const lang: 'ar' | 'en' =
      language === 'ar' || language === 'en'
        ? language
        : detectLanguage(`${content || ''} ${title || ''} ${subject || ''}`);

    const systemPrompt = buildSystemPrompt(lang, difficulty || 'medium', numQuestions);

    const userPrompt = lang === 'ar'
      ? `عنوان الاختبار: "${title}"
المادة: "${subject || 'غير محددة'}"
مستوى الصعوبة: ${difficulty || 'medium'}
عدد الأسئلة المطلوب: ${numQuestions}

المحتوى الدراسي:
"""
${content}
"""

قبل الكتابة: استخرج ذهنياً أهم ${numQuestions} مفهوم في المحتوى، ثم اكتب سؤالاً احترافياً واحداً لكل مفهوم.`
      : `Quiz title: "${title}"
Subject: "${subject || 'unspecified'}"
Difficulty: ${difficulty || 'medium'}
Required item count: ${numQuestions}

Study content:
"""
${content}
"""

Before writing: mentally extract the ${numQuestions} most important concepts in the content, then write one professional item per concept.`;

    const callAI = async (extra?: string) => {
      const raw = await geminiText({
        system: systemPrompt,
        parts: [{ text: extra ? `${userPrompt}\n\n${extra}` : userPrompt }],
        temperature: 0.5,
        json: true,
        schema: QUIZ_SCHEMA,
      });
      return JSON.parse(raw).questions || [];
    };

    let questions: Question[] = [];
    try {
      questions = sanitize(await callAI(), lang);
    } catch (e) {
      const status = (e as any)?.status;
      console.error('AI error:', status, (e as any).message);
      if (status === 429) {
        return new Response(JSON.stringify({ error: lang === 'ar' ? "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً" : "Rate limit exceeded, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    // If too many items were dropped by validation, ask once more for the missing ones
    if (questions.length < Math.min(numQuestions, 3) || questions.length < Math.ceil(numQuestions * 0.7)) {
      const missing = numQuestions - questions.length;
      console.log(`Retrying for ${missing} additional questions (got ${questions.length})`);
      try {
        const retryQuestions = sanitize(await callAI(
          lang === 'ar'
            ? `تنبيه: أعد كتابة الاختبار كاملاً بـ ${numQuestions} سؤال، مع التأكد أن كل سؤال اختيار من متعدد له 4 خيارات مختلفة وأن الإجابة الصحيحة مطابقة حرفياً لأحدها.`
            : `Note: rewrite the full quiz with ${numQuestions} items, ensuring every multiple-choice item has 4 distinct options and correct_answer matches one option exactly.`
        ), lang);
        if (retryQuestions.length > questions.length) questions = retryQuestions;
      } catch (e) {
        console.error('Retry failed:', (e as any).message);
      }
    }

    if (!questions.length) {
      throw new Error("Failed to generate valid questions");
    }

    return new Response(JSON.stringify({ questions: questions.slice(0, numQuestions), language: lang }), {
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
