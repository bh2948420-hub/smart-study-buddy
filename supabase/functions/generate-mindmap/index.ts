import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LOVABLE_API_URL = 'https://api.lovable.dev/v1/chat/completions'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    const apiKey = Deno.env.get('LOVABLE_API_KEY')!
    const response = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an educational content analyzer. Return ONLY valid JSON, no markdown.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('AI API error:', err)
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const mindMapData = JSON.parse(data.choices[0].message.content)

    return new Response(JSON.stringify(mindMapData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
