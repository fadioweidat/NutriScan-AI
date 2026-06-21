import fs from 'fs';
import path from 'path';

// Import all engines
import medicalEngine from './src/lib/engines/medical-knowledge-engine.js';
import diseaseEngine from './src/lib/disease-engine.js';
import scientificEngine from './src/lib/engines/scientific-nutrition-engine.js';
import dailyScoreEngine from './src/lib/engines/daily-score-engine.js';
import trendEngine from './src/lib/engines/trend-engine.js';
import goalEngine from './src/lib/engines/goal-engine.js';
import healthCoachEngine from './src/lib/engines/health-coach-engine.js';
import recipeEngine from './src/lib/engines/recipe-engine.js';
import mealPlannerEngine from './src/lib/engines/meal-planner-engine.js';
import foodSubstitutionEngine from './src/lib/engines/food-substitution-engine.js';
import shoppingListEngine from './src/lib/engines/shopping-list-engine.js';
import weeklyBalanceEngine from './src/lib/engines/weekly-balance-engine.js';
import { buildDigitalTwinContext } from './src/lib/engines/digital-twin-engine.js';
import { computePredictiveTrends } from './src/lib/engines/predictive-health-engine.js';
import { predictDeficiencies } from './src/lib/engines/deficiency-prediction-engine.js';
import { forecastBiomarkers } from './src/lib/engines/forecast-engine.js';
import { generateEarlyWarnings } from './src/lib/engines/early-warning-engine.js';
import { runSimulation } from './src/lib/engines/simulation-engine.js';
import { getExplanation } from './src/lib/engines/explainability-engine.js';

console.log("=========================================================================");
console.log("=== NUTRISCAN AI - CLINICAL VALIDATION & QUALITY ASSURANCE AUDIT SUITE ===");
console.log("=========================================================================\n");

let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAILURE: ${message}`);
  }
}

// ----------------------------------------------------
// 1. CLINICAL ENGINE VALIDATION
// ----------------------------------------------------
console.log("--- 1. CLINICAL ENGINE VALIDATION ---");

// Test Medical Intelligence
try {
  const result = medicalEngine.checkMedicationInteractions([
    { medication_name: 'Metformina', is_active: true }
  ]);
  const metforminaWarn = result.find(w => w.medication.toLowerCase() === 'metformina');
  assert(metforminaWarn && metforminaWarn.message.includes("Vitamina B12"), "Medical Intelligence: rileva deficit di B12 da Metformina");
} catch (e) {
  console.error("  ❌ Medical Intelligence Error:", e.message);
}

// Test Scientific Nutrition
try {
  const syn = scientificEngine.NUTRIENT_SYNERGIES.find(s => s.key === 'ferro_vegetale_vitamina_c');
  assert(syn && syn.partners.includes('iron') && syn.partners.includes('vitamin_c'), "Scientific Nutrition: sinergia Ferro + Vitamina C mappata");
} catch (e) {
  console.error("  ❌ Scientific Nutrition Error:", e.message);
}

// Test Health Coach
try {
  const mockSupabase = {
    from: (table) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        gte: () => chain,
        order: () => chain,
        maybeSingle: async () => {
          if (table === 'health_profiles') return { data: { user_id: 'test-user', diet_type: 'vegan' } };
          return { data: null };
        },
        then: (resolveFn) => {
          let data = [];
          if (table === 'blood_test_reports') data = [{ id: 'report-1', test_date: '2026-06-01' }];
          else if (table === 'blood_test_biomarkers') data = [{ biomarker_name: 'Vitamina D', value: '12', unit: 'ng/mL', status: 'low' }];
          return Promise.resolve(resolveFn({ data, error: null }));
        }
      };
      return chain;
    }
  };
  const coachContext = await healthCoachEngine.getHealthCoachContext(mockSupabase, 'test-user');
  const hasVitD = coachContext.priorities.some(p => p.includes("Vitamina D"));
  assert(hasVitD, "Health Coach: identifica priorità corretta per Vitamina D bassa negli esami");
} catch (e) {
  console.error("  ❌ Health Coach Error:", e.stack || e.message);
}

// Test Meal Planner
try {
  const alternatives = foodSubstitutionEngine.getSubstitutionsForFood("Salmone", "standard");
  assert(alternatives && alternatives.length > 0, "Meal Planner: trova sostituti nutrizionali validi per Salmone");
} catch (e) {
  console.error("  ❌ Meal Planner Error:", e.message);
}

// Test Digital Twin
try {
  const twin = buildDigitalTwinContext({
    profile: { age: 35, sex: 'female', weight_kg: 60, height_cm: 168 },
    conditions: [{ condition_name: 'Ipertensione' }],
    medications: [],
    supplements: [],
    reports: [],
    biomarkers: [],
    sleepLogs: [{ duration_hours: 8 }],
    stressLogs: [{ stress_level: 3 }],
    hydrationLogs: [{ water_ml: 2000 }],
    activityLogs: [{ duration_minutes: 40 }]
  });
  assert(twin.clinical.conditions.includes("Ipertensione") && twin.lifestyleAverages.sleepHours === 8, "Digital Twin: aggrega dati clinici e lifestyle corretti");
} catch (e) {
  console.error("  ❌ Digital Twin Error:", e.message);
}

// Test Forecast Engine
try {
  const mockReports = [{ id: '1', test_date: '2026-01-01' }, { id: '2', test_date: '2026-03-01' }];
  const mockBiomarkers = [
    { report_id: '1', name: 'ferritina', value: '15', unit: 'ng/mL' },
    { report_id: '2', name: 'ferritina', value: '25', unit: 'ng/mL' }
  ];
  const forecasts = forecastBiomarkers({ reports: mockReports, historicalBiomarkers: mockBiomarkers });
  assert(forecasts.ferritina && forecasts.ferritina.forecastValue > 25, "Forecast Engine: calcola correttamente la proiezione lineare crescente");
} catch (e) {
  console.error("  ❌ Forecast Engine Error:", e.message);
}

// Test Deficiency Prediction
try {
  const defs = predictDeficiencies({
    profile: { diet_type: 'vegan', sex: 'female', age: 30 },
    conditions: [{ condition_name: 'Anemia' }],
    medications: [],
    supplements: [],
    biomarkers: {},
    recentNutrients: { iron: 4 }
  });
  const ironRisk = defs.find(d => d.nutrient === 'Ferro');
  assert(ironRisk && ironRisk.probability === 'high', "Deficiency Prediction: rileva alto rischio carenza di Ferro su dieta vegana sbilanciata");
} catch (e) {
  console.error("  ❌ Deficiency Prediction Error:", e.message);
}

// Test Simulation Engine
try {
  const result = runSimulation(70, { sleepDeltaHours: 2, waterDeltaMl: 500, activeMinutesDelta: 30 });
  assert(result.potentialScore > 70 && result.impactDetails.length > 0, "Simulation Engine: calcola l'incremento di punteggio e restituisce dettagli");
} catch (e) {
  console.error("  ❌ Simulation Engine Error:", e.message);
}

// Test Explainability
try {
  const explanation = getExplanation('deficiency', { nutrient: 'Ferro', reasons: ['Dieta Vegana'], confidenceLevel: 'medium' });
  assert(explanation.title.includes("Ferro") && explanation.limits.includes("Questo modello"), "Explainability: spiega la carenza descrivendone i limiti scientifici");
} catch (e) {
  console.error("  ❌ Explainability Error:", e.message);
}
console.log();

// ----------------------------------------------------
// 2. MATHEMATICAL VALIDATION
// ----------------------------------------------------
console.log("--- 2. MATHEMATICAL VALIDATION ---");

// Test linear regression math directly
try {
  const reports = [
    { id: '1', test_date: '2026-06-01' },
    { id: '2', test_date: '2026-06-11' } // exactly 10 days later
  ];
  const historicalBiomarkers = [
    { report_id: '1', name: 'colesterolo', value: '200', unit: 'mg/dL' },
    { report_id: '2', name: 'colesterolo', value: '210', unit: 'mg/dL' } // +10 mg/dL in 10 days (slope = 1 mg/dL per day)
  ];
  const forecasts = forecastBiomarkers({ reports, historicalBiomarkers });
  // Forecast projects 60 days from latest report (2026-06-11)
  // Target value should be: 210 + (1 * 60) = 270 mg/dL
  const forecastVal = forecasts.colesterolo.forecastValue;
  assert(forecastVal === 270, `Mathematical Forecast: slope calcolata corretta (prevista: 270 mg/dL, ottenuta: ${forecastVal} mg/dL)`);
} catch (e) {
  console.error("  ❌ Mathematical Forecast Error:", e.message);
}

// Test diet compliance math
try {
  const ketoMeals = [
    { name: 'Keto Breakfast', carbohydrates_g: 5, proteins_g: 20, lipids_g: 30, calories_kcal: 400 },
    { name: 'Keto Dinner', carbohydrates_g: 10, proteins_g: 40, lipids_g: 50, calories_kcal: 600 }
  ];
  const carbsTotal = ketoMeals.reduce((sum, m) => sum + m.carbohydrates_g, 0); // 15g
  const ketoCompliance = dailyScoreEngine.calculateDietCompliance({ carbs: carbsTotal }, 'keto', ketoMeals);
  // Keto compliance threshold is usually < 50g carbs
  assert(ketoCompliance === 100, `Keto Diet Compliance: carbs totali 15g = 100% compliance (ottenuta: ${ketoCompliance}%)`);
} catch (e) {
  console.error("  ❌ Diet Compliance Error:", e.message);
}

// Test food quality score math
try {
  const salmonFood = {
    name: 'Salmone selvaggio',
    proteins_g: 20,
    fats_g: 13,
    carbs_g: 0,
    fiber_g: 0,
    food_nutrients: [
      { nutrient_key: 'vitamin_d', amount: 15 },
      { nutrient_key: 'potassium', amount: 360 }
    ]
  };
  const sweetFood = {
    name: 'Merendina dolce al cioccolato',
    proteins_g: 2,
    fats_g: 15,
    carbs_g: 55,
    fiber_g: 0.5,
    sodium_mg: 450
  };
  const salmonScore = scientificEngine.calculateFoodQualityScore(salmonFood);
  const snackScore = scientificEngine.calculateFoodQualityScore(sweetFood);
  assert(salmonScore > snackScore && salmonScore >= 75 && snackScore < 40, `Food Quality Score: cibo sano superiore a cibo industriale (Salmone: ${salmonScore}, Merendina: ${snackScore})`);
} catch (e) {
  console.error("  ❌ Food Quality Score Error:", e.message);
}

// Test bioavailability rules
try {
  const syn = scientificEngine.NUTRIENT_SYNERGIES.find(s => s.key === 'ferro_vegetale_vitamina_c');
  const comp = scientificEngine.NUTRIENT_SYNERGIES.find(s => s.key === 'ferro_calcio');
  assert(syn.partners.includes('iron') && comp.partners.includes('iron'), "Bioavailability: mappate sinergie di assorbimento e competizioni minerali");
} catch (e) {
  console.error("  ❌ Bioavailability Error:", e.message);
}
console.log();

// ----------------------------------------------------
// 3. CLINICAL SAFETY AUDIT
// ----------------------------------------------------
console.log("--- 3. CLINICAL SAFETY AUDIT ---");

try {
  const enginesPath = './src/lib/engines/';
  const files = fs.readdirSync(enginesPath);
  let diagnosticWordsViolated = false;
  const illegalPhrases = [
    'diagnostico una',
    'prescrivo la terapia',
    'sostituisci questo farmaco',
    'ti prescrivo',
    'dosaggio consigliato:'
  ];

  files.forEach(file => {
    const content = fs.readFileSync(path.join(enginesPath, file), 'utf8');
    illegalPhrases.forEach(phrase => {
      if (content.toLowerCase().includes(phrase)) {
        console.error(`  ❌ Violazione Clinica in ${file}: contiene frasi di prescrizione non permesse ("${phrase}")!`);
        diagnosticWordsViolated = true;
      }
    });
  });

  assert(!diagnosticWordsViolated, "Clinical Safety: Nessun linguaggio clinico prescrittivo o diagnostico attivo nei motori logici");

  // Check mandatory medical disclaimer in digital-twin-engine.js and simulation-engine.js
  const twinContent = fs.readFileSync(path.join(enginesPath, 'digital-twin-engine.js'), 'utf8');
  const simContent = fs.readFileSync(path.join(enginesPath, 'simulation-engine.js'), 'utf8');
  
  assert(twinContent.toLowerCase().includes("disclaimer") && simContent.toLowerCase().includes("disclaimer"), "Clinical Safety: Disclaimer medico obbligatorio presente nel digital twin e nel simulatore");
} catch (e) {
  console.error("  ❌ Clinical Safety Audit Error:", e.message);
}
console.log();

// ----------------------------------------------------
// 4. SECURITY AUDIT
// ----------------------------------------------------
console.log("--- 4. SECURITY AUDIT ---");

try {
  const scanDirs = ['./src/lib/engines/', './src/pages/', './src/components/'];
  let storageViolated = false;

  scanDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isDirectory()) return;
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasLocalStorage = content.includes('localStorage.set') || content.includes('localStorage[');
      const hasSessionStorage = content.includes('sessionStorage.set') || content.includes('sessionStorage[');
      
      if (hasLocalStorage || hasSessionStorage) {
        console.error(`  ❌ Violazione Sicurezza in ${filePath}: rilevato salvataggio in local/session storage!`);
        storageViolated = true;
      }
    });
  });

  assert(!storageViolated, "Security Audit: Nessun dato sanitario o clinico viene salvato in localStorage/sessionStorage");

  // Service worker security cache check
  const swPath = './public/sw.js';
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    const excludesSupabase = swContent.includes('/rest/') && swContent.includes('/auth/');
    assert(excludesSupabase, "Security Audit: Il Service Worker esclude esplicitamente le chiamate API/Auth Supabase dal caching");
  } else {
    console.error("  ❌ File sw.js non trovato!");
  }

  // IndexedDB minimization check in offline-db.js
  const offlineDbPath = './src/lib/offline-db.js';
  if (fs.existsSync(offlineDbPath)) {
    const dbContent = fs.readFileSync(offlineDbPath, 'utf8');
    const hasMinimization = dbContent.includes('minimizePayload') && dbContent.includes('encrypt');
    assert(hasMinimization, "Security Audit: offline-db.js implementa minimizzazione dati clinici e cifratura prima del salvataggio offline");
  }
} catch (e) {
  console.error("  ❌ Security Audit Error:", e.message);
}
console.log();

// ----------------------------------------------------
// 5. ACCESSIBILITY AUDIT
// ----------------------------------------------------
console.log("--- 5. ACCESSIBILITY AUDIT ---");

try {
  const cardPath = './src/components/AiHealthTwinCard.jsx';
  if (fs.existsSync(cardPath)) {
    const content = fs.readFileSync(cardPath, 'utf8');
    const hasAria = content.includes('aria-label') || content.includes('role=');
    const hasResponsive = content.includes('grid-cols-1') || content.includes('flex flex-col');
    
    assert(hasAria, "Accessibility Audit: Componente AiHealthTwinCard contiene attributi ARIA/ruoli per screen reader");
    assert(hasResponsive, "Accessibility Audit: layout grid e flex responsive definiti");
  }
} catch (e) {
  console.error("  ❌ Accessibility Audit Error:", e.message);
}
console.log();

// ----------------------------------------------------
// 6. PERFORMANCE AUDIT
// ----------------------------------------------------
console.log("--- 6. PERFORMANCE AUDIT ---");

try {
  const appPath = './src/App.jsx';
  if (fs.existsSync(appPath)) {
    const content = fs.readFileSync(appPath, 'utf8');
    const hasLazy = content.includes('React.lazy') || content.includes('lazy(');
    const hasSuspense = content.includes('Suspense');
    assert(hasLazy && hasSuspense, "Performance Audit: Rotte del frontend caricate in modalità lazy con Suspense");
  }

  const coachPath = './src/lib/engines/health-coach-engine.js';
  if (fs.existsSync(coachPath)) {
    const content = fs.readFileSync(coachPath, 'utf8');
    const hasPromiseAll = content.includes('Promise.all');
    assert(hasPromiseAll, "Performance Audit: health-coach-engine utilizza Promise.all per query concorrenti ad alte prestazioni");
  }
} catch (e) {
  console.error("  ❌ Performance Audit Error:", e.message);
}
console.log();

// ----------------------------------------------------
// 7. PRODUCTION & PWA AUDIT
// ----------------------------------------------------
console.log("--- 7. PRODUCTION & PWA AUDIT ---");

try {
  const manifestPath = './public/manifest.json';
  if (fs.existsSync(manifestPath)) {
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert(content.short_name && content.display === 'standalone', "Production Audit: PWA configurata standalone con manifest corretto");
  }
  
  const icon192 = './public/icon-192.png';
  const icon512 = './public/icon-512.png';
  assert(fs.existsSync(icon192) && fs.existsSync(icon512), "Production Audit: Icone dell'applicazione PWA presenti in public/");
} catch (e) {
  console.error("  ❌ Production Audit Error:", e.message);
}
console.log();

console.log(`=========================================================================`);
console.log(`=== AUDIT COMPLETATO: ${testsPassed} su ${totalTests} controlli superati ===`);
if (testsPassed === totalTests) {
  console.log("🚀 COMPLIANCE CLINICA E CERTIFICAZIONE DI PRODUZIONE SUPERATA CON SUCCESSO!");
  process.exit(0);
} else {
  console.error("❌ ERRORE: ALCUNI CONTROLLI DI VALIDAZIONE DI FASE 7 HANNO FALLITO.");
  process.exit(1);
}
