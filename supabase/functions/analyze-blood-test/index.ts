import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getAuthoritativeUserTier, SUBSCRIPTION_TIERS } from "../_shared/subscription.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Autorizzazione mancante' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase Client with User's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // Get User profile to verify Auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Utente non autorizzato' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { filePath, textContent } = await req.json();
    if (!filePath) {
      return new Response(JSON.stringify({ error: 'Nessun file_path specificato' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the report_id from filePath (user_id/report_id/filename)
    const filePathParts = filePath.split('/');
    if (filePathParts.length < 3) {
      return new Response(JSON.stringify({ error: 'Formato file_path non valido. Atteso: user_id/report_id/filename' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const urlUserId = filePathParts[0];
    const reportId = filePathParts[1];

    // Security check: the user_id in path must match the logged-in user id
    if (urlUserId !== user.id) {
      return new Response(JSON.stringify({ error: 'Non sei autorizzato ad accedere a questa risorsa' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY non configurata nei secrets di Supabase');
    }

    let parsedResults = null;

    // Use service role client to download private files and insert data
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Server-Side Subscription Verification & Feature Gating
    const userTier = await getAuthoritativeUserTier(user);
    if (userTier === SUBSCRIPTION_TIERS.FREE) {
      // Free limit check: Max 3 blood test reports total
      const { count, error: countError } = await adminClient
        .from('blood_test_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        throw new Error(`Errore verifica limiti abbonamento: ${countError.message}`);
      }

      if (count && count >= 3) {
        return new Response(JSON.stringify({ 
          error: "Limite di 3 caricamenti referti raggiunto per il piano Free. Esegui l'upgrade a Pro per caricamenti illimitati." 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }


    if (textContent) {
      // PDF text extracted by frontend
      console.log("Analyzing extracted PDF text...");
      parsedResults = await analyzeTextWithOpenAI(textContent, openAiApiKey);
    } else {
      // It's an image, download from bucket and send to OpenAI Vision
      console.log("Downloading file from private bucket:", filePath);
      const { data: fileBlob, error: downloadError } = await adminClient.storage
        .from('medical-documents')
        .download(filePath);

      if (downloadError || !fileBlob) {
        throw new Error(`Impossibile scaricare il file dal bucket: ${downloadError?.message || 'File vuoto'}`);
      }

      const arrayBuffer = await fileBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const mimeType = fileBlob.type || "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${base64}`;

      console.log("Analyzing image via OpenAI Vision...");
      parsedResults = await analyzeImageWithOpenAIVision(dataUrl, openAiApiKey);
    }

    if (!parsedResults || !parsedResults.biomarkers || !parsedResults.test_date) {
      throw new Error("Errore nell'estrazione dei biomarcatori da parte dell'AI");
    }

    console.log("Extracted data:", parsedResults);

    // Save report metadata using the reportId from the path
    const { data: report, error: reportError } = await adminClient
      .from('blood_test_reports')
      .insert({
        id: reportId,
        user_id: user.id,
        file_path: filePath,
        test_date: parsedResults.test_date,
        status: 'completed'
      })
      .select()
      .single();

    if (reportError) {
      throw new Error(`Errore salvataggio report: ${reportError.message}`);
    }

    // Save biomarkers
    const biomarkersToInsert = parsedResults.biomarkers.map((b: any) => {
      const val = Number(b.value);
      const min = b.min_range != null ? Number(b.min_range) : null;
      const max = b.max_range != null ? Number(b.max_range) : null;
      
      let status = 'normal';
      if (isNaN(val)) {
        status = 'unknown';
      } else {
        if (min != null && val < min) status = 'low';
        else if (max != null && val > max) status = 'high';
      }

      return {
        report_id: report.id,
        user_id: user.id,
        biomarker_name: b.name,
        value: isNaN(val) ? 0 : val,
        unit: b.unit || '',
        min_range: min,
        max_range: max,
        status
      };
    });

    const { error: biomarkersError } = await adminClient
      .from('blood_test_biomarkers')
      .insert(biomarkersToInsert);

    if (biomarkersError) {
      // Rollback report if biomarkers fail
      await adminClient.from('blood_test_reports').delete().eq('id', report.id);
      throw new Error(`Errore salvataggio biomarcatori: ${biomarkersError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      report, 
      biomarkersCount: biomarkersToInsert.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in analyze-blood-test:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeTextWithOpenAI(text: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getSystemPrompt()
        },
        {
          role: "user",
          content: `Ecco il testo estratto dal referto degli esami del sangue:\n\n${text}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content.trim());
}

async function analyzeImageWithOpenAIVision(imageDataUrl: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getSystemPrompt()
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analizza questa immagine del referto ed estrai tutti i dati richiesti."
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Vision error: ${await response.text()}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content.trim());
}

function getSystemPrompt() {
  return `Sei un assistente specializzato nell'estrazione OCR di dati medici da referti di analisi del sangue.
Estrai i dati e rispondi RIGOROSAMENTE con un oggetto JSON avente la seguente struttura:
{
  "test_date": "YYYY-MM-DD", // Cerca la data del prelievo/referto, se non la trovi usa la data odierna
  "biomarkers": [
    {
      "name": "Nome del biomarcatore normalizzato (es: 'Ferro', 'Ferritina', 'Colesterolo Totale', 'Glicemia', 'Vitamina D', 'Vitamina B12', 'Sodio', 'Potassio', 'Magnesio', 'Calcio')",
      "value": 120.5, // valore numerico estratto (converti virgole in punti se necessario)
      "unit": "unità di misura (es: 'mg/dL', 'mcg/dL', 'ng/mL')",
      "min_range": 60, // valore minimo di riferimento, se non presente metti null
      "max_range": 160 // valore massimo di riferimento, se non presente metti null
    }
  ]
}

REGOLE CRITICHE:
1. Normalizza i nomi dei biomarcatori in italiano comune (es. 'Sideremia' o 'Ferro' -> 'Ferro', 'Colesterolo Totale' -> 'Colesterolo Totale', 'Glucosio' -> 'Glicemia', '25-OH Vitamina D' -> 'Vitamina D').
2. Assicurati che 'value', 'min_range' e 'max_range' siano numeri o null. Non includere stringhe o caratteri speciali in questi campi.
3. Se un biomarcatore ha una dicitura o valore ambiguo, non inventare, ignoralo o estrailo solo se sei certo.`;
}
