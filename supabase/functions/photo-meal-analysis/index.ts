import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getAuthoritativeUserTier, SUBSCRIPTION_TIERS } from "../_shared/subscription.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'Nessuna immagine fornita' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY non configurata nei secrets Supabase');
    }

    // Server-Side Subscription Verification & Limit checks
    const userTier = await getAuthoritativeUserTier(user);
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    if (userTier === SUBSCRIPTION_TIERS.FREE) {
      const todayStr = new Date().toISOString().split('T')[0];
      const { count, error: countError } = await adminClient
        .from('meal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('entry_date', todayStr);

      if (countError) {
        throw new Error(`Errore verifica limiti: ${countError.message}`);
      }

      if (count && count >= 3) {
        return new Response(JSON.stringify({ 
          error: "Limite di 3 analisi pasti giornaliere per il piano Free superato. Esegui l'upgrade per sbloccare analisi illimitate." 
        }), {
          status: 403,
          headers: corsHeaders,
        });
      }
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
