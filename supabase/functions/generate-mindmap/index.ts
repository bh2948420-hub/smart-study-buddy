const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders as sharedCors, geminiText } from '../_shared/gemini.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: sharedCors })
  }

  try {
    const { materialId, content, language } = await req.json()

    if (!content && !materialId) {
      return new Response(JSON.stringify({ error: 'content or materialId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let textContent = content || ''

    // If materialId provided, fetch content
    if (materialId && !content) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data } = await supabase
        .from('curriculum_context')
        .select('content_text')
        .eq('id', materialId)
        .single()

      if (data?.content_text) {
        textContent = data.content_text
      }
    }

    if (!textContent) {
      return new Response(JSON.stringify({ error: 'No content found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Truncate to avoid token limits
    const truncated = textContent.substring(0, 6000)
    const isAr = language === 'ar'

    const prompt = isAr
      ? `حلل النص التالي وأنشئ خريطة ذهنية منظمة. أرجع JSON فقط بالشكل التالي:
{
  "title": "العنوان الرئيسي",
  "nodes": [
    {
      "id": "1",
      "label": "المفهوم",
      "type": "concept|definition|example|rule|detail",
      "children": ["2", "3"],
      "summary": "شرح مختصر"
    }
  ]
}
اجعل العقد مختصرة وواضحة. أنشئ 8-15 عقدة. النص:\n${truncated}`
      : `Analyze the following text and create an organized mind map. Return JSON only in this format:
{
  "title": "Main Title",
  "nodes": [
    {
      "id": "1",
      "label": "Concept",
      "type": "concept|definition|example|rule|detail",
      "children": ["2", "3"],
      "summary": "Brief explanation"
    }
  ]
}
Keep nodes concise. Generate 8-15 nodes. Text:\n${truncated}`

    const raw = await geminiText({
      system: 'You are an educational content analyzer. Return ONLY valid JSON, no markdown.',
      parts: [{ text: prompt }],
      temperature: 0.5,
      json: true,
    })

    const mindMapData = JSON.parse(raw)

    return new Response(JSON.stringify(mindMapData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    const status = (error as any)?.status === 429 ? 429 : 500
    return new Response(JSON.stringify({ error: (error as any).message }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
