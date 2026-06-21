import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getAuthoritativeUserTier, SUBSCRIPTION_TIERS } from "../_shared/subscription.ts";

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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorizzato" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Non autorizzato" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-Side Subscription Verification & Feature Gating
    const userTier = await getAuthoritativeUserTier(user);
    if (userTier === SUBSCRIPTION_TIERS.FREE) {
      return new Response(
        JSON.stringify({ error: "La generazione di report nutrizionali avanzati via AI è riservata ai piani Pro o Premium. Aggiorna il tuo piano per accedere." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { reportType, nutritionData, profile } = await req.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const reportTypeLabel = reportType === 'weekly' ? 'settimanale' : 'giornaliero';

    const prompt = `Sei un consulente nutrizionale esperto. Analizza i seguenti dati nutrizionali e genera un report ${reportTypeLabel} in italiano.

PROFILO UTENTE:
${JSON.stringify(profile, null, 2)}

DATI NUTRIZIONALI:
${JSON.stringify(nutritionData, null, 2)}

Genera un report con questa struttura:
1. RIEPILOGO: Una breve spiegazione chiara e non tecnica dello stato nutrizionale
2. PUNTI POSITIVI: Cosa va bene nella dieta
3. AREE DI MIGLIORAMENTO: Cosa potrebbe essere migliorato
4. SUGGERIMENTI PRATICI: 3-5 consigli alimentari concreti e facili da seguire (con nomi di alimenti specifici italiani)
5. POSSIBILI EFFETTI: Effetti generali di una dieta con queste caratteristiche (senza fare diagnosi)

REGOLE IMPORTANTI:
- NON fare diagnosi mediche
- Usa un linguaggio semplice e accessibile
- Usa espressioni come "potrebbe", "in generale", "tipicamente"
- NON dire "hai una carenza di..." ma "il tuo apporto di ... sembra inferiore alla media consigliata"
- I suggerimenti devono essere pratici e specifici per la cucina italiana
- Includi sempre il disclaimer che queste sono informazioni educative

Rispondi in formato JSON:
{
  "summary": "Riepilogo generale",
  "positive_points": ["punto 1", "punto 2"],
  "improvements": ["area 1", "area 2"],
  "suggestions": ["suggerimento 1", "suggerimento 2"],
  "effects": "Possibili effetti generali",
  "score_comment": "Commento sullo score nutrizionale"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let report;
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      report = JSON.parse(cleaned);
    } catch {
      report = {
        summary: text,
        positive_points: [],
        improvements: [],
        suggestions: [],
        effects: "",
        score_comment: ""
      };
    }

    return new Response(JSON.stringify({ report }), {
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
