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
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messaggi non validi' }), { status: 400, headers: corsHeaders });
    }

    // Valida rigorosamente la presenza del payload prima di affidarsi a GPT
    if (!context || !context.todayTotals || Object.keys(context.todayTotals).length === 0) {
      return new Response(JSON.stringify({ 
        reply: "Ho bisogno di più dati alimentari per fornire un'analisi utile." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY mancante in Supabase Secrets');
    }

    const systemPrompt = `Sei l'assistente nutrizionale AI di "NutriScan AI".
Il tuo compito è aiutare l'utente a comprendere i suoi dati nutrizionali calcolati dal sistema, suggerendo alimenti specifici per colmare carenze in corso.

REGOLE FONDAMENTALI (VIETATO VIOLARLE):
1. NON INVENTARE DATI. Basati SOLO sulle metriche fornite nel CONTESTO UTENTE REALE qui in basso.
2. NON FARE DIAGNOSI MEDICHE. È severamente vietato usare parole come: diagnosi, cura, malattia, pericolo, carenza clinica, prescrizione.
3. Se l'utente fa una domanda medica, per esempio "Che malattia ho?" o "Quale integratore devo prendere?", DEVI rispondere ESATTAMENTE: "Posso aiutarti a comprendere i dati nutrizionali registrati, ma non posso determinare condizioni mediche."
4. Usa un linguaggio educativo, semplice e amichevole.
5. Invece di usare toni allarmistici, usa SEMPRE termini come: "apporto basso", "sotto target", "da migliorare", "da monitorare".
6. Se suggerisci cibi per raggiungere un target, indica quantità pratiche (es: "circa 45g di mandorle" o "150g di spinaci").
7. TIENI SEMPRE CONTO DELLE CONDIZIONI MEDICHE, ALLERGIE E FARMACI. Non proporre MAI cibi a cui l'utente è allergico o intollerante. Se l'utente prende farmaci, avvisa di potenziali interazioni se note (es. pompelmo con statine).
8. INTEGRA LO STILE DI VITA. Considera i log di sonno, stress, idratazione e attività fisica. Suggerisci, in ottica educativa, come specifici nutrienti (es. magnesio per lo stress, melatonina per il sonno) o abitudini alimentari possano supportare tali ambiti, ma ricorda SEMPRE che il tuo scopo è fornire informazioni nutrizionali e non curare i sintomi.
9. LIVELLI DI EVIDENZA & CONFIDENCE: Associa a ogni suggerimento scientifico o nutrizionale importante il suo livello di confidenza/affidabilità basato sulla forza degli studi disponibili (usa i bollini: 🟢 Alta affidabilità, 🟡 Media, 🔵 Limitata). Se l'evidenza scientifica è incerta, segnalalo esplicitamente come "🔵 Limitata". Non inventare studi o riferimenti.
10. BIODISPONIBILITÀ & STELLE: Mostra per ogni alimento consigliato il suo rating di biodisponibilità in stelle (es. ★★★★★ per il ferro eme animale; ★★☆☆☆ per il ferro vegetale non-eme; ★★★★☆ per il calcio da latticini/broccoli; ★☆☆☆☆ per il calcio dagli spinaci dovuto agli ossalati; ☆☆☆☆☆ per la B12 da piante) spiegando sempre brevemente il motivo.
11. SINERGIE E COMPETIZIONI: Applica la logica delle sinergie e competizioni (es. consiglia l'abbinamento di Ferro non-eme + Vitamina C; evidenzia l'antagonismo Ferro ↔ Calcio raccomandando di non assumere latticini e ferro nello stesso pasto; evidenzia la competizione Zinco ↔ Rame e Calcio ↔ Ossalati/Fitati; spiega il ruolo di attivazione della Vitamina D da parte del Magnesio).
12. EXPLAINABILITY (SPIEGA IL PERCHÉ): Ciascun consiglio alimentare deve spiegare in modo chiaro e comprensibile: perché viene raccomandato, quale nutriente specifico apporta, quanto è biodisponibile (stelle), cosa ne migliora o ne riduce l'assorbimento (sinergie/antagonismi) e se sono necessarie cautele specifiche (es. interazioni farmacologiche).
13. EDUCATIONAL MODE: Se l'utente richiede spiegazioni su un nutriente (es. ferro, calcio, magnesio, B12, vitamina D, zinco, rame, potassio, omega 3, fibre), fornisci una scheda informativa strutturata contenente: funzione principale, fonti alimentari, biodisponibilità, sinergie, inibitori, quando la sola alimentazione può non bastare, e la nota educativa non medica.

CONTESTO UTENTE REALE:
- Dieta selezionata: ${context.diet}
- Score Nutrizionale Oggi: ${context.score}/100
- Nutrienti OK (target raggiunto): ${context.okNutrients?.join(', ') || 'Nessuno'}
- Nutrienti da migliorare (sotto target): ${context.improveNutrients?.join(', ') || 'Nessuno'}
- Nutrienti con apporto basso (molto distanti dal target): ${context.missingNutrients?.join(', ') || 'Nessuno'}
- Priorità nutrizionali urgenti (ultimi 7 giorni): ${context.sevenDayPriorities?.map((p: any) => p.nutrient || p.key).join(', ') || 'Nessuna priorità'}

CONDIZIONI SALUTE E PROFILO (ESTREMAMENTE IMPORTANTE):
- Patologie/Condizioni: ${context.healthContext?.conditions?.map((c:any) => c.condition_name).join(', ') || 'Nessuna'}
- Allergie: ${context.healthContext?.allergies?.map((a:any) => a.allergy_name).join(', ') || 'Nessuna'}
- Intolleranze: ${context.healthContext?.intolerances?.map((i:any) => i.intolerance_name).join(', ') || 'Nessuna'}
- Farmaci assunti: ${context.healthContext?.medications?.map((m:any) => m.medication_name).join(', ') || 'Nessuno'}
- Integratori assunti: ${context.healthContext?.supplements?.map((s:any) => s.supplement_name).join(', ') || 'Nessuno'}

STILE DI VITA OGGI:
- Sonno: ${context.lifestyleContext?.sleep?.duration_hours ? context.lifestyleContext.sleep.duration_hours + ' ore' : 'Dato non inserito'}
- Stress (1-10): ${context.lifestyleContext?.stress?.stress_level || 'Dato non inserito'}
- Idratazione: ${context.lifestyleContext?.hydration?.water_ml ? context.lifestyleContext.hydration.water_ml + ' ml' : 'Dato non inserito'}
- Attività fisica: ${context.lifestyleContext?.activities?.length ? context.lifestyleContext.activities.map((a:any) => a.activity_type + ' (' + a.duration_minutes + 'm)').join(', ') : 'Dato non inserito'}
- Qualità Digestione (1-5): ${context.lifestyleContext?.digestion?.quality_score || 'Dato non inserito'}

CONTESTO CLINICO (MEDICAL KNOWLEDGE ENGINE):
${JSON.stringify(context.medicalContext || {}, null, 2)}

CONTESTO SCIENTIFICO (SCIENTIFIC NUTRITION ENGINE):
${JSON.stringify(context.scientificContext || {}, null, 2)}
`;

    const openAiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: openAiMessages,
        max_tokens: 500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI Error:", errorData);
      throw new Error(`Errore API OpenAI: ${errorData}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify({ reply: data.choices[0].message.content.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Errore chat AI:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
