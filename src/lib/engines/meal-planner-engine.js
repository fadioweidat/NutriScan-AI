import recipeEngine from './recipe-engine.js';

/**
 * Meal Planner Engine (Phase 4)
 * Generates daily and weekly personalized meal plans based on health context, diet, and conditions.
 */

const DAYS_OF_WEEK = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica'
];

/**
 * Generates a full 7-day personalized meal plan.
 */
export function generateWeeklyMealPlan(userContext = {}) {
  const diet = userContext.diet || 'standard';
  const allergies = userContext.allergies || [];
  const intolerances = userContext.intolerances || [];
  const conditions = userContext.conditions || [];

  // 1. Get filtered safe recipes
  const allRecipes = recipeEngine.RECIPES;
  const dietRecipes = recipeEngine.getRecipesByDiet(diet);
  
  const baseSelection = dietRecipes.length > 0 ? dietRecipes : allRecipes;
  
  const safeRecipes = recipeEngine.filterRecipes(baseSelection, {
    allergies,
    intolerances,
    conditions
  });

  if (safeRecipes.length === 0) {
    throw new Error("Impossibile generare il piano: nessuna ricetta compatibile con le tue allergie o condizioni.");
  }

  // Prioritize recipes based on health conditions
  const prioritizeRecipes = (recipes) => {
    return recipes.map(r => {
      let priorityScore = 0;
      
      conditions.forEach(cond => {
        const name = cond.toLowerCase();
        if (name.includes('anemia')) {
          priorityScore += (r.minerals?.iron || 0) * 15; // heavily prioritize iron
        }
        if (name.includes('ipertensione')) {
          priorityScore += (r.minerals?.potassium || 0) * 0.1;
          priorityScore -= (r.minerals?.sodium || 0) * 0.1;
        }
        if (name.includes('diabete')) {
          priorityScore -= (r.carbs || 0) * 2;
        }
        if (name.includes('osteoporosi')) {
          priorityScore += (r.minerals?.calcium || 0) * 0.1;
        }
        if (name.includes('colesterolo') || name.includes('ipercolesterolemia')) {
          priorityScore -= (r.fats || 0) * 0.5;
        }
      });

      return { recipe: r, score: priorityScore };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.recipe);
  };

  const prioritizedRecipes = prioritizeRecipes(safeRecipes);

  // 2. Classify recipes by type to distribute properly
  const breakfasts = prioritizedRecipes.filter(r => 
    r.id.includes('frittata') || r.id.includes('pancake') || r.id.includes('smoothie') || r.id.includes('uova')
  );
  
  const mainMeals = prioritizedRecipes.filter(r => 
    r.id.includes('salmone') || r.id.includes('bistecca') || r.id.includes('zuppa') || 
    r.id.includes('pollo') || r.id.includes('tonno') || r.id.includes('tofu') || 
    r.id.includes('merluzzo') || r.id.includes('tacchino') || r.id.includes('risotto')
  );

  const snacks = prioritizedRecipes.filter(r => 
    r.id.includes('caprese') || r.id.includes('hummus') || r.id.includes('smoothie') || r.id.includes('brodo') || r.id.includes('crema') || r.id.includes('pancake')
  );

  // Fallbacks if groups are empty after strict filtering
  const finalBreakfasts = breakfasts.length > 0 ? breakfasts : prioritizedRecipes;
  const finalMains = mainMeals.length > 0 ? mainMeals : prioritizedRecipes;
  const finalSnacks = snacks.length > 0 ? snacks : prioritizedRecipes;

  const mealPlanDays = [];
  const recentUsedIds = [];

  // Helper to pick recipe with rotation
  const pickRecipeWithRotation = (recipesList) => {
    // Pick from the top 3 items to preserve priority while allowing variety
    const subset = recipesList.slice(0, 3);
    const available = subset.filter(r => !recentUsedIds.includes(r.id));
    const targetList = available.length > 0 ? available : subset;
    
    const idx = Math.floor(Math.random() * targetList.length);
    const chosen = targetList[idx];
    
    recentUsedIds.push(chosen.id);
    if (recentUsedIds.length > 4) {
      recentUsedIds.shift();
    }
    
    return chosen;
  };

  // 3. Generate each day
  DAYS_OF_WEEK.forEach(day => {
    const breakfast = pickRecipeWithRotation(finalBreakfasts);
    const lunch = pickRecipeWithRotation(finalMains);
    const dinner = pickRecipeWithRotation(finalMains.filter(r => r.id !== lunch.id).length > 0 ? finalMains.filter(r => r.id !== lunch.id) : finalMains);
    const snack = pickRecipeWithRotation(finalSnacks);

    const dayCal = breakfast.calories + lunch.calories + dinner.calories + snack.calories;
    const dayProt = breakfast.proteins + lunch.proteins + dinner.proteins + snack.proteins;
    const dayCarb = breakfast.carbs + lunch.carbs + dinner.carbs + snack.carbs;
    const dayFat = breakfast.fats + lunch.fats + dinner.fats + snack.fats;
    
    mealPlanDays.push({
      day_of_week: day,
      breakfast,
      lunch,
      dinner,
      snacks: snack,
      calories: dayCal,
      proteins: dayProt,
      carbs: dayCarb,
      fats: dayFat
    });
  });

  return mealPlanDays;
}

export default {
  generateWeeklyMealPlan
};
