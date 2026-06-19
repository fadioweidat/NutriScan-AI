import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Nessuna immagine fornita' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY non configurata nei secrets Supabase');
    }

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Sei un esperto nutrizionista e sistema di computer vision. Analizza l'immagine e identifica gli alimenti presenti.
Devi rispondere RIGOROSAMENTE con un array JSON. Non includere testo fuori dal JSON o markdown come \`\`\`json.
Formato richiesto:
[
  {
    "food": "nome generico in italiano (es. salmone, riso, uovo)",
    "estimated_grams": 150,
    "confidence": 0.85
  }
]
Se non riesci a identificare alcun alimento, restituisci un array vuoto: [].`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.1
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI Error:", errorData);
      throw new Error(`Errore API OpenAI: ${errorData}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Rimuovi eventuali blocchi markdown se OpenAI li ha ignorati
    if (content.startsWith('```json')) {
      content = content.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (content.startsWith('```')) {
      content = content.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
      if (!Array.isArray(parsedResult)) {
        throw new Error("La risposta non è un array JSON.");
      }
    } catch (e) {
      console.error("Errore parsing JSON da OpenAI:", content);
      throw new Error("Analisi non riuscita, il formato restituito non è valido.");
    }

    return new Response(JSON.stringify({ result: parsedResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Errore photo-meal-analysis:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
