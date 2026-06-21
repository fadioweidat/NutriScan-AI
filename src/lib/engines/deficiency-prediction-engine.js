/**
 * Deficiency Prediction Engine (Phase 6)
 * Predicts potential future micronutrient deficiencies.
 * Strictly educational and non-diagnostic.
 */

export function predictDeficiencies({
  profile = {},
  conditions = [],
  medications = [],
  supplements = [],
  biomarkers = {}, // aggregated by key: { value, unit, status }
  recentNutrients = {} // average daily intake of iron, calcium, magnesium, etc.
}) {
  const activeConditions = (conditions || []).map(c => (c.condition_name || c.name || '').toLowerCase());
  const activeMeds = (medications || []).map(m => (m.medication_name || m.name || '').toLowerCase());
  const activeSupps = (supplements || []).map(s => (s.supplement_name || s.name || '').toLowerCase());

  const predictions = [];

  const disclaimer = "Le previsioni di carenza hanno scopo puramente informativo ed educativo. Non sostituiscono esami clinici o diagnosi mediche.";

  // 1. IRON (FERRO)
  let ironProb = 'low';
  let ironHorizon = 'N/A';
  let ironConf = 'low';
  let ironReasons = [];

  const ferritin = biomarkers.ferritin || biomarkers.ferritina;
  const ironBiomarker = biomarkers.iron || biomarkers.ferro;

  if (ferritin && ferritin.value < 20) {
    ironProb = 'high';
    ironHorizon = '30-60 giorni';
    ironConf = 'high';
    ironReasons.push("Livello basso di ferritina nei recenti esami del sangue (<20 ng/mL)");
  } else if (ironBiomarker && ironBiomarker.value < 50) {
    ironProb = 'medium';
    ironHorizon = '30-60 giorni';
    ironConf = 'high';
    ironReasons.push("Livello basso di ferro sierico nei recenti esami del sangue (<50 mcg/dL)");
  } else {
    // Dietary check
    const avgIronIntake = recentNutrients.iron || recentNutrients.ferro || 12; // mg
    const rdaIron = profile.sex === 'female' && profile.age < 50 ? 18 : 8;
    if (avgIronIntake < rdaIron * 0.6) {
      ironProb = 'medium';
      ironHorizon = '60-90 giorni';
      ironConf = 'medium';
      ironReasons.push(`Apporto medio stimato di ferro (${avgIronIntake.toFixed(1)} mg) inferiore al 60% del fabbisogno giornaliero`);
    }
  }

  if (activeConditions.includes('anemia') || activeConditions.includes('anemia sideropenica')) {
    ironProb = 'high';
    ironHorizon = '30 giorni';
    ironConf = 'high';
    ironReasons.push("Presenza di diagnosi clinica pregressa di anemia");
  }

  // Adjust if supplement is active
  if (activeSupps.some(s => s.includes('ferro') || s.includes('iron') || s.includes('multivitaminico'))) {
    ironProb = ironProb === 'high' ? 'medium' : 'low';
    ironReasons.push("Integrazione di ferro/multivitaminici attiva (riduce il rischio)");
  }

  predictions.push({
    nutrient: 'Ferro',
    probability: ironProb,
    timeHorizon: ironHorizon,
    confidenceLevel: ironConf,
    reasons: ironReasons,
    disclaimer
  });

  // 2. VITAMIN D
  let vitDProb = 'low';
  let vitDHorizon = 'N/A';
  let vitDConf = 'low';
  let vitDReasons = [];

  const vitDBiomarker = biomarkers.vitamin_d || biomarkers.vitamina_d;

  if (vitDBiomarker && vitDBiomarker.value < 20) {
    vitDProb = 'high';
    vitDHorizon = '30-60 giorni';
    vitDConf = 'high';
    vitDReasons.push("Livello di Vitamina D inferiore al valore desiderabile nei recenti esami del sangue (<20 ng/mL)");
  } else if (vitDBiomarker && vitDBiomarker.value < 30) {
    vitDProb = 'medium';
    vitDHorizon = '60-90 giorni';
    vitDConf = 'high';
    vitDReasons.push("Livello di Vitamina D borderline (insufficiente) negli esami (<30 ng/mL)");
  } else {
    const avgVitD = recentNutrients.vitamin_d || recentNutrients.vitamina_d || 2; // mcg
    if (avgVitD < 5) {
      vitDProb = 'medium';
      vitDHorizon = '90+ giorni';
      vitDConf = 'medium';
      vitDReasons.push("Basso apporto alimentar di alimenti ricchi di Vitamina D");
    }
  }

  if (activeSupps.some(s => s.includes('vitamina d') || s.includes('colecalciferolo') || s.includes('vitamin d'))) {
    vitDProb = 'low';
    vitDReasons.push("Integrazione regolare di Vitamina D attiva");
  }

  predictions.push({
    nutrient: 'Vitamina D',
    probability: vitDProb,
    timeHorizon: vitDHorizon,
    confidenceLevel: vitDConf,
    reasons: vitDReasons,
    disclaimer
  });

  // 3. VITAMIN B12
  let b12Prob = 'low';
  let b12Horizon = 'N/A';
  let b12Conf = 'low';
  let b12Reasons = [];

  const b12Biomarker = biomarkers.vitamin_b12 || biomarkers.vitamina_b12;

  if (b12Biomarker && b12Biomarker.value < 200) {
    b12Prob = 'high';
    b12Horizon = '30-60 giorni';
    b12Conf = 'high';
    b12Reasons.push("Livelli bassi di Vitamina B12 sierica negli esami (<200 pg/mL)");
  } else if (profile.dietType === 'vegan' || profile.dietType === 'vegetarian' || profile.dietType === 'vegetariana') {
    const takesB12 = activeSupps.some(s => s.includes('b12') || s.includes('cobalamina') || s.includes('multivitaminico') || s.includes('b-complex'));
    if (!takesB12) {
      b12Prob = 'high';
      b12Horizon = '90+ giorni';
      b12Conf = 'high';
      b12Reasons.push("Dieta vegetale/vegana attiva senza integrazione documentata di Vitamina B12");
    }
  }

  predictions.push({
    nutrient: 'Vitamina B12',
    probability: b12Prob,
    timeHorizon: b12Horizon,
    confidenceLevel: b12Conf,
    reasons: b12Reasons,
    disclaimer
  });

  // 4. CALCIUM (CALCIO)
  let calciumProb = 'low';
  let calciumHorizon = 'N/A';
  let calciumConf = 'low';
  let calciumReasons = [];

  const calciumBiomarker = biomarkers.calcium || biomarkers.calcio;

  if (calciumBiomarker && calciumBiomarker.value < 8.5) {
    calciumProb = 'high';
    calciumHorizon = '30-60 giorni';
    calciumConf = 'high';
    calciumReasons.push("Livello di calcio sierico inferiore all'intervallo di riferimento (<8.5 mg/dL)");
  } else {
    const avgCalcium = recentNutrients.calcium || recentNutrients.calcio || 600;
    if (avgCalcium < 500) {
      calciumProb = 'medium';
      calciumHorizon = '90+ giorni';
      calciumConf = 'medium';
      calciumReasons.push(`Apporto medio stimato di calcio (${avgCalcium} mg) molto basso rispetto all'RDA standard (1000 mg)`);
    }
  }

  // Corticosteroids or thyroid hormone overreplacement can accelerate calcium depletion/excretion
  if (
    activeMeds.some(m => 
      m.includes('cortisone') || m.includes('prednisone') || m.includes('bentelan') ||
      m.includes('eutirox') || m.includes('levotiroxina')
    )
  ) {
    calciumProb = 'high';
    calciumHorizon = '60 giorni';
    calciumConf = 'medium';
    calciumReasons.push("Assunzione attiva di corticosteroidi o ormoni tiroidei (può alterare il metabolismo/escrezione del calcio)");
  }

  if (activeSupps.some(s => s.includes('calcio') || s.includes('calcium'))) {
    calciumProb = 'low';
    calciumReasons.push("Integrazione di calcio attiva");
  }

  predictions.push({
    nutrient: 'Calcio',
    probability: calciumProb,
    timeHorizon: calciumHorizon,
    confidenceLevel: calciumConf,
    reasons: calciumReasons,
    disclaimer
  });

  // 5. MAGNESIUM (MAGNESIO)
  let magnesiumProb = 'low';
  let magnesiumHorizon = 'N/A';
  let magnesiumConf = 'low';
  let magnesiumReasons = [];

  const magnesiumBiomarker = biomarkers.magnesium || biomarkers.magnesio;

  if (magnesiumBiomarker && magnesiumBiomarker.value < 1.7) {
    magnesiumProb = 'high';
    magnesiumHorizon = '30 giorni';
    magnesiumConf = 'high';
    magnesiumReasons.push("Livello sierico di magnesio basso rilevato (<1.7 mg/dL)");
  } else {
    const avgMag = recentNutrients.magnesium || recentNutrients.magnesio || 250;
    if (avgMag < 200) {
      magnesiumProb = 'medium';
      magnesiumHorizon = '30-60 giorni';
      magnesiumConf = 'medium';
      magnesiumReasons.push(`Basso apporto alimentare medio stimato di magnesio (${avgMag} mg)`);
    }
  }

  if (activeSupps.some(s => s.includes('magnesio') || s.includes('magnesium') || s.includes('magnesio supremo'))) {
    magnesiumProb = 'low';
    magnesiumReasons.push("Integrazione di magnesio attiva");
  }

  predictions.push({
    nutrient: 'Magnesio',
    probability: magnesiumProb,
    timeHorizon: magnesiumHorizon,
    confidenceLevel: magnesiumConf,
    reasons: magnesiumReasons,
    disclaimer
  });

  // 6. OMEGA 3
  let omega3Prob = 'low';
  let omega3Horizon = 'N/A';
  let omega3Conf = 'low';
  let omega3Reasons = [];

  const avgOmega3 = recentNutrients.omega3 || 0.1; // g
  if (avgOmega3 < 0.25) {
    omega3Prob = 'medium';
    omega3Horizon = '30-60 giorni';
    omega3Conf = 'medium';
    omega3Reasons.push(`Apporto medio stimato di acidi grassi Omega-3 (${avgOmega3.toFixed(2)} g) inferiore al livello ottimale (0.25 g - 0.5 g/giorno)`);
  }

  if (activeSupps.some(s => s.includes('omega 3') || s.includes('omega-3') || s.includes('olio di pesce') || s.includes('fish oil'))) {
    omega3Prob = 'low';
    omega3Reasons.push("Integrazione di acidi grassi Omega-3 attiva");
  }

  predictions.push({
    nutrient: 'Omega 3',
    probability: omega3Prob,
    timeHorizon: omega3Horizon,
    confidenceLevel: omega3Conf,
    reasons: omega3Reasons,
    disclaimer
  });

  return predictions;
}

export default {
  predictDeficiencies
};
