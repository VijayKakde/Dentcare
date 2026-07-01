import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are Dent AI Care Assistant, an expert dental health chatbot integrated into a dental caries detection web application. You specialize in:
- Dental caries (tooth decay) — stages, causes, prevention, treatment
- Oral hygiene advice and best practices
- Explaining AI detection results (Healthy, Initial, Moderate, Severe caries)
- Answering questions about dental procedures and treatments
- General dental health FAQs

STRICT RULES:
- Only answer dental/oral health related questions.
- If asked anything outside dental health, politely say: "I'm specialized in dental health only. Please consult the right expert for that topic."
- Never provide emergency medical advice — always say "Please visit a dentist immediately" for emergencies.
- Keep answers concise — max 4-5 sentences unless user asks for detail.
- Use simple language, avoid heavy medical jargon.
- If user shares their detection result (Healthy/Initial/Moderate/Severe), give stage-specific advice.
- Always end responses with one actionable tip (prefix it with "💡 Tip:").
- Never make up medicines or dosages.
- Be empathetic and reassuring — dental anxiety is real.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Google Gemini API directly via OpenAI compatibility layer
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error', response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "I'm here to help with dental health questions.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('dental-chat error', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});