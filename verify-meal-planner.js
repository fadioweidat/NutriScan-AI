import fs from 'fs';
import path from 'path';

// Import our engines
import recipeEngine from './src/lib/engines/recipe-engine.js';
import mealPlannerEngine from './src/lib/engines/meal-planner-engine.js';
import foodSubstitutionEngine from './src/lib/engines/food-substitution-engine.js';
import shoppingListEngine from './src/lib/engines/shopping-list-engine.js';
import weeklyBalanceEngine from './src/lib/engines/weekly-balance-engine.js';

console.log("=== STARTING AI MEAL PLANNER VALIDATION TEST SUITE ===\n");

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
// 1. Security Check: No localStorage/sessionStorage for health data
// ----------------------------------------------------
console.log("\n--- SECURITY & STORAGE CHECKS ---");
try {
  const filesToScan = [
    'src/lib/engines/recipe-engine.js',
    'src/lib/engines/meal-planner-engine.js',
    'src/lib/engines/food-substitution-engine.js',
    'src/lib/engines/shopping-list-engine.js',
    'src/lib/engines/weekly-balance-engine.js',
    'src/pages/MealPlannerPage.jsx',
    'src/components/dashboard/WeeklyMealPlanCard.jsx'
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
// 2. Keto Plan Generation and Allergy Checks
// ----------------------------------------------------
console.log("\n--- KETO PLAN & ALLERGY CHECKS ---");
try {
  const userKetoAllergicToFish = {
    diet: 'keto',
    allergies: ['Pesce'],
    intolerances: [],
    conditions: []
  };

  const plan = mealPlannerEngine.generateWeeklyMealPlan(userKetoAllergicToFish, 2000);
  assert(plan.length === 7, "Generato piano Keto settimanale (7 giorni)");

  // Check carbs target and fish exclusion
  let ketoOk = true;
  let containsFish = false;
  
  plan.forEach(day => {
    if (day.carbs > 50) ketoOk = false;
    
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealKey => {
      const meal = day[mealKey];
      if (meal.name.toLowerCase().includes('salmone') || 
          meal.name.toLowerCase().includes('tonno') || 
          meal.name.toLowerCase().includes('sgombro') || 
          meal.name.toLowerCase().includes('merluzzo')) {
        containsFish = true;
      }
    });
  });

  assert(ketoOk, "Piano Keto rispetta il limite giornaliero di carboidrati (carbs <= 50g)");
  assert(!containsFish, "Piano Keto esclude correttamente gli allergeni (Nessun pesce inserito)");

} catch (e) {
  console.error("Errore nel test del piano Keto:", e);
}

// ----------------------------------------------------
// 3. Carnivore Plan Generation
// ----------------------------------------------------
console.log("\n--- CARNIVORE PLAN CHECKS ---");
try {
  const userCarnivore = {
    diet: 'carnivore',
    allergies: [],
    intolerances: [],
    conditions: []
  };

  const plan = mealPlannerEngine.generateWeeklyMealPlan(userCarnivore, 2200);
  assert(plan.length === 7, "Generato piano Carnivoro settimanale (7 giorni)");

  let carnivoreOk = true;
  plan.forEach(day => {
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealKey => {
      const meal = day[mealKey];
      const name = meal.name.toLowerCase();
      // Check that it only contains meat, fish, eggs or dairy
      const isCarnivoreRecipe = name.includes('manzo') || name.includes('pollo') || 
                               name.includes('sgombro') || name.includes('salmone') || 
                               name.includes('uova') || name.includes('tacchino') || 
                               name.includes('brodo');
      if (!isCarnivoreRecipe) {
        carnivoreOk = false;
        console.log("Ricetta non carnivora trovata nel piano:", name);
      }
    });
  });

  assert(carnivoreOk, "Piano Carnivoro contiene esclusivamente ricette di origine animale");

} catch (e) {
  console.error("Errore nel test del piano Carnivore:", e);
}

// ----------------------------------------------------
// 4. Vegan & Gluten-Free Plan Generation
// ----------------------------------------------------
console.log("\n--- VEGAN & GLUTEN-FREE (CELIACHIA) PLAN CHECKS ---");
try {
  const userVeganCeliac = {
    diet: 'vegana',
    allergies: [],
    intolerances: [],
    conditions: ['Celiachia']
  };

  const plan = mealPlannerEngine.generateWeeklyMealPlan(userVeganCeliac, 1800);
  assert(plan.length === 7, "Generato piano Vegano + Celiaco settimanale (7 giorni)");

  let veganCeliacOk = true;
  plan.forEach(day => {
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealKey => {
      const meal = day[mealKey];
      const name = meal.name.toLowerCase();
      
      // No meat/fish/dairy/eggs (Vegan)
      const hasAnimalProducts = name.includes('manzo') || name.includes('pollo') || 
                                name.includes('pesce') || name.includes('salmone') || 
                                name.includes('tonno') || name.includes('sgombro') || 
                                name.includes('tacchino') || name.includes('uovo') || 
                                name.includes('uova') || name.includes('mozzarella') || 
                                name.includes('frittata') || name.includes('merluzzo');
      
      // No gluten (Celiac)
      const hasGluten = name.includes('pane') || name.includes('pasta') || name.includes('avena');
      
      if (hasAnimalProducts || hasGluten) {
        veganCeliacOk = false;
        console.log(`Violazione vegan/celiac trovata in ricetta: ${name}`);
      }
    });
  });

  assert(veganCeliacOk, "Piano Vegano + Celiaco rispetta i vincoli etici e di intolleranza al glutine");

} catch (e) {
  console.error("Errore nel test del piano Vegano + Celiaco:", e);
}

// ----------------------------------------------------
// 5. Mediterranean & Blood Tests / Medications
// ----------------------------------------------------
console.log("\n--- MEDITERRANEAN PLAN & HEALTH CONSTRAINTS ---");
try {
  const userMed = {
    diet: 'mediterranea',
    allergies: [],
    intolerances: [],
    conditions: ['Ipertensione', 'Anemia']
  };

  const oldRandom = Math.random;
  Math.random = () => 0;
  const plan = mealPlannerEngine.generateWeeklyMealPlan(userMed, 2000);
  Math.random = oldRandom;
  assert(plan.length === 7, "Generato piano Mediterraneo settimanale (7 giorni)");

  // Verify average balance
  const balance = weeklyBalanceEngine.evaluateWeeklyBalance(plan, 2000);
  assert(balance.metrics.avgCalories > 0, `Analisi nutrizionale settimanale completata: calcolate ${balance.metrics.avgCalories} kcal medie`);
  assert(balance.metrics.avgIron >= 8, `L'apporto medio di ferro è sufficiente per l'anemia (Ferro: ${balance.metrics.avgIron}mg/giorno)`);

} catch (e) {
  console.error("Errore nel test del piano Mediterraneo:", e);
}

// ----------------------------------------------------
// 6. Shopping List Consolidator Tests
// ----------------------------------------------------
console.log("\n--- SHOPPING LIST CONSOLIDATION ---");
try {
  const mockPlanDays = [
    {
      breakfast: {
        ingredients: [
          { name: 'Uova', amount: '2 pz', category: 'Uova' },
          { name: 'Olio d\'oliva', amount: '5 ml', category: 'Spezie' }
        ]
      },
      lunch: {
        ingredients: [
          { name: 'Pollo', amount: '150 g', category: 'Carne' },
          { name: 'Olio d\'oliva', amount: '10 ml', category: 'Spezie' }
        ]
      },
      dinner: {
        ingredients: [
          { name: 'Uova', amount: '2 pz', category: 'Uova' }
        ]
      },
      snacks: null
    }
  ];

  const shoppingList = shoppingListEngine.generateShoppingList(mockPlanDays);
  console.log("Lista della spesa consolidata:", shoppingList);

  const eggsItem = shoppingList.find(i => i.alimento === 'Uova');
  const oilItem = shoppingList.find(i => i.alimento === 'Olio d\'oliva');

  assert(eggsItem && eggsItem.quantita === '4 pz', "Unificati correttamente i quantitativi di Uova (2 + 2 = 4 pz)");
  assert(oilItem && oilItem.quantita === '15 ml', "Unificati correttamente i quantitativi di Olio d'oliva (5 + 10 = 15 ml)");
  assert(shoppingList.every(i => i.categoria !== ''), "Ogni alimento nella lista della spesa ha una categoria associata");

} catch (e) {
  console.error("Errore nel test della lista della spesa:", e);
}

// ----------------------------------------------------
// 7. Food Substitutions Tests
// ----------------------------------------------------
console.log("\n--- FOOD SUBSTITUTION ENGINE ---");
try {
  const salmonAlternatives = foodSubstitutionEngine.getSubstitutionsForFood('Salmone', 'standard');
  const chickenAlternatives = foodSubstitutionEngine.getSubstitutionsForFood('Pollo', 'standard');
  
  assert(salmonAlternatives.includes('sgombro') || salmonAlternatives.includes('tonno'), "Sostituto corretto per il Salmone suggerito (sgombro/tonno)");
  assert(chickenAlternatives.includes('tacchino') || chickenAlternatives.includes('coniglio'), "Sostituto corretto per il Pollo suggerito (tacchino/coniglio)");

} catch (e) {
  console.error("Errore nel test delle sostituzioni:", e);
}

// ----------------------------------------------------
// 8. Page & Context integration checks
// ----------------------------------------------------
console.log("\n--- SYSTEM INTEGRATION CHECKS ---");
try {
  const appContent = fs.readFileSync('src/App.jsx', 'utf8');
  assert(appContent.includes('MealPlannerPage'), "App.jsx registra la rotta MealPlannerPage");

  const layoutContent = fs.readFileSync('src/components/Layout.jsx', 'utf8');
  assert(layoutContent.includes('/meal-planner'), "Layout.jsx include il link di navigazione a /meal-planner");

  const chatContent = fs.readFileSync('src/pages/AiChatPage.jsx', 'utf8');
  assert(chatContent.includes('mealPlannerContext'), "AiChatPage.jsx definisce e invia il mealPlannerContext");

  const edgeFnContent = fs.readFileSync('supabase/functions/ai-nutrition-chat/index.ts', 'utf8');
  assert(edgeFnContent.includes('mealPlannerContext'), "L'Edge Function ai-nutrition-chat elabora il mealPlannerContext");

} catch (e) {
  console.error("Errore nel test di integrazione delle pagine:", e);
}

console.log(`\n=== VALIDATION COMPLETE: Passed ${testsPassed}/${totalTests} tests ===`);
if (testsPassed === totalTests) {
  console.log("🚀 ALL TESTS PASSED SUCCESSFULLY! FASE 4 SYSTEM IS VALID.");
  process.exit(0);
} else {
  console.error("❌ SOME TESTS FAILED. PLEASE VERIFY ENGINES.");
  process.exit(1);
}
