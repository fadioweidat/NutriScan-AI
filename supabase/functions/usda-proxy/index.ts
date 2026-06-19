import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { endpoint, body } = await req.json();

    if (!endpoint) {
      throw new Error('Endpoint mancante nella richiesta proxy.');
    }

    const USDA_API_KEY = Deno.env.get('USDA_API_KEY');
    
    if (!USDA_API_KEY) {
      throw new Error('USDA_API_KEY non è configurata nei secret del server.');
    }

    const url = `https://api.nal.usda.gov/fdc/v1${endpoint}?api_key=${USDA_API_KEY}`;
    
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.method = 'POST';
      options.body = JSON.stringify(body);
    } else {
      options.method = 'GET';
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`USDA API Errore ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
