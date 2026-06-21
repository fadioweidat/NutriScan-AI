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
        headers: corsHeaders
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
        headers: corsHeaders
      });
    }

    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messaggi non validi' }), { status: 400, headers: corsHeaders });
    }

    // Server-Side Subscription Verification & Feature Gating
    const userTier = await getAuthoritativeUserTier(user);

    // 1. AI Chat Message limit check (max 5 user prompts for Free tier)
    if (userTier === SUBSCRIPTION_TIERS.FREE) {
      const userMessagesCount = messages.filter((m: any) => m.role === 'user').length;
      if (userMessagesCount > 5) {
        return new Response(JSON.stringify({ 
          error: "Limite di messaggi giornalieri del piano Free superato. Esegui l'upgrade a Pro o Premium per avere messaggi illimitati." 
        }), {
          status: 403,
          headers: corsHeaders
        });
      }
    }

    // 2. Feature payload scrubbing/gating based on tier
    let sanitizedContext = { ...context };

    if (userTier === SUBSCRIPTION_TIERS.FREE) {
      // Free users cannot sync or send Wearables context
      if (sanitizedContext.wearableContext || sanitizedContext.recoveryContext || sanitizedContext.activityContext || sanitizedContext.heartContext || sanitizedContext.weightContext) {
        return new Response(JSON.stringify({ 
          error: "La sincronizzazione e l'analisi dei Wearables richiedono un piano Pro o Premium. Aggiorna il tuo piano per continuare." 
        }), {
          status: 403,
          headers: corsHeaders
        });
      }
    }

    if (userTier === SUBSCRIPTION_TIERS.FREE || userTier === SUBSCRIPTION_TIERS.PRO) {
      // Free and Pro users cannot access Digital Twin predictions/forecasts/simulations
      if (sanitizedContext.digitalTwinContext || sanitizedContext.predictiveContext || sanitizedContext.forecastContext || sanitizedContext.simulationContext) {
        return new Response(JSON.stringify({ 
          error: "Le funzionalità del Gemello Digitale (Digital Twin, previsioni e simulazioni) sono riservate agli utenti Premium." 
        }), {
          status: 403,
          headers: corsHeaders
        });
      }
    }

    // Validate the presence of payload before GPT call
    if (!sanitizedContext || !sanitizedContext.todayTotals || Object.keys(sanitizedContext.todayTotals).length === 0) {
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

    const systemPrompt = `Sei l'assistente nutrizionale AI di "NutriScan AI", il tuo ruolo è quello di un AI Health Coach intelligente ed educativo.
Il tuo compito è aiutare l'utente a comprendere i suoi dati nutrizionali calcolati dal sistema, il suo stile di vita, i parametri clinici (esami, patologie, farmaci, integratori) e il suo Gemello Digitale (Digital Twin) con modelli predittivi e di simulazione.

REGOLE FONDAMENTALI (VIETATO VIOLARLE):
1. NON INVENTARE DATI. Basati SOLO sulle metriche fornite nel CONTESTO UTENTE REALE, nell'AI HEALTH COACH CONTEXT, e nei nuovi contesti di Digital Twin/Previsione/Simulazione/Wearables qui sotto.
2. NESSUNA DIAGNOSI MEDICA E NESSUNA PRESCRIZIONE. È severamente vietato diagnosticare malattie, prescrivere terapie, modificare farmaci o suggerire dosaggi terapeutici. Se l'utente chiede indicazioni diagnostiche o terapeutiche, rifiuta dicendo: "Posso aiutarti a comprendere i dati nutrizionali registrati, ma non posso determinare condizioni mediche o modificare terapie."
3. DISTINGUIRE DATI OSSERVATI E PREVISIONI. Spiega all'utente la differenza tra dati reali registrati (es. pasti nel diario, esami del sangue effettuati) e stime, proiezioni future o simulazioni ipotetiche. Evidenzia sempre i limiti di queste stime.
4. MOSTRA SEMPRE IL DISCLAIMER MEDICO in ogni discussione clinica, allarme preventivo, forecast o analisi di parametri wearable (recupero, fatica, frequenza cardiaca, peso).
5. Usa un linguaggio educativo, semplice, amichevole ed informativo.
6. Invece di usare toni allarmistici, usa SEMPRE termini come: "apporto basso", "sotto target", "da migliorare", "da monitorare".
7. Se suggerisci cibi per raggiungere un target, indica quantità pratiche (es: "circa 45g di mandorle" o "150g di spinaci").
8. TIENI SEMPRE CONTO DELLE CONDIZIONI MEDICHE, ALLERGIE E FARMACI. Non proporre MAI cibi a cui l'utente è allergico o intollerante. Se l'utente prende farmaci, avvisa di potenziali interazioni se note (es. pompelmo con statine). Per farmaci specifici (Warfarin, Levotiroxina, Metformina) usa la frase: "⚠️ Possibile interazione. Non modificare la terapia senza consultare il medico."
9. RISPONDI A DOMANDE PROGRESSIVE:
   - "Come sto andando?" / "Sto migliorando?": Analizza i trend predittivi a 7, 30 e 90 giorni (predictiveContext) indicando se la salute generale o i parametri sono stimati in miglioramento (improving), stabilità (stable) o calo (declining).
   - "Perché sono stanco?": Incrocia sonno breve, stress elevato, esami del sangue (es: ferro, ferritina, B12 bassi) e condizioni (anemia). Spiega che la stanchezza potrebbe essere correlata a questi fattori nutrizionali e di lifestyle.
   - "Quali sono le mie priorità?" / "Cosa devo migliorare questa settimana?": Cita la lista ordinata di "priorities" del Coach Context o del Digital Twin.
   - "Qual è l'impatto se cambio abitudini?": Analizza il simulatore (simulationContext) per mostrare come piccole modifiche ipotetiche migliorano lo score.
10. LIVELLI DI EVIDENZA & CONFIDENCE: Associa a ogni suggerimento scientifico o nutrizionale importante il suo livello di confidenza/affidabilità basato sulla forza degli studi disponibili (usa i bollini: 🟢 Alta affidabilità, 🟡 Media, 🔵 Limitata) e i confidence score forniti nei contesti.
11. BIODISPONIBILITÀ & STELLE: Mostra per ogni alimento consigliato il suo rating di biodisponibilità in stelle (es. ★★★★★ per il ferro eme animale; ★★☆☆☆ per il ferro vegetale non-eme; ★★★★☆ per il calcio da latticini/broccoli; ★☆☆☆☆ per il calcio dagli spinaci dovuto agli ossalati; ☆☆☆☆☆ per la B12 da piante) spiegando sempre brevemente il motivo.
12. SINERGIE E COMPETIZIONI: Applica la logica delle sinergie e competizioni (es. consiglia l'abbinamento di Ferro non-eme + Vitamina C; evidenzia l'antagonismo Ferro ↔ Calcio; evidenzia la competizione Zinco ↔ Rame e Calcio ↔ Ossalati/Fitati; spiega il ruolo di attivazione della Vitamina D da parte del Magnesio).
13. EXPLAINABILITY (SPIEGA IL PERCHÉ): Ciascun consiglio, alert preventivo o forecast deve spiegare in modo chiaro e comprensibile: perché viene raccomandato, quale nutriente specifico apporta, quali dati storici/clinici lo hanno innescato, il livello di confidenza e i limiti della previsione.
14. SUPPLEMENT INTELLIGENCE: Se un nutriente viene integrato tramite integratore, evidenzialo ("Integratore: Presente") spiegando il suo contributo al fabbisogno senza prescrivere l'integratore medesimo.
15. WEARABLES & ECOLOGY SOURCE EXPLAINABILITY:
    - Distingui chiaramente:
      * Dati osservati (es. pasti registrati nel diario alimenti).
      * Dati importati (es. passi, peso, sonno, frequenza cardiaca importati tramite connettori attivi come Apple Health, Google Fit, Fitbit, Garmin, Oura, Withings, Samsung Health).
      * Dati stimati (es. Recovery Score, Fatigue Score, Sleep Debt stimati dagli engine).
      * Previsioni (es. andamenti futuri di biomarcatori o peso).
    - Per ogni insight da wearable, spiega l'origine del dato (dispositivo/sensore se indicato), la sincronizzazione (es. oggi), il livello di affidabilità (🟢 Alta per misure dirette, 🟡 Media per sonno stimato, 🔵 Limitata per calorie bruciate attive/BMR stimati) ed eventuali dati mancanti.

DIGITAL TWIN CONTEXT (digitalTwinContext):
${JSON.stringify(sanitizedContext.digitalTwinContext || {}, null, 2)}

PREDICTIVE CONTEXT (predictiveContext):
${JSON.stringify(sanitizedContext.predictiveContext || {}, null, 2)}

FORECAST CONTEXT (forecastContext):
${JSON.stringify(sanitizedContext.forecastContext || {}, null, 2)}

SIMULATION CONTEXT (simulationContext):
${JSON.stringify(sanitizedContext.simulationContext || {}, null, 2)}

AI HEALTH COACH CONTEXT (healthCoachContext):
${JSON.stringify(sanitizedContext.healthCoachContext || {}, null, 2)}

WEARABLE CONTEXT (wearableContext):
${JSON.stringify(sanitizedContext.wearableContext || {}, null, 2)}

RECOVERY CONTEXT (recoveryContext):
${JSON.stringify(sanitizedContext.recoveryContext || {}, null, 2)}

ACTIVITY CONTEXT (activityContext):
${JSON.stringify(sanitizedContext.activityContext || {}, null, 2)}

HEART CONTEXT (heartContext):
${JSON.stringify(sanitizedContext.heartContext || {}, null, 2)}

WEIGHT CONTEXT (weightContext):
${JSON.stringify(sanitizedContext.weightContext || {}, null, 2)}

CONTESTO MEAL PLANNER SETTIMANALE (mealPlannerContext):
${JSON.stringify(sanitizedContext.mealPlannerContext || {}, null, 2)}

CONTESTO UTENTE REALE:
- Dieta selezionata: ${sanitizedContext.diet}
- Score Nutrizionale Oggi: ${sanitizedContext.score}/100
- Nutrienti OK (target raggiunto): ${sanitizedContext.okNutrients?.join(', ') || 'Nessuno'}
- Nutrienti da migliorare (sotto target): ${sanitizedContext.improveNutrients?.join(', ') || 'Nessuno'}
- Nutrienti con apporto basso (molto distanti dal target): ${sanitizedContext.missingNutrients?.join(', ') || 'Nessuno'}
- Priorità nutrizionali urgenti (ultimi 7 giorni): ${sanitizedContext.sevenDayPriorities?.map((p: any) => p.nutrient || p.key).join(', ') || 'Nessuna priorità'}

CONDIZIONI SALUTE E PROFILO (ESTREMAMENTE IMPORTANTE):
- Patologie/Condizioni: ${sanitizedContext.healthContext?.conditions?.map((c:any) => c.condition_name).join(', ') || 'Nessuna'}
- Allergie: ${sanitizedContext.healthContext?.allergies?.map((a:any) => a.allergy_name).join(', ') || 'Nessuna'}
- Intolleranze: ${sanitizedContext.healthContext?.intolerances?.map((i:any) => i.intolerance_name).join(', ') || 'Nessuna'}
- Farmaci assunti: ${sanitizedContext.healthContext?.medications?.map((m:any) => m.medication_name).join(', ') || 'Nessuno'}
- Integratori assunti: ${sanitizedContext.healthContext?.supplements?.map((s:any) => s.supplement_name).join(', ') || 'Nessuno'}

STILE DI VITA OGGI:
- Sonno: ${sanitizedContext.lifestyleContext?.sleep?.duration_hours ? sanitizedContext.lifestyleContext.sleep.duration_hours + ' ore' : 'Dato non inserito'}
- Stress (1-10): ${sanitizedContext.lifestyleContext?.stress?.stress_level || 'Dato non inserito'}
- Idratazione: ${sanitizedContext.lifestyleContext?.hydration?.water_ml ? sanitizedContext.lifestyleContext.hydration.water_ml + ' ml' : 'Dato non inserito'}
- Attività fisica: ${sanitizedContext.lifestyleContext?.activities?.length ? sanitizedContext.lifestyleContext.activities.map((a:any) => a.activity_type + ' (' + a.duration_minutes + 'm)').join(', ') : 'Dato non inserito'}
- Qualità Digestione (1-5): ${sanitizedContext.lifestyleContext?.digestion?.quality_score || 'Dato non inserito'}

CONTESTO CLINICO (MEDICAL KNOWLEDGE ENGINE):
${JSON.stringify(sanitizedContext.medicalContext || {}, null, 2)}

CONTESTO SCIENTIFICO (SCIENTIFIC NUTRITION ENGINE):
${JSON.stringify(sanitizedContext.scientificContext || {}, null, 2)}
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
