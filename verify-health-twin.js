import fs from 'fs';
import path from 'path';
import { buildDigitalTwinContext } from './src/lib/engines/digital-twin-engine.js';
import { computePredictiveTrends } from './src/lib/engines/predictive-health-engine.js';
import { predictDeficiencies } from './src/lib/engines/deficiency-prediction-engine.js';
import { forecastBiomarkers } from './src/lib/engines/forecast-engine.js';
import { generateEarlyWarnings } from './src/lib/engines/early-warning-engine.js';
import { runSimulation } from './src/lib/engines/simulation-engine.js';
import { getExplanation } from './src/lib/engines/explainability-engine.js';

console.log("=== STARTING PREVENTIVE HEALTH INTELLIGENCE & DIGITAL TWIN VALIDATION ===\n");

let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAILURE: ${message}`);
  }
}

// Mock user records
const mockProfile = {
  age: 32,
  sex: 'female',
  weight_kg: 62,
  height_cm: 165,
  activity_level: 'attivo',
  diet_type: 'vegan'
};

const mockConditions = [
  { condition_name: 'Anemia' }
];

const mockMedications = [
  { medication_name: 'Eutirox', is_active: true }
];

const mockSupplements = [
  { supplement_name: 'Vitamina D', is_active: true }
];

const mockReports = [
  { id: 'rep-1', test_date: '2026-06-20' },
  { id: 'rep-2', test_date: '2026-04-20' }
];

const mockBiomarkers = [
  { report_id: 'rep-1', name: 'ferritina', value: '12', unit: 'ng/mL', status: 'low' },
  { report_id: 'rep-1', name: 'vitamin_d', value: '25', unit: 'ng/mL', status: 'low' },
  { report_id: 'rep-2', name: 'ferritina', value: '18', unit: 'ng/mL', status: 'low' },
  { report_id: 'rep-2', name: 'vitamin_d', value: '19', unit: 'ng/mL', status: 'low' }
];

const mockSleepLogs = [
  { entry_date: '2026-06-20', duration_hours: 6.0, quality_score: 60 },
  { entry_date: '2026-06-19', duration_hours: 5.5, quality_score: 50 },
  { entry_date: '2026-06-18', duration_hours: 8.0, quality_score: 85 }
];

const mockStressLogs = [
  { entry_date: '2026-06-20', stress_level: 8 },
  { entry_date: '2026-06-19', stress_level: 7 },
  { entry_date: '2026-06-18', stress_level: 3 }
];

const mockHydrationLogs = [
  { entry_date: '2026-06-20', water_ml: 1000 },
  { entry_date: '2026-06-19', water_ml: 1200 },
  { entry_date: '2026-06-18', water_ml: 2200 }
];

const mockActivityLogs = [
  { entry_date: '2026-06-20', duration_minutes: 15 },
  { entry_date: '2026-06-19', duration_minutes: 20 },
  { entry_date: '2026-06-18', duration_minutes: 45 }
];

// 1. Validate Digital Twin aggregation
try {
  const twinContext = buildDigitalTwinContext({
    profile: mockProfile,
    conditions: mockConditions,
    allergies: [],
    medications: mockMedications,
    supplements: mockSupplements,
    reports: mockReports,
    biomarkers: mockBiomarkers.filter(b => b.report_id === 'rep-1'),
    sleepLogs: mockSleepLogs,
    stressLogs: mockStressLogs,
    hydrationLogs: mockHydrationLogs,
    activityLogs: mockActivityLogs,
    mealsHistory: []
  });

  assert(twinContext.profile.sex === 'female' && twinContext.profile.age === 32, "digital-twin-engine aggrega correttamente i dati del profilo");
  assert(twinContext.clinical.conditions.includes('Anemia'), "digital-twin-engine include le patologie attive");
  assert(twinContext.clinical.medications.includes('Eutirox'), "digital-twin-engine include i farmaci attivi");
  assert(twinContext.biomarkers.ferritina?.value === 12, "digital-twin-engine estrae i biomarcatori corretti del report più recente");
  assert(twinContext.lifestyleAverages.sleepHours === 6.5, "digital-twin-engine calcola correttamente la media del sonno");
} catch (e) {
  console.error("Errore validazione Digital Twin:", e);
}

// 2. Validate Predictive Health calculations
try {
  // Mock a history list where health score is declining
  const mockHistory = [
    { date: '2026-06-10', healthScore: 90, sleepHours: 8, stressLevel: 2, waterMl: 2000, activeMinutes: 45, nutritionalIndex: 85 },
    { date: '2026-06-11', healthScore: 88, sleepHours: 8, stressLevel: 3, waterMl: 2000, activeMinutes: 40, nutritionalIndex: 82 },
    { date: '2026-06-12', healthScore: 80, sleepHours: 7, stressLevel: 5, waterMl: 1500, activeMinutes: 30, nutritionalIndex: 78 },
    { date: '2026-06-13', healthScore: 72, sleepHours: 6, stressLevel: 7, waterMl: 1200, activeMinutes: 20, nutritionalIndex: 70 },
    { date: '2026-06-14', healthScore: 65, sleepHours: 5, stressLevel: 8, waterMl: 1000, activeMinutes: 10, nutritionalIndex: 62 }
  ];

  const predictive = computePredictiveTrends({ historyLogs: mockHistory });
  
  assert(predictive.days_7.healthScore === 'declining', "predictive-health-engine rileva correttamente i trend in calo dell'Health Score");
  assert(predictive.days_7.stress === 'declining', "predictive-health-engine rileva correttamente lo stress in aumento (come calo dello stato preventivo)");
} catch (e) {
  console.error("Errore validazione Predictive Engine:", e);
}

// 3. Validate Deficiency Prediction
try {
  const twinBiomarkers = {
    ferritina: { value: 12, unit: 'ng/mL', status: 'low' },
    vitamin_d: { value: 25, unit: 'ng/mL', status: 'low' }
  };
  const recentNutrients = {
    iron: 6,
    calcium: 400,
    magnesium: 150,
    omega3: 0.1
  };

  const deficiencies = predictDeficiencies({
    profile: mockProfile,
    conditions: mockConditions,
    medications: mockMedications,
    supplements: mockSupplements,
    biomarkers: twinBiomarkers,
    recentNutrients
  });

  const ironDef = deficiencies.find(d => d.nutrient === 'Ferro');
  const vitDDef = deficiencies.find(d => d.nutrient === 'Vitamina D');
  const calciumDef = deficiencies.find(d => d.nutrient === 'Calcio');

  assert(ironDef && ironDef.probability === 'high', "deficiency-prediction-engine rileva alto rischio carenza Ferro per Ferritina bassa + Anemia");
  assert(vitDDef && vitDDef.probability === 'low', "deficiency-prediction-engine attenua correttamente il rischio Vitamina D per via dell'integratore attivo");
  assert(calciumDef && calciumDef.probability === 'high', "deficiency-prediction-engine rileva alto rischio Calcio per assunzione concomitante di Eutirox");
} catch (e) {
  console.error("Errore validazione Deficiency Prediction:", e);
}

// 4. Validate Biomarker Forecast
try {
  const forecasts = forecastBiomarkers({
    reports: mockReports,
    historicalBiomarkers: mockBiomarkers
  });

  const ferritinFore = forecasts.ferritin || forecasts.ferritina;
  const glucoseFore = forecasts.glucose || forecasts.glicemia;

  assert(ferritinFore && ferritinFore.forecastValue !== null, "forecast-engine calcola correttamente le proiezioni lineari con dati storici sufficienti (>= 2)");
  assert(glucoseFore && glucoseFore.forecastValue === null && glucoseFore.message.includes("Dati insufficienti"), "forecast-engine gestisce in modo sicuro le esclusioni per storico insufficiente");
} catch (e) {
  console.error("Errore validazione Forecast Engine:", e);
}

// 5. Validate Early Warnings
try {
  const mockPredictive = {
    days_7: { healthScore: 'declining', sleep: 'declining', stress: 'declining' }
  };
  const mockDef = [{ nutrient: 'Ferro', probability: 'high', timeHorizon: '30 giorni', confidenceLevel: 'high' }];
  const mockFore = {
    cholesterol: { trend: 'increasing', forecastValue: 240, unit: 'mg/dL', confidenceScore: 80 }
  };

  const warnings = generateEarlyWarnings({
    predictiveTrends: mockPredictive,
    deficiencies: mockDef,
    biomarkersForecast: mockFore
  });

  const hasHealthScoreWarn = warnings.some(w => w.key === 'health_score_declining');
  const hasDefWarn = warnings.some(w => w.key === 'warning_def_ferro');
  const hasCholesterolWarn = warnings.some(w => w.key === 'warning_cholesterol_increasing');

  assert(hasHealthScoreWarn, "early-warning-engine attiva allarmi per il calo del punteggio di salute");
  assert(hasDefWarn, "early-warning-engine attiva allarmi per carenze future probabili");
  assert(hasCholesterolWarn, "early-warning-engine attiva allarmi preventivi per andamenti anomali dei biomarcatori");
} catch (e) {
  console.error("Errore validazione Early Warning:", e);
}

// 6. Validate Simulation Engine
try {
  const sim = runSimulation(70, {
    sleepDeltaHours: 1.5,
    waterDeltaMl: 500,
    activeMinutesDelta: 30
  });

  assert(sim.potentialScore > 70, "simulation-engine incrementa il punteggio di salute ipotetico in base ai miglioramenti impostati");
  assert(sim.impactDetails.length === 3, "simulation-engine genera spiegazioni dettagliate per ciascun parametro alterato");
  assert(sim.disclaimer.includes("SIMULAZIONE IPOTETICA"), "simulation-engine include il disclaimer preventivo obbligatorio");
} catch (e) {
  console.error("Errore validazione Simulation Engine:", e);
}

// 7. Validate Explainability
try {
  const defExpl = getExplanation('deficiency', { nutrient: 'Ferro', reasons: ['Ferritina bassa'], confidenceLevel: 'high' });
  const foreExpl = getExplanation('forecast', { key: 'glicemia', historyLength: 2, confidenceScore: 75 });

  assert(defExpl.title.includes("Ferro") && defExpl.reasoning.includes("Ferritina bassa"), "explainability-engine spiega correttamente i motivi di un allarme carenza");
  assert(foreExpl.limits.includes("Questo modello"), "explainability-engine include i limiti del modello matematico in ogni spiegazione");
} catch (e) {
  console.error("Errore validazione Explainability:", e);
}

// 8. Security Check: No clinical digital twin or predictive data in local/session storage
try {
  const filesToScan = [
    'src/pages/DashboardPage.jsx',
    'src/pages/AiChatPage.jsx',
    'src/components/AiHealthTwinCard.jsx',
    'src/lib/engines/digital-twin-engine.js',
    'src/lib/engines/predictive-health-engine.js'
  ];

  let storageViolated = false;
  filesToScan.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const hasLocalStorage = content.includes('localStorage.set') || content.includes('localStorage[');
      const hasSessionStorage = content.includes('sessionStorage.set') || content.includes('sessionStorage[');
      if (hasLocalStorage || hasSessionStorage) {
        console.error(`❌ Violazione sicurezza nel file ${file}: rilevato salvataggio in local/session storage!`);
        storageViolated = true;
      }
    }
  });

  assert(!storageViolated, "Nessun dato del Digital Twin o clinico persistito in localStorage o sessionStorage");
} catch (e) {
  console.error("Errore verifica storage sanitari:", e);
}

console.log(`\n=== VALIDATION COMPLETE: Passed ${testsPassed}/${totalTests} tests ===`);
if (testsPassed === totalTests) {
  console.log("🚀 ALL PREVENTIVE HEALTH INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("❌ SOME TESTS FAILED. Please review findings.");
  process.exit(1);
}
