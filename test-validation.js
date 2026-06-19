import { applyConditionAdjustments, getExcludedFoodKeywords, isFoodSafe } from './src/lib/disease-engine.js';
import { generateQuantifiedFixSuggestions, DAILY_TARGETS } from './src/lib/nutrition-engine.js';

console.log("--- TEST FUNZIONALI FASE 1 ---\n");

// Mock foods array mimicking database entries
const mockFoods = [
  { name: 'Latte intero', calories: 60, proteins: 3 },
  { name: 'Yogurt greco', calories: 100, proteins: 10 },
  { name: 'Mozzarella', calories: 280, proteins: 18 },
  { name: 'Parmigiano Reggiano', calories: 400, proteins: 33 },
  { name: 'Pane integrale', calories: 250, carbs: 45 },
  { name: 'Pasta al pomodoro', calories: 350, carbs: 60 },
  { name: 'Pizza Margherita', calories: 800, carbs: 120 },
  { name: 'Spinaci', calories: 23, proteins: 3, food_nutrients: [{ nutrient_key: 'calcium', amount: 100 }] },
  { name: 'Mandorle', calories: 580, proteins: 21, food_nutrients: [{ nutrient_key: 'calcium', amount: 260 }] },
  { name: 'Riso integrale', calories: 110, carbs: 23 }
];

console.log("TEST 1: Inserire Allergia Latte");
const userAllergiesTest1 = [{ allergy_name: 'latte', severity: 'alta' }];
const excludedTest1 = getExcludedFoodKeywords(userAllergiesTest1, []);
console.log("Parole chiave escluse (Latte):", excludedTest1);

const suggestionsTest1 = generateQuantifiedFixSuggestions('calcium', 500, mockFoods, excludedTest1);
console.log("Suggerimenti Calcio (no latte):", suggestionsTest1);
const milkProductsFiltered = mockFoods.filter(f => !isFoodSafe(f.name, excludedTest1)).map(f => f.name);
console.log("Cibi bloccati:", milkProductsFiltered);
console.log(milkProductsFiltered.includes('Latte intero') ? "✅ Latte bloccato" : "❌ Latte permesso");
console.log(milkProductsFiltered.includes('Mozzarella') ? "✅ Mozzarella bloccata" : "❌ Mozzarella permessa");
console.log("\n");

console.log("TEST 2: Inserire Celiachia (Allergia Glutine)");
const userAllergiesTest2 = [{ allergy_name: 'glutine', severity: 'alta' }];
const excludedTest2 = getExcludedFoodKeywords(userAllergiesTest2, []);
console.log("Parole chiave escluse (Glutine):", excludedTest2);

const glutenProductsFiltered = mockFoods.filter(f => !isFoodSafe(f.name, excludedTest2)).map(f => f.name);
console.log("Cibi bloccati:", glutenProductsFiltered);
console.log(glutenProductsFiltered.includes('Pane integrale') ? "✅ Pane bloccato" : "❌ Pane permesso");
console.log(glutenProductsFiltered.includes('Pasta al pomodoro') ? "✅ Pasta bloccata" : "❌ Pasta permessa");
console.log(glutenProductsFiltered.includes('Pizza Margherita') ? "✅ Pizza bloccata" : "❌ Pizza permessa");
console.log("\n");

console.log("TEST 3: Inserire Diabete Tipo 2");
const userConditionsTest3 = [{ condition_name: 'diabete' }];
const adjustedRDA = applyConditionAdjustments(DAILY_TARGETS, userConditionsTest3);
console.log("RDA Standard Carboidrati:", DAILY_TARGETS.carbs, "g");
console.log("RDA Adattato (Diabete) Carboidrati:", adjustedRDA.carbs, "g");
console.log(adjustedRDA.carbs <= 150 ? "✅ Limite carboidrati abbassato per Diabete" : "❌ Limite carboidrati errato");
console.log("RDA Standard Fibre:", DAILY_TARGETS.fiber, "g");
console.log("RDA Adattato (Diabete) Fibre:", adjustedRDA.fiber, "g");
console.log(adjustedRDA.fiber >= 35 ? "✅ Minimo fibre alzato per Diabete" : "❌ Minimo fibre errato");
console.log("\n");

console.log("TUTTI I TEST FUNZIONALI COMPLETATI.");
