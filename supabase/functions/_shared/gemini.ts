// Shared helper: calls Google Gemini directly with the project's own API key.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'gemini-3.8-flash';
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}`;

export class GeminiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new GeminiError(500, 'GEMINI_API_KEY is not configured');
  return key;
}

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
export type Content = { role: 'user' | 'model'; parts: Part[] };

// Convert OpenAI-style chat messages into Gemini contents (also handles data-URL images)
export function toContents(messages: any[]): Content[] {
  const contents: Content[] = [];
  for (const m of messages || []) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const parts: Part[] = [];
    if (typeof m.content === 'string') {
      if (m.content.trim()) parts.push({ text: m.content });
    } else if (Array.isArray(m.content)) {
      for (const p of m.content) {
        if (p.type === 'text' && p.text) parts.push({ text: p.text });
        else if (p.type === 'image_url') {
          const url: string = p.image_url?.url || '';
          const match = url.match(/^data:(.+?);base64,(.*)$/s);
          if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
          else if (url) parts.push({ text: url });
        }
      }
    }
    if (parts.length) contents.push({ role, parts });
  }
  return contents;
}

// Parse a data URL (or raw base64) into an inline image part
export function imagePart(source: string, fallbackType = 'image/jpeg'): Part {
  const match = source.match(/^data:(.+?);base64,(.*)$/s);
  if (match) return { inlineData: { mimeType: match[1], data: match[2] } };
  return { inlineData: { mimeType: fallbackType, data: source } };
}

async function post(path: string, body: unknown, model = MODEL): Promise<Response> {
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': getKey() },
    body: JSON.stringify(body),
  });
  return resp;
}

// Post with automatic failover: if a model is overloaded (503), move down the
// fallback chain until one accepts the request.
const FALLBACK_CHAIN = [MODEL, 'gemini-3.6-flash', 'gemini-flash-lite-latest'];

async function postWithFailover(path: string, body: unknown): Promise<Response> {
  let resp = await post(path, body, FALLBACK_CHAIN[0]);
  for (const model of FALLBACK_CHAIN.slice(1)) {
    if (resp.status !== 503) break;
    console.warn(`Model overloaded (503), retrying with ${model}`);
    await new Promise((r) => setTimeout(r, 1500));
    resp = await post(path, body, model);
  }
  return resp;
}

function mapError(status: number, body: string): GeminiError {
  if (status === 429) return new GeminiError(429, 'Rate limit exceeded, please try again later');
  if (status === 403 || status === 401) return new GeminiError(status, 'AI API key is invalid or unauthorized');
  return new GeminiError(500, `AI request failed (${status})`);
}

// Non-streaming generation. json=true forces a JSON answer; schema optionally shapes it.
export async function geminiText(opts: {
  system?: string;
  parts: Part[];
  temperature?: number;
  json?: boolean;
  schema?: unknown;
}): Promise<string> {
  const generationConfig: Record<string, unknown> = { temperature: opts.temperature ?? 0.7 };
  if (opts.json) {
    generationConfig.responseMimeType = 'application/json';
    if (opts.schema) generationConfig.responseSchema = opts.schema;
  }
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: opts.parts }],
    generationConfig,
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  const resp = await postWithFailover('generateContent', body);
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    console.error('Gemini error:', resp.status, errText);
    throw mapError(resp.status, errText);
  }
  const data = await resp.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p.text || '').join('');
}

// Streaming generation. Returns an OpenAI-style SSE stream (choices[0].delta.content)
// so the frontend parsing stays unchanged.
export async function geminiStream(opts: {
  system?: string;
  messages: any[];
  temperature?: number;
}): Promise<Response> {
  const body: Record<string, unknown> = {
    contents: toContents(opts.messages),
    generationConfig: { temperature: opts.temperature ?? 0.7 },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  const resp = await postWithFailover('streamGenerateContent?alt=sse', body);
  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => '');
    console.error('Gemini stream error:', resp.status, errText);
    const err = mapError(resp.status, errText);
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';

  const stream = new ReadableStream({
    async start(controller) {
      const reader = resp.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              const parts = json.candidates?.[0]?.content?.parts || [];
              const text = parts.map((p: any) => p.text || '').join('');
              if (text) {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`,
                ));
              }
            } catch {
              // ignore partial JSON chunks
            }
          }
        }
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
  });
}
