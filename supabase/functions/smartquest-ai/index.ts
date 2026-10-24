import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, geminiText, GeminiError } from "../_shared/gemini.ts";

// SmartQuest AI engine: untangles thoughts, breaks goals into quests,
// plans a realistic weekly route and replans when real life changes.
// The student's goal stays fixed; only the path may change.

const CATEGORIES = ['school', 'quick', 'fixed', 'personal', 'wish', 'clutter'] as const;
const SUGGESTIONS = ['this_week', 'later', 'thought', 'fixed_event', 'personal_time', 'optional'] as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body?.action;
    const language = body?.language === 'en' ? 'en' : 'ar';

    if (!action || typeof action !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'untangle') {
      const text = typeof body?.text === 'string' ? body.text.trim() : '';
      if (!text || text.length < 5 || text.length > 4000) {
        return new Response(JSON.stringify({ error: 'text must be 5-4000 characters' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const result = await untangle(text, language);
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'plan') {
      const goals = Array.isArray(body?.goals) ? body.goals.filter((g: unknown) => typeof g === 'string' && g.trim()).slice(0, 8) : [];
      if (goals.length === 0) {
        return new Response(JSON.stringify({ error: 'goals must be a non-empty array' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const result = await plan(body, language);
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'replan') {
      const quests = Array.isArray(body?.quests) ? body.quests : [];
      const result = await replan(body, language);
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SmartQuest AI error:', error);
    const status = error instanceof GeminiError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

const untangleSchema = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          category: { type: 'STRING', enum: [...CATEGORIES] },
          suggestion: { type: 'STRING', enum: [...SUGGESTIONS] },
        },
        required: ['title', 'category', 'suggestion'],
      },
    },
    observations: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['items', 'observations'],
};

async function untangle(text: string, language: 'en' | 'ar') {
  const system = language === 'ar'
    ? `أنت جزء من منتج اسمه SmartQuest، شريك ذكي بيساعد الطالب يفرّغ اللي في دماغه ويفهمه.
مهمتك: تستلم كلام الطالب المتشابك اللي هو كتبه/قاله زي ما هو، وتقسمه لعناصر منفصلة عملية.

التصنيفات الممكنة (category):
- school: مسؤوليات مدرسية/دراسية
- quick: مسؤولية سريعة صغيرة (تبعت ملف، ترد على حد)
- fixed: حادثة ثابتة في الوقت (مواعيد، خروجات، امتحان معلوم اليوم)
- personal: حاجات شخصية بتحبها (مسلسل، لعبة، وقت مع الأهل)
- wish: أمنية/حاجة عايز تتعلمها في المستقبل
- clutter: فكرة مشتتة زي "مش عارف أبدأ منين"

والاقتراح (suggestion):
- this_week: مسؤولية حقيقية لازم تخلص الأسبوع ده
- later: حلوة بس مش ضرورية الأسبوع ده
- thought: مجرد فكرة، مش مهمة
- fixed_event: حادثة ثابتة في الوقت
- personal_time: وقت شخصي محمي
- optional: اختيارية خالص

قواعد صارمة:
- اكتب كل عنصر كعنوان قصير واضح (أقل من 8 كلمات) بنفس لغة الطالب.
- ممنوع تماماً أي تشخيص نفسي أو ذكر قلق/اضطراب/أي حالة نفسية.
- كل عنصر لازم يبقى من كلام الطالب نفسه، متخترعش حاجات.
- observations: ملاحظات قصيرة (جملة أو اتنين) تشرح للطالب ربط/تنوع الأفكار، مثل "معظم اللي في دماغك مربوط بمواعيد المدرسة" أو "عندك أشياء منفصلة عن بعض، مش مشكلة واحدة كبيرة". من غير لوم ولا ضغط.
- ردودك بالعربي المصري البسيط.`
    : `You are part of SmartQuest, a smart companion that helps a student empty their head and understand it.
Your job: take the student's mixed, unorganized input and split it into separate practical items.

Categories (category):
- school: school/study responsibilities
- quick: small quick responsibility (send a file, reply to someone)
- fixed: fixed event with a known time (appointment, outing, exam)
- personal: things they personally enjoy (series, gaming, family time)
- wish: a wish / something they want to learn in the future
- clutter: an overloaded thought like "I don't know where to start"

Suggestions (suggestion):
- this_week: real responsibility that should be done this week
- later: nice but not needed this week
- thought: just an idea, not a task
- fixed_event: fixed event with a known time
- personal_time: protected personal time
- optional: fully optional

Strict rules:
- Each item title: short and clear (under 8 words), same language as the student.
- Absolutely no psychological diagnosis, no mention of anxiety, disorders or mental conditions.
- Every item must come from the student's own words, never invent items.
- observations: short notes (1-2 sentences) explaining connections/variety, e.g. "Most of what's on your mind is tied to school deadlines" or "These are separate things, not one huge problem". No guilt, no pressure.`;

  const out = await geminiText({
    system,
    parts: [{ text }],
    temperature: 0.4,
    json: true,
    schema: untangleSchema,
  });
  const parsed = JSON.parse(out);
  if (!Array.isArray(parsed.items)) throw new Error('Bad AI response');
  return {
    items: parsed.items.slice(0, 20),
    observations: Array.isArray(parsed.observations) ? parsed.observations.slice(0, 4) : [],
  };
}

const planSchema = {
  type: 'OBJECT',
  properties: {
    quests: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          goalTitle: { type: 'STRING' },
          title: { type: 'STRING' },
          minutes: { type: 'INTEGER' },
          day: { type: 'INTEGER' },
          slot: { type: 'STRING', enum: ['morning', 'afternoon', 'evening'] },
        },
        required: ['goalTitle', 'title', 'minutes', 'day', 'slot'],
      },
    },
    message: { type: 'STRING' },
  },
  required: ['quests', 'message'],
};

async function plan(body: any, language: 'en' | 'ar') {
  const protectedTime = Array.isArray(body?.protectedTime) ? body.protectedTime : [];
  const prefs = body?.prefs || {};
  const goals: string[] = body.goals;

  const system = language === 'ar'
    ? `أنت محرك التخطيط في SmartQuest. مهمتك تحويل أهداف الأسبوع لرحلة Quests واقعية ومريحة.

فلسفة المنتج (غير قابلة للتفاوض):
- الهدف ثابت، والمسار مرن.
- من الممنوع تخطيط كل دقيقة فاضية. سيب وقت فاضي مقصود.
- وقت الطالب المحمي (نوم، مدرسة، مسلسل، أهل، هوايات) مقدس — متحطش فيه أي Quest.
- لو الوقت مش كفاية، قلل حجم الـ Quests بدل ما تحط اكتر.

المعطيات:
- الأيام: 0=السبت، 1=الأحد، 2=الاثنين، 3=الثلاثاء، 4=الأربعاء، 5=الخميس، 6=الجمعة.
- slots: morning (بعد النوم/المدرسة الصبح)، afternoon (بعد المدرسة)، evening (بالليل قبل النوم).
- الوقت المتاح = الأوقات اللي فيها لا مدرسة ولا نوم ولا وقت محمي.

المطلوب:
- لكل هدف، قسّمه لـ Quests صغيرة واضحة (كل Quest من 15 لـ 60 دقيقة).
- وزعهم على الأيام المتاحة بشكل واقعي، الحاجة اللي ليها deadline أقرب تيجي الأول.
- لو الهدف أصلاً بسيط، Quest واحد يكفي. متضخمش.
- minutes: رقم من 15 لـ 60.
- message: جملة ترحيب قصيرة مشجعة عن الرحلة (بالعامية المصرية، من غير ضغط).

اكتب عناوين الـ Quests بالعربي المصري البسيط.`
    : `You are SmartQuest's planning engine. Turn weekly goals into a realistic, comfortable journey of quests.

Non-negotiable philosophy:
- The goal is fixed, the path is flexible.
- Never plan every free minute. Intentionally leave empty time.
- Protected time (sleep, school, series, family, hobbies) is sacred — no quests inside it.
- If time is tight, make quests smaller instead of adding more.

Data:
- Days: 0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday.
- Slots: morning, afternoon (after school), evening (before sleep).
- Available time = times without school, sleep, or protected blocks.

Required:
- For each goal, split into small clear quests (15-60 minutes each).
- Spread them across available days realistically; closest deadlines first.
- If a goal is simple, one quest is enough. Do not inflate.
- minutes: 15-60.
- message: one short encouraging sentence about the journey (no pressure).

Write quest titles in the student's language, simply.`;

  const prompt = JSON.stringify({
    goals,
    protectedTime,
    prefs: {
      sleepStart: prefs.sleep_start ?? '23:00',
      sleepEnd: prefs.sleep_end ?? '07:00',
      schoolStart: prefs.school_start ?? '08:00',
      schoolEnd: prefs.school_end ?? '15:00',
      studyDays: prefs.study_days ?? '0,1,2,3,4',
    },
    energy: body?.energy ?? 'normal',
  });

  const out = await geminiText({
    system,
    parts: [{ text: prompt }],
    temperature: 0.4,
    json: true,
    schema: planSchema,
  });
  const parsed = JSON.parse(out);
  if (!Array.isArray(parsed.quests)) throw new Error('Bad AI response');
  const quests = parsed.quests
    .filter((q: any) => q && typeof q.title === 'string' && typeof q.goalTitle === 'string')
    .slice(0, 30)
    .map((q: any) => ({
      goalTitle: String(q.goalTitle),
      title: String(q.title),
      minutes: Math.min(90, Math.max(10, Number(q.minutes) || 30)),
      day: Math.min(6, Math.max(0, Number(q.day) || 0)),
      slot: ['morning', 'afternoon', 'evening'].includes(q.slot) ? q.slot : 'afternoon',
    }));
  return { quests, message: typeof parsed.message === 'string' ? parsed.message : '' };
}

const replanSchema = {
  type: 'OBJECT',
  properties: {
    quests: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          goalTitle: { type: 'STRING' },
          title: { type: 'STRING' },
          minutes: { type: 'INTEGER' },
          day: { type: 'INTEGER' },
          slot: { type: 'STRING', enum: ['morning', 'afternoon', 'evening'] },
        },
        required: ['goalTitle', 'title', 'minutes', 'day', 'slot'],
      },
    },
    message: { type: 'STRING' },
  },
  required: ['quests', 'message'],
};

async function replan(body: any, language: 'en' | 'ar') {
  const system = language === 'ar'
    ? `أنت محرك إعادة التخطيط في SmartQuest. حصل تغيير في حياة الطالب (نزهة، ظرف عائلي، تعب، مدرسة زودت حاجة).
دورك تعيد توزيع الـ Quests المتبقية على الأيام المتبقية في الأسبوع بشكل واقعي.

قواعد صارمة:
- الهدف لسه ثابت وأمين. ممنوع أي لوم أو "أنت متأخر" أو "ضايع وقت".
- الـ Quests المكتملة متلمسهاش.
- الوزّع الباقي على الأيام اللي فاضلة، لو الوقت ضيق صغّر حجم الـ Quests.
- رجّع كل Quest بنفس goalTitle اللي جه بيه.
- الأيام: 0=السبت، 1=الأحد، 2=الاثنين، 3=الثلاثاء، 4=الأربعاء، 5=الخميس، 6=الجمعة.
- slots: morning | afternoon | evening.
- minutes من 10 لـ 60.
- message: جملة مطمئنة قصيرة إن الهدف لسه في الأمان والمسار اتظبط (بالعامية المصرية).`
    : `You are SmartQuest's replanning engine. Something changed in the student's real life (outing, family matter, tiredness, extra school work).
Re-distribute the remaining quests across the remaining days of the week realistically.

Strict rules:
- The goal is still fixed and safe. No guilt, no "you are behind", no "you lost time".
- Do not touch completed quests.
- Distribute the rest over remaining days; if time is tight, make quests smaller.
- Return every quest with the same goalTitle it came with.
- Days: 0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday.
- Slots: morning | afternoon | evening.
- minutes: 10-60.
- message: one short reassuring sentence that the goal is still safe and the route is adjusted.`;

  const prompt = JSON.stringify({
    remainingQuests: (body.quests || []).map((q: any) => ({
      goalTitle: q.goalTitle ?? q.goal_title ?? '', title: q.title, minutes: q.minutes, day: q.day, slot: q.slot,
    })),
    completedCount: body.completedCount ?? 0,
    currentDay: body.currentDay ?? 0,
    protectedTime: body.protectedTime ?? [],
    prefs: body.prefs ?? {},
    energy: body.energy ?? 'normal',
    whatChanged: typeof body?.whatChanged === 'string' ? body.whatChanged.slice(0, 500) : undefined,
  });

  const out = await geminiText({
    system,
    parts: [{ text: prompt }],
    temperature: 0.4,
    json: true,
    schema: replanSchema,
  });
  const parsed = JSON.parse(out);
  if (!Array.isArray(parsed.quests)) throw new Error('Bad AI response');
  const quests = parsed.quests.slice(0, 30).map((q: any) => ({
    goalTitle: String(q.goalTitle ?? ''),
    title: String(q.title),
    minutes: Math.min(90, Math.max(10, Number(q.minutes) || 30)),
    day: Math.min(6, Math.max(0, Number(q.day) || 0)),
    slot: ['morning', 'afternoon', 'evening'].includes(q.slot) ? q.slot : 'afternoon',
  }));
  return { quests, message: typeof parsed.message === 'string' ? parsed.message : '' };
}
