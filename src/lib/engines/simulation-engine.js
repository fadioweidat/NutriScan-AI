/**
 * Simulation Engine (Phase 6)
 * Simulates hypothetical lifestyle/nutritional improvements.
 * Strictly educational and non-diagnostic.
 */

export function runSimulation(currentScore, params = {}) {
  const baseScore = currentScore || 70;
  let potentialScore = baseScore;
  const impactDetails = [];

  const sleepDelta = Number(params.sleepDeltaHours || 0);
  const waterDelta = Number(params.waterDeltaMl || 0);
  const activityDelta = Number(params.activeMinutesDelta || 0);
  const sugarReduction = Number(params.sugarReductionGrams || 0);
  const weightLoss = Number(params.weightLossKg || 0);

  if (sleepDelta !== 0) {
    const scoreIncrease = sleepDelta * 4;
    potentialScore = Math.min(potentialScore + scoreIncrease, 100);
    impactDetails.push(`Un incremento di ${sleepDelta}h nel riposo notturno stima un beneficio metabolico di +${scoreIncrease.toFixed(1)} punti.`);
  }

  if (waterDelta !== 0) {
    const scoreIncrease = (waterDelta / 250) * 1.5;
    potentialScore = Math.min(potentialScore + scoreIncrease, 100);
    impactDetails.push(`Aumentare l'idratazione di ${waterDelta}ml (+${(waterDelta/250).toFixed(0)} bicchieri) stima un incremento di +${scoreIncrease.toFixed(1)} punti.`);
  }

  if (activityDelta !== 0) {
    const scoreIncrease = (activityDelta / 15) * 2;
    potentialScore = Math.min(potentialScore + scoreIncrease, 100);
    impactDetails.push(`Svolgere ${activityDelta} minuti in più di esercizio fisico stima un potenziale beneficio cardiovascolare di +${scoreIncrease.toFixed(1)} punti.`);
  }

  if (sugarReduction !== 0) {
    const scoreIncrease = (sugarReduction / 10) * 2.5;
    potentialScore = Math.min(potentialScore + scoreIncrease, 100);
    impactDetails.push(`Ridurre ${sugarReduction}g di zuccheri raffinati stima una riduzione dei picchi insulinici e un incremento dello score di +${scoreIncrease.toFixed(1)} punti.`);
  }

  if (weightLoss !== 0) {
    const scoreIncrease = weightLoss * 2;
    potentialScore = Math.min(potentialScore + scoreIncrease, 100);
    impactDetails.push(`Una riduzione ponderale ipotetica di ${weightLoss} kg stima una diminuzione del carico infiammatorio di +${scoreIncrease.toFixed(1)} punti.`);
  }

  return {
    originalScore: baseScore,
    potentialScore: Math.round(potentialScore),
    scoreDelta: Math.round(potentialScore - baseScore),
    impactDetails,
    disclaimer: "SIMULAZIONE IPOTETICA: Questo modello previsionale ha solo scopi educativi ed illustrativi, non garantisce variazioni cliniche reali."
  };
}

export default {
  runSimulation
};
