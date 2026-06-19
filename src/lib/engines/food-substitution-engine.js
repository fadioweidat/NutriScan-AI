/**
 * Food Substitution Engine (Phase 4)
 * Provides replacements for ingredients and full meals.
 */

// Static mapping of raw ingredient substitutions
export const INGREDIENT_SUBSTITUTIONS = {
  'salmone': ['sgombro', 'sardine', 'tonno', 'merluzzo'],
  'pollo': ['tacchino', 'coniglio', 'toro', 'manzo'],
  'latte': ['bevanda di mandorla', 'bevanda di cocco', 'bevanda di soia'],
  'pane': ['cracker keto', 'galletta di riso', 'pane senza glutine'],
  'pasta': ['shirataki di konjac', 'zucchine a spirale', 'pasta di ceci'],
  'burro': ['olio d\'oliva extravergine', 'ghee', 'olio di cocco'],
  'mozzarella': ['tofu', 'formaggio di capra', 'mozzarella senza lattosio'],
  'manzo': ['pollo', 'tacchino', 'maiale magro'],
  'uova': ['tofu strapazzato', 'semi di lino macinati (uovo di lino)'],
  'ceci': ['fagioli cannellini', 'lenticchie', 'piselli']
};

/**
 * Returns alternative ingredients for a given food item based on user diet and conditions.
 */
export function getSubstitutionsForFood(foodName, dietType = 'standard', conditions = []) {
  const lowerFood = foodName.toLowerCase();
  const diet = dietType.toLowerCase();
  
  // Find key that matches foodName
  const matchKey = Object.keys(INGREDIENT_SUBSTITUTIONS).find(key => lowerFood.includes(key));
  if (!matchKey) return [];

  let alternatives = INGREDIENT_SUBSTITUTIONS[matchKey];

  // Apply filters based on conditions and diet types
  const isKeto = diet === 'keto' || diet === 'cheto' || diet === 'chetogenica';
  const isCeliac = conditions.some(c => c.toLowerCase().includes('celia'));

  return alternatives.filter(alt => {
    // 1. Keto filters out high carb alternatives
    if (isKeto) {
      if (alt.includes('riso') || alt.includes('ceci') || alt.includes('fagioli') || alt.includes('lenticchie')) {
        return false;
      }
    }
    // 2. Celiac filters out gluten alternatives
    if (isCeliac) {
      if (alt.includes('glutine') && !alt.includes('senza glutine')) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Suggests an alternative recipe from a list of recipes that matches the category and calorie range.
 */
export function getRecipeAlternatives(recipe, allRecipes, targetCal = recipe.calories) {
  return allRecipes
    .filter(r => r.id !== recipe.id)
    .map(r => {
      // Calculate calorie distance
      const calDiff = Math.abs(r.calories - targetCal);
      
      // Calculate macro distance
      const pDiff = Math.abs(r.proteins - recipe.proteins);
      const cDiff = Math.abs(r.carbs - recipe.carbs);
      const fDiff = Math.abs(r.fats - recipe.fats);
      const score = calDiff + (pDiff + cDiff + fDiff) * 4;

      return { recipe: r, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(x => x.recipe);
}

export default {
  INGREDIENT_SUBSTITUTIONS,
  getSubstitutionsForFood,
  getRecipeAlternatives
};
