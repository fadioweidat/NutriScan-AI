import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

function parseJsonObject(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const foodQuery = String(query || "").trim();

    if (!foodQuery) {
      return new Response(JSON.stringify({ error: "Query alimento mancante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY mancante in Supabase Secrets");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Stima valori nutrizionali medi per 100g di un alimento quando il database non ha risultati.",
              "Rispondi solo JSON valido.",
              "Non presentare la stima come dato certificato.",
              "Usa valori plausibili e conservativi.",
              "Schema: {\"food\":{\"name\":\"\",\"category\":\"Stima AI\",\"calories\":0,\"proteins\":0,\"carbs\":0,\"fats\":0,\"fiber\":0,\"water\":0,\"food_nutrients\":[{\"nutrient_key\":\"sodium\",\"nutrient_name\":\"Sodio\",\"amount\":0,\"unit\":\"mg\"}]}}"
            ].join(" ")
          },
          {
            role: "user",
            content: `Alimento: ${foodQuery}`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const estimate = parseJsonObject(content);

    return new Response(JSON.stringify(estimate), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI_FOOD_ESTIMATE_ERROR]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
