/**
 * Disease Engine
 * Maps user conditions and allergies to nutritional rules, restrictions, and priorities.
 */

// Mapping of conditions to nutritional rules
export const CONDITION_RULES = {
  'diabete': {
    targetAdjustments: {
      carbs: (target) => Math.min(target, 150), // Cap carbs for diabetics
      fiber: (target) => Math.max(target, 35),  // Increase fiber
    },
    warnings: [
      { key: 'carbs', max: 150, message: 'Attenzione: i carboidrati totali superano il limite consigliato per il diabete.' }
    ],
    priorityNutrients: ['fiber', 'magnesium', 'omega3']
  },
  'ipertensione': {
    targetAdjustments: {
      sodium: (target) => Math.min(target, 1500), // Max 1500mg sodium
      potassium: (target) => Math.max(target, 4000), // Increase potassium
    },
    warnings: [
      { key: 'sodium', max: 1500, message: 'Attenzione: l\'assunzione di sodio è troppo alta per l\'ipertensione.' }
    ],
    priorityNutrients: ['potassium', 'magnesium', 'calcium']
  },
  'colesterolo alto': {
    targetAdjustments: {
      fats: (target) => target * 0.8, // Reduce total fats
      fiber: (target) => Math.max(target, 35),
    },
    warnings: [],
    priorityNutrients: ['fiber', 'omega3', 'vitamin_b3']
  },
  'anemia': {
    targetAdjustments: {
      iron: (target) => target * 1.5, // 50% more iron
      vitamin_c: (target) => target * 1.2, // Vitamin C helps iron absorption
    },
    warnings: [],
    priorityNutrients: ['iron', 'vitamin_c', 'vitamin_b12', 'vitamin_b9']
  },
  'osteoporosi': {
    targetAdjustments: {
      calcium: (target) => Math.max(target, 1200),
      vitamin_d: (target) => Math.max(target, 20),
    },
    warnings: [],
    priorityNutrients: ['calcium', 'vitamin_d', 'vitamin_k', 'magnesium']
  }
};

// Common allergy triggers mapped to food keywords to filter out
export const ALLERGY_FILTERS = {
  'latte': ['latte', 'yogurt', 'formaggio', 'burro', 'panna', 'mozzarella', 'parmigiano', 'ricotta', 'mascarpone'],
  'glutine': ['pane', 'pasta', 'pizza', 'farina', 'biscotti', 'crackers', 'grano', 'orzo', 'farro', 'avena'],
  'uova': ['uovo', 'uova', 'frittata', 'maionese'],
  'pesce': ['pesce', 'salmone', 'tonno', 'merluzzo', 'sgombro', 'sardine', 'orata', 'branzino'],
  'crostacei': ['gamberi', 'scampi', 'aragosta', 'granchio'],
  'arachidi': ['arachidi', 'burro di arachidi'],
  'frutta a guscio': ['noci', 'mandorle', 'nocciole', 'pistacchi', 'anacardi'],
  'soia': ['soia', 'tofu', 'tempeh', 'salsa di soia']
};

/**
 * Merges target adjustments based on user's conditions.
 */
export function applyConditionAdjustments(baseRDA, conditions) {
  if (!conditions || conditions.length === 0) return baseRDA;

  const adjustedRDA = { ...baseRDA };

  conditions.forEach(cond => {
    const name = cond.condition_name.toLowerCase();
    const rules = CONDITION_RULES[name] || Object.entries(CONDITION_RULES).find(([k]) => name.includes(k))?.[1];
    
    if (rules && rules.targetAdjustments) {
      Object.entries(rules.targetAdjustments).forEach(([nutrient, adjustmentFn]) => {
        if (adjustedRDA[nutrient]) {
          adjustedRDA[nutrient] = adjustmentFn(adjustedRDA[nutrient]);
        }
      });
    }
  });

  return adjustedRDA;
}

/**
 * Returns a list of food keywords that should be excluded based on allergies and intolerances.
 */
export function getExcludedFoodKeywords(allergies, intolerances) {
  const excluded = new Set();
  
  const processList = (list, nameKey) => {
    if (!list) return;
    list.forEach(item => {
      const name = item[nameKey].toLowerCase();
      // Find matching allergy filter
      const filter = ALLERGY_FILTERS[name] || Object.entries(ALLERGY_FILTERS).find(([k]) => name.includes(k))?.[1];
      if (filter) {
        filter.forEach(keyword => excluded.add(keyword));
      } else {
        // If no predefined map, just exclude the exact word
        excluded.add(name);
      }
    });
  };

  processList(allergies, 'allergy_name');
  processList(intolerances, 'intolerance_name');

  return Array.from(excluded);
}

/**
 * Checks if a food item is safe to eat given the excluded keywords.
 */
export function isFoodSafe(foodName, excludedKeywords) {
  const lowerName = foodName.toLowerCase();
  return !excludedKeywords.some(keyword => lowerName.includes(keyword));
}

/**
 * Returns any warnings triggered by the current daily totals and user conditions.
 */
export function getConditionWarnings(dailyTotals, conditions) {
  const warnings = [];
  if (!conditions || conditions.length === 0) return warnings;

  conditions.forEach(cond => {
    const name = cond.condition_name.toLowerCase();
    const rules = CONDITION_RULES[name] || Object.entries(CONDITION_RULES).find(([k]) => name.includes(k))?.[1];
    
    if (rules && rules.warnings) {
      rules.warnings.forEach(warning => {
        const amount = dailyTotals[warning.key] || (dailyTotals.micronutrients && dailyTotals.micronutrients[warning.key]) || 0;
        if (amount > warning.max) {
          warnings.push(warning.message);
        }
      });
    }
  });

  return warnings;
}

export default {
  CONDITION_RULES,
  ALLERGY_FILTERS,
  applyConditionAdjustments,
  getExcludedFoodKeywords,
  isFoodSafe,
  getConditionWarnings
};
