import engine from './src/lib/nutrition-engine.js';

// Mock del DB foods
const salmon = {
  id: '2',
  name: 'Salmone (Atlantico, crudo)',
  calories: 208,
  proteins: 20.42,
  carbs: 0,
  fats: 13.42,
  fiber: 0,
  water: 64.89,
  omega3: 2.1,
  omega6: 0.9,
  food_nutrients: [
    { nutrient_key: 'vitamin_d', nutrient_name: 'Vitamina D', amount: 10.9, unit: 'mcg' },
    { nutrient_key: 'vitamin_b12', nutrient_name: 'Vitamina B12', amount: 3.18, unit: 'mcg' }
  ]
};

const almonds = {
  id: '3',
  name: 'Mandorle',
  calories: 579,
  proteins: 21.15,
  carbs: 21.55,
  fats: 49.93,
  fiber: 12.5,
  water: 4.41,
  omega3: 0.006,
  omega6: 12.1,
  food_nutrients: [
    { nutrient_key: 'vitamin_e', nutrient_name: 'Vitamina E', amount: 25.6, unit: 'mg' },
    { nutrient_key: 'magnesium', nutrient_name: 'Magnesio', amount: 270, unit: 'mg' }
  ]
};

console.log("=== TEST NUTRITION ENGINE STEP 1 ===");

const meal1 = engine.calculateMealNutrients(salmon, 100);
console.log("\n[100g Salmone]:", {
  calories: meal1.calories,
  proteins: meal1.proteins,
  vitamin_d: meal1.food_nutrients.find(n => n.nutrient_key === 'vitamin_d').amount
});

const meal2 = engine.calculateMealNutrients(salmon, 150);
console.log("\n[150g Salmone]:", {
  calories: meal2.calories,
  proteins: meal2.proteins,
  vitamin_d: meal2.food_nutrients.find(n => n.nutrient_key === 'vitamin_d').amount
});

const meal3 = engine.calculateMealNutrients(almonds, 30);
console.log("\n[30g Mandorle]:", {
  calories: meal3.calories,
  proteins: meal3.proteins,
  vitamin_e: meal3.food_nutrients.find(n => n.nutrient_key === 'vitamin_e').amount
});

const dailyTotals = engine.calculateDailyTotals([meal1, meal2, meal3]);
console.log("\n[Daily Totals]:", dailyTotals);

const pctVitD = engine.calculateNutrientPercentage(dailyTotals.micronutrients.vitamin_d, engine.DAILY_TARGETS.vitamin_d);
console.log("\n[% Vitamina D]:", pctVitD, "% (Target:", engine.DAILY_TARGETS.vitamin_d, ") -> Status:", engine.getNutrientStatus(pctVitD));

const suggestions = engine.generateFixTodaySuggestions([{ key: 'iron' }, { key: 'calcium' }]);
console.log("\n[Suggestions]:", suggestions);
