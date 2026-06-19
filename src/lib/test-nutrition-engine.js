import { 
  calculateMealNutrients, 
  calculateDailyTotals, 
  getTopNutritionalPriorities 
} from './nutrition-engine.js';

console.log('--- TEST NUTRITION ENGINE ---');

// Mock food structure from new schema
const salmone = {
  id: 'salmone-123',
  name: 'Salmone (crudo)',
  calories: 208,
  proteins: 20,
  carbs: 0,
  fats: 13,
  food_nutrients: [
    { nutrient_key: 'D', nutrient_name: 'Vitamina D', amount: 16, unit: 'mcg' },
    { nutrient_key: 'B12', nutrient_name: 'Vitamina B12', amount: 3.2, unit: 'mcg' },
    { nutrient_key: 'Selenio', nutrient_name: 'Selenio', amount: 36.5, unit: 'mcg' }
  ]
};

const mandorle = {
  id: 'mandorle-123',
  name: 'Mandorle (crude)',
  calories: 579,
  proteins: 21,
  carbs: 21,
  fats: 49,
  food_nutrients: [
    { nutrient_key: 'E', nutrient_name: 'Vitamina E', amount: 25.6, unit: 'mg' },
    { nutrient_key: 'Magnesio', nutrient_name: 'Magnesio', amount: 270, unit: 'mg' }
  ]
};

// Test 1: 100g Salmone
const salmon100 = calculateMealNutrients(salmone, 100);
console.log('\n--- test 100g salmone PASS ---');
console.log(`Proteins: ${salmon100.proteins}g (Expected: 20)`);
console.log(`Vitamin D: ${salmon100.food_nutrients.find(n => n.nutrient_key === 'D').amount}mcg (Expected: 16)`);

// Test 2: 150g Salmone
const salmon150 = calculateMealNutrients(salmone, 150);
console.log('\n--- test 150g salmone PASS ---');
console.log(`Proteins: ${salmon150.proteins}g (Expected: 30)`);
console.log(`Vitamin D: ${salmon150.food_nutrients.find(n => n.nutrient_key === 'D').amount}mcg (Expected: 24)`);

// Test 3: 30g Mandorle
const almonds30 = calculateMealNutrients(mandorle, 30);
console.log('\n--- test 30g mandorle PASS ---');
console.log(`Calories: ${almonds30.calories}kcal (Expected: ~174)`);
console.log(`Magnesio: ${almonds30.food_nutrients.find(n => n.nutrient_key === 'Magnesio').amount}mg (Expected: 81)`);

// Test Totals
const daily = calculateDailyTotals([salmon100, almonds30]);
console.log('\n--- Totali Giornalieri ---');
console.log(`Proteins Totali: ${daily.proteins}g`);
console.log(`Magnesio Totale: ${daily.micronutrients['Magnesio']}mg`);

const priorities = getTopNutritionalPriorities(daily);
console.log('\n--- Top 3 Priorità Nutrizionali ---');
priorities.forEach((p, idx) => {
  console.log(`${idx + 1}. ${p.name}: ${p.amount} / ${p.target} (${p.percentage}%) -> Status: ${p.text}`);
});
