/**
 * Weekly Balance Engine (Phase 4)
 * Evaluates weekly nutritional plans for variety, repeating items, macro/micro balances.
 */

/**
 * Validates a weekly plan's variety and nutritional coverage.
 */
export function evaluateWeeklyBalance(mealPlanDays = [], caloriesTarget = 2000) {
  if (!mealPlanDays || mealPlanDays.length === 0) {
    return {
      isValid: false,
      score: 0,
      warnings: ['Nessun giorno inserito nel piano alimentare.'],
      metrics: {}
    };
  }

  let totalCalories = 0;
  let totalProteins = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  // Track recipe repetitions
  const recipeCounts = {};

  // Track micro sums
  let totalFiber = 0;
  let totalOmega3 = 0;
  let totalCalcium = 0;
  let totalIron = 0;
  let totalVitD = 0;
  let totalVitB12 = 0;

  mealPlanDays.forEach(day => {
    totalCalories += Number(day.calories || 0);
    totalProteins += Number(day.proteins || 0);
    totalCarbs += Number(day.carbs || 0);
    totalFats += Number(day.fats || 0);

    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealKey => {
      const meal = day[mealKey];
      if (meal && meal.id) {
        recipeCounts[meal.id] = (recipeCounts[meal.id] || 0) + 1;

        // Add micro contents if present
        totalFiber += Number(meal.fiber || 0);
        
        const minerals = meal.minerals || {};
        const vitamins = meal.vitamins || {};
        totalIron += Number(minerals.iron || 0);
        totalCalcium += Number(minerals.calcium || 0);
        totalVitD += Number(vitamins.d || 0);
        totalVitB12 += Number(vitamins.b12 || 0);
        
        // Add omega3
        if (meal.ingredients) {
          meal.ingredients.forEach(ing => {
            if (ing.name.toLowerCase().includes('salmone') || ing.name.toLowerCase().includes('sgombro') || ing.name.toLowerCase().includes('tonno')) {
              totalOmega3 += 1.5; // estimated 1.5g per serving
            }
          });
        }
      }
    });
  });

  const daysCount = mealPlanDays.length;
  const avgCalories = Math.round(totalCalories / daysCount);
  const avgProteins = Math.round(totalProteins / daysCount);
  const avgCarbs = Math.round(totalCarbs / daysCount);
  const avgFats = Math.round(totalFats / daysCount);

  const avgFiber = Number((totalFiber / daysCount).toFixed(1));
  const avgOmega3 = Number((totalOmega3 / daysCount).toFixed(1));
  const avgCalcium = Math.round(totalCalcium / daysCount);
  const avgIron = Number((totalIron / daysCount).toFixed(1));
  const avgVitD = Number((totalVitD / daysCount).toFixed(1));
  const avgVitB12 = Number((totalVitB12 / daysCount).toFixed(1));

  const warnings = [];

  // 1. Variety check: check if any recipe repeats too many times
  let repetitionWarning = false;
  Object.values(recipeCounts).forEach(count => {
    if (count > 3) {
      repetitionWarning = true;
    }
  });
  if (repetitionWarning) {
    warnings.push("La rotazione dei piatti è limitata. Considera di inserire ricette alternative per garantire la varietà.");
  }

  // 2. Calorie check
  const calDiff = Math.abs(avgCalories - caloriesTarget);
  if (calDiff > 200) {
    warnings.push(`Le calorie medie settimanali (${avgCalories} kcal) deviano dal target (${caloriesTarget} kcal).`);
  }

  // 3. Essential micronutrient checks (educational targets)
  if (avgFiber < 25) {
    warnings.push(`L'apporto medio di fibre è sotto il target di 25g al giorno (registrati ${avgFiber}g).`);
  }
  if (avgIron < 10) {
    warnings.push(`L'apporto medio di ferro è basso (registrati ${avgIron}mg).`);
  }
  if (avgCalcium < 800) {
    warnings.push(`L'apporto medio di calcio è sotto il target di 800mg (registrati ${avgCalcium}mg).`);
  }
  if (avgVitD < 10) {
    warnings.push(`L'apporto medio di Vitamina D è basso (registrati ${avgVitD} mcg).`);
  }

  const score = Math.max(0, Math.min(100, 100 - (warnings.length * 15)));

  return {
    isValid: warnings.length === 0,
    score,
    warnings,
    metrics: {
      avgCalories,
      avgProteins,
      avgCarbs,
      avgFats,
      avgFiber,
      avgOmega3,
      avgCalcium,
      avgIron,
      avgVitD,
      avgVitB12
    }
  };
}

export default {
  evaluateWeeklyBalance
};
