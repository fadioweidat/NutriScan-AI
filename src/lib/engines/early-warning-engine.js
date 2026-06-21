/**
 * Early Warning Engine (Phase 6)
 * Triggers proactive, non-diagnostic educational warning alerts.
 * Strictly educational and non-diagnostic.
 */

export function generateEarlyWarnings({
  predictiveTrends = {}, // result from computePredictiveTrends
  deficiencies = [], // result from predictDeficiencies
  biomarkersForecast = {} // result from forecastBiomarkers
}) {
  const warnings = [];

  // 1. Health Score declining check
  // Access both 7-day and 30-day structures
  const trend7 = predictiveTrends.days_7 || {};
  const trend30 = predictiveTrends.days_30 || {};

  if (trend30.healthScore === 'declining' || trend7.healthScore === 'declining') {
    warnings.push({
      key: 'health_score_declining',
      title: "Punteggio di Salute in Calo",
      description: "Si rileva un trend in diminuzione per il tuo Health Score nutrizionale complessivo.",
      confidence: 85,
      urgency: 'medium',
      educationalTip: "Verifica quali nutrienti mancano nel diario quotidiano e consulta il pannello 'Correggi Oggi' per risollevare lo score."
    });
  }

  // 2. Stress levels rising (in predictive trends, for stress, 'declining' health trend means stress is increasing!)
  if (trend30.stress === 'declining' || trend7.stress === 'declining') {
    warnings.push({
      key: 'stress_rising',
      title: "Stress in Aumento",
      description: "Si registra una tendenza al rialzo nei livelli quotidiani di stress percepito.",
      confidence: 80,
      urgency: 'medium',
      educationalTip: "Lo stress influisce sul metabolismo e aumenta il desiderio di carboidrati raffinati. Cerca di fare micro-pause di rilassamento."
    });
  }

  // 3. Sleep worsening
  if (trend30.sleep === 'declining' || trend7.sleep === 'declining') {
    warnings.push({
      key: 'sleep_declining',
      title: "Ore di Sonno in Riduzione",
      description: "La durata media del sonno notturno si sta riducendo rispetto ai periodi precedenti.",
      confidence: 75,
      urgency: 'low',
      educationalTip: "Il sonno è fondamentale per la regolazione della glicemia e dell'appetito. Mantieni orari di sonno costanti."
    });
  }

  // 4. Deficiencies warnings
  deficiencies.forEach(def => {
    if (def.probability === 'high' || def.probability === 'medium') {
      const isHigh = def.probability === 'high';
      warnings.push({
        key: `warning_def_${def.nutrient.toLowerCase().replace(' ', '_')}`,
        title: `Probabile Carenza: ${def.nutrient}`,
        description: `I dati dietetici e clinici evidenziano una probabilità ${isHigh ? 'elevata' : 'moderata'} di carenza di ${def.nutrient} (orizzonte stimato: ${def.timeHorizon}).`,
        confidence: def.confidenceLevel === 'high' ? 90 : 70,
        urgency: isHigh ? 'high' : 'medium',
        educationalTip: `Arricchisci la dieta con fonti di ${def.nutrient} e valuta con il medico se effettuare un test di controllo.`
      });
    }
  });

  // 5. Biomarkers forecast worsening
  const cholesterolForecast = biomarkersForecast.cholesterol || biomarkersForecast.colesterolo;
  if (cholesterolForecast && cholesterolForecast.trend === 'increasing' && cholesterolForecast.forecastValue !== null) {
    warnings.push({
      key: 'warning_cholesterol_increasing',
      title: "Trend Colesterolo in Aumento",
      description: `Le proiezioni stimano un aumento del colesterolo a ${cholesterolForecast.forecastValue} ${cholesterolForecast.unit}.`,
      confidence: cholesterolForecast.confidenceScore,
      urgency: 'medium',
      educationalTip: "Considera di aumentare l'apporto di grassi monoinsaturi (olio d'oliva extravergine) e fibre solubili (avena, legumi)."
    });
  }

  const glucoseForecast = biomarkersForecast.glucose || biomarkersForecast.glicemia;
  if (glucoseForecast && glucoseForecast.trend === 'increasing' && glucoseForecast.forecastValue !== null) {
    warnings.push({
      key: 'warning_glucose_increasing',
      title: "Proiezione Glicemia in Aumento",
      description: `Il trend storico mostra un potenziale rialzo dei valori glicemici medi nel tempo.`,
      confidence: glucoseForecast.confidenceScore,
      urgency: 'high',
      educationalTip: "Cerca di bilanciare i pasti con fibre e proteine per rallentare l'assorbimento dei carboidrati."
    });
  }

  return warnings;
}

export default {
  generateEarlyWarnings
};
