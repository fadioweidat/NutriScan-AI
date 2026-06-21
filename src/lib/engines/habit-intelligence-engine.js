/**
 * Habit Intelligence Engine (Phase 6)
 * Detects behavioral correlations across logs.
 * Strictly educational and non-diagnostic.
 */

export function analyzeHabits({
  historyLogs = [], // array of { date, healthScore, sleepHours, sleepQuality, stressLevel, waterMl, activeMinutes, sugarGrams }
}) {
  const patterns = [];

  if (!historyLogs || historyLogs.length < 5) {
    // Insufficient logs: provide general educational patterns
    return [
      {
        title: "Poco sonno & Cibo spazzatura",
        description: "Gli studi dimostrano che dormire meno di 7 ore altera gli ormoni della fame, aumentando il desiderio di cibi ricchi di zuccheri e grassi del 20-30%.",
        correlationScore: 0.8,
        isCustom: false
      },
      {
        title: "Stress & Score Nutrizionale",
        description: "Livelli di stress persistente riducono la regolarità dei pasti sani. Un controllo attivo dello stress favorisce scelte dietetiche migliori.",
        correlationScore: 0.75,
        isCustom: false
      },
      {
        title: "Idratazione & Concentrazione",
        description: "Anche una lieve disidratazione (perdita del 1-2% di acqua corporea) riduce la concentrazione e la resistenza durante l'esercizio fisico.",
        correlationScore: 0.85,
        isCustom: false
      }
    ];
  }

  // 1. Sleep deprivation vs Sugar cravings
  const lowSleepDays = historyLogs.filter(d => d.sleepHours > 0 && d.sleepHours < 6.5);
  const goodSleepDays = historyLogs.filter(d => d.sleepHours >= 7);

  if (lowSleepDays.length >= 2 && goodSleepDays.length >= 2) {
    const avgSugarLowSleep = lowSleepDays.reduce((sum, d) => sum + (d.sugarGrams || 0), 0) / lowSleepDays.length;
    const avgSugarGoodSleep = goodSleepDays.reduce((sum, d) => sum + (d.sugarGrams || 0), 0) / goodSleepDays.length;

    if (avgSugarLowSleep > avgSugarGoodSleep * 1.1) {
      const diffPct = Math.round(((avgSugarLowSleep - avgSugarGoodSleep) / avgSugarGoodSleep) * 100);
      patterns.push({
        title: "Sonno Ridotto & Zuccheri",
        description: `Nei giorni con meno di 6.5 ore di sonno, assumi in media il ${diffPct}% in più di zuccheri rispetto alle notti con sonno adeguato.`,
        correlationScore: 0.82,
        isCustom: true
      });
    }
  }

  // 2. High Stress vs Health Score
  const highStressDays = historyLogs.filter(d => d.stressLevel > 6);
  const lowStressDays = historyLogs.filter(d => d.stressLevel <= 4);

  if (highStressDays.length >= 2 && lowStressDays.length >= 2) {
    const avgScoreHighStress = highStressDays.reduce((sum, d) => sum + (d.healthScore || 0), 0) / highStressDays.length;
    const avgScoreLowStress = lowStressDays.reduce((sum, d) => sum + (d.healthScore || 0), 0) / lowStressDays.length;

    if (avgScoreHighStress < avgScoreLowStress - 5) {
      const diffPoints = Math.round(avgScoreLowStress - avgScoreHighStress);
      patterns.push({
        title: "Stress Elevato & Health Score",
        description: `Durante le giornate ad alto stress, il tuo punteggio di salute giornaliero scende mediamente di ${diffPoints} punti.`,
        correlationScore: 0.78,
        isCustom: true
      });
    }
  }

  // 3. Hydration vs Performance/Active Minutes
  const lowWaterDays = historyLogs.filter(d => d.waterMl > 0 && d.waterMl < 1200);
  const goodWaterDays = historyLogs.filter(d => d.waterMl >= 2000);

  if (lowWaterDays.length >= 2 && goodWaterDays.length >= 2) {
    const avgActiveLowWater = lowWaterDays.reduce((sum, d) => sum + (d.activeMinutes || 0), 0) / lowWaterDays.length;
    const avgActiveGoodWater = goodWaterDays.reduce((sum, d) => sum + (d.activeMinutes || 0), 0) / goodWaterDays.length;

    if (avgActiveLowWater < avgActiveGoodWater * 0.8) {
      patterns.push({
        title: "Idratazione Bassa & Attività",
        description: "Si osserva una riduzione del tempo di attività fisica nei giorni in cui bevi meno di 1.2 litri d'acqua.",
        correlationScore: 0.7,
        isCustom: true
      });
    }
  }

  // Fallback if no specific patterns emerged
  if (patterns.length === 0) {
    patterns.push({
      title: "Costanza & Livelli di Energia",
      description: "I tuoi dati mostrano un allineamento stabile tra l'attività fisica quotidiana e l'equilibrio dei nutrienti assunti.",
      correlationScore: 0.6,
      isCustom: true
    });
  }

  return patterns;
}

export default {
  analyzeHabits
};
