import fs from 'fs';
import path from 'path';

// Import local engines
import dailyScoreEngine from './src/lib/engines/daily-score-engine.js';
import trendEngine from './src/lib/engines/trend-engine.js';
import goalEngine from './src/lib/engines/goal-engine.js';
import healthCoachEngine from './src/lib/engines/health-coach-engine.js';

console.log("=== STARTING AI HEALTH COACH 2.0 VALIDATION TEST SUITE ===\n");

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

// ----------------------------------------------------
// 1. Security check: No localStorage / sessionStorage for health data
// ----------------------------------------------------
console.log("\n--- SECURITY & COMPLIANCE CHECKS ---");
try {
  const filesToScan = [
    'src/lib/engines/health-coach-engine.js',
    'src/lib/engines/daily-score-engine.js',
    'src/lib/engines/trend-engine.js',
    'src/lib/engines/goal-engine.js',
    'src/components/dashboard/AiHealthSummary.jsx',
    'src/pages/DashboardPage.jsx',
    'src/pages/AiChatPage.jsx'
  ];

  let storageViolated = false;
  filesToScan.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const hasLocalStorage = content.includes('localStorage.') || content.includes('localStorage[');
      const hasSessionStorage = content.includes('sessionStorage.') || content.includes('sessionStorage[');
      if (hasLocalStorage || hasSessionStorage) {
        console.error(`❌ File ${file} uses localStorage or sessionStorage!`);
        storageViolated = true;
      }
    }
  });

  assert(!storageViolated, "Nessun dato sanitario salvato in localStorage o sessionStorage");
} catch (e) {
  console.error("Errore durante la scansione dei file di storage:", e);
}

// ----------------------------------------------------
// 2. Diet Compliance Engine Tests
// ----------------------------------------------------
console.log("\n--- DIET COMPLIANCE ENGINE ---");

// Test Keto
const ketoTotals = { carbs: 20, proteins: 90, fats: 80, calories: 1200 };
const ketoCompliance = dailyScoreEngine.calculateDietCompliance(ketoTotals, 'keto', []);
assert(ketoCompliance === 100, `Compliance Keto ottimale (carbs 20g) = 100% (risultato: ${ketoCompliance}%)`);

const ketoTotalsBad = { carbs: 50, proteins: 90, fats: 80, calories: 1300 };
const ketoComplianceBad = dailyScoreEngine.calculateDietCompliance(ketoTotalsBad, 'keto', []);
assert(ketoComplianceBad < 100, `Compliance Keto sbilanciato (carbs 50g) < 100% (risultato: ${ketoComplianceBad}%)`);

// Test Carnivore
const carnivoreMeals = [{ name: 'manzo' }, { name: 'pollo' }];
const carnivoreCompliance = dailyScoreEngine.calculateDietCompliance({ carbs: 5 }, 'carnivore', carnivoreMeals);
assert(carnivoreCompliance === 100, `Compliance Carnivore ottimale = 100% (risultato: ${carnivoreCompliance}%)`);

const carnivoreMealsBad = [{ name: 'manzo' }, { name: 'insalata' }];
const carnivoreComplianceBad = dailyScoreEngine.calculateDietCompliance({ carbs: 25 }, 'carnivore', carnivoreMealsBad);
assert(carnivoreComplianceBad < 100, `Compliance Carnivore non ottimale (verdure/carbs) < 100% (risultato: ${carnivoreComplianceBad}%)`);

// Test Vegan
const veganMeals = [{ name: 'lenticchie' }, { name: 'riso' }];
const veganCompliance = dailyScoreEngine.calculateDietCompliance({ carbs: 120 }, 'vegan', veganMeals);
assert(veganCompliance === 100, `Compliance Vegano ottimale = 100% (risultato: ${veganCompliance}%)`);

const veganMealsBad = [{ name: 'lenticchie' }, { name: 'pollo' }];
const veganComplianceBad = dailyScoreEngine.calculateDietCompliance({ carbs: 80 }, 'vegan', veganMealsBad);
assert(veganComplianceBad < 100, `Compliance Vegano sbilanciato (pollo inserito) < 100% (risultato: ${veganComplianceBad}%)`);

// Test Condition modifications on Diet Compliance (Celiachia)
const glutenMeals = [{ name: 'pane' }];
const glutenCompliance = dailyScoreEngine.calculateDietCompliance({ carbs: 50 }, 'standard', glutenMeals, [{ condition_name: 'Celiachia' }]);
assert(glutenCompliance <= 50, `Compliance Celiachia penalizzato se consuma glutine (risultato: ${glutenCompliance}%)`);

// ----------------------------------------------------
// 3. Daily Health Score & Risk Level Engine Tests
// ----------------------------------------------------
console.log("\n--- HEALTH SCORE & RISK LEVEL ENGINE ---");

// Test Daily Health Score
const goodDay = {
  totals: { score: 90, carbs: 120, proteins: 80, fats: 50 },
  dietType: 'standard',
  meals: [],
  sleepLog: { duration_hours: 8, quality_score: 4 },
  stressLog: { stress_level: 2 },
  hydrationLog: { water_ml: 2200 },
  activityLogs: [{ duration_minutes: 45 }],
  conditions: []
};
const goodScore = dailyScoreEngine.calculateDailyHealthScore(goodDay);
assert(goodScore >= 80, `Punteggio salute ottimo per giornata sana = ${goodScore}/100`);

const badDay = {
  totals: { score: 40, carbs: 120, proteins: 80, fats: 50 },
  dietType: 'standard',
  meals: [],
  sleepLog: { duration_hours: 5, quality_score: 2 },
  stressLog: { stress_level: 8 },
  hydrationLog: { water_ml: 800 },
  activityLogs: [],
  conditions: []
};
const badScore = dailyScoreEngine.calculateDailyHealthScore(badDay);
assert(badScore < goodScore, `Punteggio salute sbilanciato inferiore (bad: ${badScore} vs good: ${goodScore})`);

// Test condition score penalty for Diabetic high sugar
const diabeticBadDay = {
  totals: { score: 80, sugar: 45, carbs: 150, proteins: 80, fats: 50 },
  dietType: 'standard',
  meals: [],
  sleepLog: { duration_hours: 8, quality_score: 4 },
  stressLog: { stress_level: 2 },
  hydrationLog: { water_ml: 2000 },
  activityLogs: [{ duration_minutes: 30 }],
  conditions: [{ condition_name: 'Diabete' }]
};
const diabeticScore = dailyScoreEngine.calculateDailyHealthScore(diabeticBadDay);
const diabeticNoCondScore = dailyScoreEngine.calculateDailyHealthScore({ ...diabeticBadDay, conditions: [] });
assert(diabeticScore < diabeticNoCondScore, `Punteggio Diabete ridotto per eccesso zuccheri (diabetic: ${diabeticScore} vs standard: ${diabeticNoCondScore})`);

// Test Risk Level
const lowRisk = dailyScoreEngine.calculateRiskLevel(85, [], [], []);
assert(lowRisk === 'LOW', `Risk Level per soggetto sano (Health Score 85) = LOW (risultato: ${lowRisk})`);

const highRisk = dailyScoreEngine.calculateRiskLevel(40, [{ condition_name: 'Diabete' }, { condition_name: 'Ipertensione' }], [{ medication_name: 'Warfarin' }], [{ biomarker_name: 'Vitamina D', status: 'low' }]);
assert(highRisk === 'HIGH', `Risk Level per condizioni compromesse = HIGH (risultato: ${highRisk})`);


// ----------------------------------------------------
// 4. Trend & Goal Engines Tests
// ----------------------------------------------------
console.log("\n--- TREND & GOAL ENGINES ---");

// Test Goals checking
const goals = goalEngine.checkDailyGoals(goodDay);
assert(goals.percent === 100 && goals.completedCount === 5, `Obiettivi giornalieri completati 5/5 (100%) per giornata sana`);

const badGoals = goalEngine.checkDailyGoals(badDay);
assert(badGoals.percent < 100, `Obiettivi giornalieri parziali per giornata non sana (percent: ${badGoals.percent}%)`);

// Test Trend compilations
const historyMock = [
  { healthScore: 80, sleepHours: 8, sleepQuality: 4, stressLevel: 2, waterMl: 2000, activeMinutes: 30 },
  { healthScore: 82, sleepHours: 8.5, sleepQuality: 5, stressLevel: 1, waterMl: 2100, activeMinutes: 40 },
  { healthScore: 78, sleepHours: 7, sleepQuality: 3, stressLevel: 3, waterMl: 1900, activeMinutes: 30 }
];
const trends = trendEngine.compileAllTrends(historyMock, 3);
assert(trends.healthScore && trends.sleep && trends.stress && trends.hydration, "Trend storici compilati correttamente per tutti i pilastri");


// ----------------------------------------------------
// 5. Health Coach Engine (Orchestrator) & Priority Weights Tests
// ----------------------------------------------------
console.log("\n--- HEALTH COACH ORCHESTRATOR & PRIORITIES ---");

const mockSupabase = {
  from: (table) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      gte: () => chain,
      order: () => chain,
      maybeSingle: async () => {
        if (table === 'health_profiles') {
          return { data: { user_id: 'test-user', diet_type: 'vegan' } };
        }
        return { data: null };
      },
      then: (resolveFn) => {
        let data = [];
        if (table === 'blood_test_reports') {
          data = [{ id: 'report-1', test_date: '2026-06-01' }];
        } else if (table === 'blood_test_biomarkers') {
          data = [
            { biomarker_name: 'Ferro', value: '45', unit: 'ug/dL', status: 'low' },
            { biomarker_name: 'Vitamina D', value: '12', unit: 'ng/mL', status: 'low' }
          ];
        } else if (table === 'user_conditions') {
          data = [{ condition_name: 'Anemia' }];
        } else if (table === 'user_medications') {
          data = [{ medication_name: 'Levotiroxina', is_active: true }];
        } else if (table === 'user_supplements') {
          data = [{ supplement_name: 'Vitamina D3', is_active: true }];
        } else if (table === 'sleep_logs') {
          data = [{ entry_date: new Date().toISOString().split('T')[0], duration_hours: 8, quality_score: 4 }];
        } else if (table === 'stress_logs') {
          data = [{ entry_date: new Date().toISOString().split('T')[0], stress_level: 2 }];
        } else if (table === 'hydration_logs') {
          data = [{ entry_date: new Date().toISOString().split('T')[0], water_ml: 1500 }];
        } else if (table === 'activity_logs') {
          data = [];
        } else if (table === 'meal_entries') {
          data = [];
        }
        return Promise.resolve(resolveFn({ data, error: null }));
      }
    };
    return chain;
  }
};

(async () => {
  try {
    const coachContext = await healthCoachEngine.getHealthCoachContext(mockSupabase, 'test-user');
    
    // Test context completeness
    assert(
      coachContext.healthScore !== undefined &&
      coachContext.riskLevel !== undefined &&
      coachContext.dietCompliance !== undefined &&
      coachContext.priorities !== undefined &&
      coachContext.trends !== undefined &&
      coachContext.goals !== undefined &&
      coachContext.supplementIntelligence !== undefined &&
      coachContext.alerts !== undefined &&
      coachContext.educationalSuggestions !== undefined,
      "healthCoachContext contiene tutti i campi richiesti"
    );

    // Test Priorities ordering: Blood Tests must be first
    const prioritiesList = coachContext.priorities;
    console.log("Priorità generate ordinatamente:", prioritiesList);
    
    const firstPriorityIsBloodTest = prioritiesList[0].includes("Vitamina D insufficiente") || prioritiesList[0].includes("Ferro basso");
    assert(firstPriorityIsBloodTest, "La priorità principale del coach deriva dagli esami del sangue insufficienti");

    // Test drug alerts
    const levothyroxineAlert = coachContext.alerts.find(a => a.includes("Levotiroxina") || a.includes("levotiroxina"));
    assert(
      levothyroxineAlert !== undefined && levothyroxineAlert.includes("Non modificare la terapia senza consultare il medico."),
      "Alert di interazione farmacologica per Levotiroxina presente e con dicitura di sicurezza obbligatoria"
    );

    // Test Supplement Intelligence
    const vitDSupplement = coachContext.supplementIntelligence['vitamin_d'];
    assert(
      vitDSupplement.supplementActive === true,
      `Supplement Intelligence distingue presenza integratori (Vitamina D integrata: ${vitDSupplement.supplementActive})`
    );

    // ----------------------------------------------------
    // 6. Check Dashboard & AI Chat Pages integration
    // ----------------------------------------------------
    console.log("\n--- PAGE INTEGRATION CHECKS ---");
    
    const dashboardContent = fs.readFileSync('src/pages/DashboardPage.jsx', 'utf8');
    const importsAiHealthSummary = dashboardContent.includes('AiHealthSummary') && dashboardContent.includes('getHealthCoachContext');
    assert(importsAiHealthSummary, "DashboardPage.jsx importa correttamente il componente e l'orchestratore del coach");

    const chatContent = fs.readFileSync('src/pages/AiChatPage.jsx', 'utf8');
    const chatPassesCoachContext = chatContent.includes('healthCoachContext');
    assert(chatPassesCoachContext, "AiChatPage.jsx invia il healthCoachContext nel payload dell'Edge Function");

    const edgeFunctionContent = fs.readFileSync('supabase/functions/ai-nutrition-chat/index.ts', 'utf8');
    const edgeFunctionUsesCoachContext = edgeFunctionContent.includes('healthCoachContext');
    assert(edgeFunctionUsesCoachContext, "L'Edge Function ai-nutrition-chat integra e analizza il healthCoachContext");

    // ----------------------------------------------------
    // Final report
    // ----------------------------------------------------
    console.log(`\n=== VALIDATION COMPLETE: Passed ${testsPassed}/${totalTests} tests ===`);
    if (testsPassed === totalTests) {
      console.log("🚀 ALL TESTS PASSED SUCCESSFULLY! FASE 3 READY FOR DEPLOYMENT.");
      process.exit(0);
    } else {
      console.error("❌ SOME TESTS FAILED. PLEASE CORRECT IMPLEMENTATION.");
      process.exit(1);
    }

  } catch (error) {
    console.error("Errore durante l'esecuzione dei test dell'orchestratore:", error);
    process.exit(1);
  }
})();
