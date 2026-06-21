/**
 * Explainability Engine (Phase 6)
 * Explains model predictions, baseline data, confidence, and constraints.
 * Strictly educational and non-diagnostic.
 */

export function getExplanation(type, data = {}) {
  const limits = "Questo modello previsionale è basato esclusivamente su trend storici e dati forniti dall'utente. Non considera variabili metaboliche complesse ed impreviste o diagnosi genetiche.";

  switch (type) {
    case 'deficiency':
      return {
        title: `Analisi del rischio carenza di ${data.nutrient}`,
        dataUsed: "Diario alimentare (macronutrienti e micronutrienti), esami del sangue storici, patologie e farmaci attivi.",
        reasoning: data.reasons && data.reasons.length > 0 
          ? `Rischio stimato a causa di: ${data.reasons.join('; ')}.`
          : `L'apporto medio di questo nutriente è inferiore alle linee guida raccomandate per sesso ed età.`,
        confidence: data.confidenceLevel === 'high' ? 85 : 60,
        limits
      };

    case 'warning':
      return {
        title: `Spiegazione Alert: ${data.title}`,
        dataUsed: "Registrazioni longitudinali di stile di vita (sonno, stress, idratazione, allenamenti) e andamento dell'Health Score.",
        reasoning: `Il sistema ha riscontrato una variazione negativa persistente (peggioramento) rispetto alla media dei periodi passati.`,
        confidence: data.confidence || 75,
        limits
      };

    case 'forecast':
      return {
        title: `Spiegazione Proiezione Biomarcatore: ${data.biomarkerName || data.key}`,
        dataUsed: "Valori storici estratti dai referti degli esami del sangue caricati dall'utente.",
        reasoning: data.historyLength >= 2 
          ? `La stima prolunga linearmente la pendenza del trend misurato tra i tuoi ${data.historyLength} prelievi passati.`
          : "Dati storici insufficienti. La proiezione lineare richiede almeno 2 referti in date differenti.",
        confidence: data.confidenceScore || 0,
        limits
      };

    default:
      return {
        title: "Spiegazione Analisi Preventiva",
        dataUsed: "Aggregazione dinamica del Digital Twin in memoria React.",
        reasoning: "Correlazione statistica e longitudinale di dati nutrizionali e parametri biologici.",
        confidence: 70,
        limits
      };
  }
}

export default {
  getExplanation
};
