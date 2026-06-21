/**
 * Activity Intelligence Engine (Phase 8)
 * Analyzes activity volumes, intensities, frequencies, and correlations.
 * Strictly educational and non-diagnostic.
 */

export function analyzeActivity({
  activeMinutes = 30,
  activeCalories = 250,
  sleepHours = 7.0,
  waterMl = 1500,
  sugarGrams = 20,
  workoutsCount = 0
}) {
  const insights = [];

  // 1. Volume analysis
  let volumeStatus = 'moderate';
  if (activeMinutes < 30) {
    volumeStatus = 'low';
    insights.push({
      type: 'volume',
      title: "Attività fisica ridotta",
      message: "Oggi hai registrato meno di 30 minuti di movimento. Per mantenere in salute il sistema cardiovascolare, l'OMS consiglia almeno 150 minuti a settimana.",
      severity: 'warning'
    });
  } else if (activeMinutes >= 90) {
    volumeStatus = 'high';
    insights.push({
      type: 'volume',
      title: "Volume di allenamento elevato",
      message: "Hai superato i 90 minuti di attività fisica. Ricordati di supportare i muscoli con idratazione abbondante e proteine adeguate.",
      severity: 'info'
    });
  } else {
    insights.push({
      type: 'volume',
      title: "Volume di attività ottimale",
      message: "Ottimo lavoro! Hai completato una sessione di movimento equilibrata all'interno del range di benessere giornaliero.",
      severity: 'success'
    });
  }

  // 2. Hydration Correlation
  if (activeMinutes >= 45 && waterMl < 1800) {
    insights.push({
      type: 'correlation_hydration',
      title: "Disidratazione da attività",
      message: `Hai eseguito ${activeMinutes} minuti di movimento con un apporto idrico di soli ${waterMl} ml. Una bassa idratazione sotto sforzo aumenta la fatica muscolare ed accelera la frequenza cardiaca a riposo.`,
      severity: 'warning'
    });
  }

  // 3. Sleep Correlation
  if (activeMinutes >= 60 && sleepHours < 6.5) {
    insights.push({
      type: 'correlation_sleep',
      title: "Debito di sonno post-attività",
      message: "Un allenamento intenso richiede almeno 7-8 ore di sonno per stimolare la riparazione dei tessuti. Un sonno limitato compromette il ripristino del glicogeno muscolare.",
      severity: 'warning'
    });
  }

  // 4. Sugar correlation
  if (sugarGrams > 40 && activeMinutes < 30) {
    insights.push({
      type: 'correlation_nutrition',
      title: "Zuccheri alti e sedentarietà",
      message: "L'alto consumo di zuccheri semplici in assenza di attività fisica aumenta la glicemia e favorisce l'accumulo adiposo invece della sintesi energetica.",
      severity: 'warning'
    });
  }

  return {
    volumeStatus,
    activeMinutes,
    activeCalories,
    workoutsCount,
    insights,
    disclaimer: "DISCLAIMER: I consigli sull'attività fisica sono puramente informativi ed educativi e non sostituiscono programmi prescritti da chinesiologi o medici."
  };
}

export default {
  analyzeActivity
};
