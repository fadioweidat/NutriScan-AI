import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API non configurata" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64, mimeType = "image/jpeg" } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Immagine non fornita" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `Sei un esperto nutrizionista. Analizza questa foto di un pasto e identifica gli alimenti presenti.

Per ogni alimento identificato, stima la porzione in grammi e fornisci i valori nutrizionali stimati.

Rispondi SOLO con un JSON valido con questa struttura esatta:
{
  "foods": [
    {
      "name": "Nome alimento in italiano",
      "estimated_grams": 150,
      "confidence": 0.85,
      "calories": 250,
      "proteins": 12.5,
      "carbs": 30.0,
      "fats": 8.5,
      "fiber": 3.2
    }
  ],
  "meal_summary": {
    "total_calories": 250,
    "description": "Breve descrizione del pasto"
  }
}`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      analysis = { raw_text: text, parse_error: true };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
