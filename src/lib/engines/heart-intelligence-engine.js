/**
 * Heart Intelligence Engine (Phase 8)
 * Evaluates heart rate, resting heart rate (RHR), and Heart Rate Variability (HRV).
 * Strictly educational and non-diagnostic.
 */

export function analyzeHeartMetrics({
  restingHeartRate = 65, // bpm
  averageHeartRate = 75, // bpm
  hrv = 55, // ms
  stressLevel = 5
}) {
  const insights = [];
  
  // 1. Resting Heart Rate (RHR) check
  let rhrStatus = 'normal';
  if (restingHeartRate < 50) {
    rhrStatus = 'low'; // bradycardia or athletic conditioning
    insights.push({
      key: 'rhr_low',
      title: "Frequenza cardiaca a riposo bassa",
      description: `Il tuo battito cardiaco a riposo è di ${restingHeartRate} bpm. Se sei un atleta ben allenato, questo è un indice di eccellente efficienza cardiaca. Altrimenti, consulta il medico se si associa a capogiri.`,
      status: 'info'
    });
  } else if (restingHeartRate > 80) {
    rhrStatus = 'high'; // tachycardia or stress
    insights.push({
      key: 'rhr_high',
      title: "Battito cardiaco a riposo accelerato",
      description: `Il tuo battito cardiaco a riposo è di ${restingHeartRate} bpm. Può essere causato da stress, stanchezza accumulata, disidratazione, febbre o eccessivo consumo di caffeina.`,
      status: 'warning'
    });
  } else {
    insights.push({
      key: 'rhr_normal',
      title: "Frequenza cardiaca a riposo regolare",
      description: `Frequenza cardiaca di ${restingHeartRate} bpm all'interno del range di normalità clinica (50-80 bpm).`,
      status: 'normal'
    });
  }

  // 2. HRV (Heart Rate Variability) analysis
  let hrvStatus = 'normal';
  if (hrv < 35) {
    hrvStatus = 'low';
    insights.push({
      key: 'hrv_low',
      title: "Variabilità cardiaca (HRV) ridotta",
      description: `Un valore di HRV di ${hrv} ms indica una prevalenza del sistema nervoso simpatico (stress / mancato recupero). Si consiglia di pianificare una giornata di riposo ed eseguire esercizi di respirazione diaframmatica.`,
      status: 'warning'
    });
  } else if (hrv > 75) {
    hrvStatus = 'high';
    insights.push({
      key: 'hrv_high',
      title: "Variabilità cardiaca (HRV) ottimale",
      description: `Il valore di HRV di ${hrv} ms indica un forte tono del sistema parasimpatico (pronto a supportare sforzi fisici e cognitivi elevati).`,
      status: 'success'
    });
  }

  // 3. Autonomic balance correlation
  let autonomicBalance = 'balanced';
  if (stressLevel > 7 && hrv < 40) {
    autonomicBalance = 'sympathetic_dominance';
    insights.push({
      key: 'autonomic_sympathetic',
      title: "Dominanza Simpatica (Stress Cronico)",
      description: "La combinazione di stress percepito alto e HRV ridotto suggerisce uno stato di allerta prolungato. Ridurre il consumo di stimolanti ed aumentare il rilassamento serale.",
      status: 'warning'
    });
  }

  return {
    restingHeartRate,
    averageHeartRate,
    hrv,
    rhrStatus,
    hrvStatus,
    autonomicBalance,
    insights,
    disclaimer: "DISCLAIMER MEDICO: L'analisi del battito cardiaco e dell'HRV ha finalità puramente informative ed educative. Non costituisce diagnosi di aritmie, patologie cardiache o anomalie pressorie."
  };
}

export default {
  analyzeHeartMetrics
};
