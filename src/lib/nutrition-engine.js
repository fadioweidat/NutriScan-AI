/**
 * NutriScan AI - Nutrition Engine
 * Core engine for calculating meal nutrients, daily totals, and statuses.
 */
import diseaseEngine from './disease-engine.js';

// Daily Targets (RDA/AI approximations for standard adult)
export const DAILY_TARGETS = {
  calories: 2000,
  proteins: 50,
  carbs: 260,
  fats: 70,
  fiber: 30,
  water: 2000,
  omega3: 1.6,
  omega6: 14,
  vitamin_a: 900,
  vitamin_b1: 1.2,
  vitamin_b2: 1.3,
  vitamin_b3: 16,
  vitamin_b5: 5,
  vitamin_b6: 1.3,
  vitamin_b7: 30,
  vitamin_b9: 400,
  vitamin_b12: 2.4,
  vitamin_c: 90,
  vitamin_d: 15,
  vitamin_e: 15,
  vitamin_k: 120,
  calcium: 1000,
  iron: 8,
  magnesium: 400,
  potassium: 3400,
  phosphorus: 700,
  zinc: 11,
  copper: 0.9,
  manganese: 2.3,
  selenium: 55,
  iodine: 150,
  sodium: 2300
};

export const NUTRIENT_LABELS = {
  calories: 'Calorie', proteins: 'Proteine', carbs: 'Carboidrati',
  fats: 'Grassi', fiber: 'Fibre', water: 'Acqua',
  omega3: 'Omega 3', omega6: 'Omega 6',
  vitamin_a: 'Vitamina A', vitamin_b1: 'Vitamina B1',
  vitamin_b2: 'Vitamina B2', vitamin_b3: 'Vitamina B3',
  vitamin_b5: 'Vitamina B5', vitamin_b6: 'Vitamina B6',
  vitamin_b7: 'Biotina (Vitamina B7)',
  vitamin_b9: 'Acido Folico (Vitamina B9)',
  vitamin_b12: 'Vitamina B12', vitamin_c: 'Vitamina C',
  vitamin_d: 'Vitamina D', vitamin_e: 'Vitamina E',
  vitamin_k: 'Vitamina K', calcium: 'Calcio', iron: 'Ferro',
  magnesium: 'Magnesio', potassium: 'Potassio',
  phosphorus: 'Fosforo', zinc: 'Zinco', copper: 'Rame',
  manganese: 'Manganese', selenium: 'Selenio', iodine: 'Iodio',
  sodium: 'Sodio',
};

export const NUTRIENT_UNITS = {
  calories: 'kcal', proteins: 'g', carbs: 'g', fats: 'g',
  fiber: 'g', water: 'ml', omega3: 'g', omega6: 'g',
  vitamin_a: 'mcg', vitamin_b1: 'mg', vitamin_b2: 'mg',
  vitamin_b3: 'mg', vitamin_b5: 'mg', vitamin_b6: 'mg',
  vitamin_b7: 'mcg', vitamin_b9: 'mcg', vitamin_b12: 'mcg',
  vitamin_c: 'mg', vitamin_d: 'mcg', vitamin_e: 'mg',
  vitamin_k: 'mcg', calcium: 'mg', iron: 'mg',
  magnesium: 'mg', potassium: 'mg', phosphorus: 'mg',
  zinc: 'mg', copper: 'mg', manganese: 'mg',
  selenium: 'mcg', iodine: 'mcg', sodium: 'mg',
};

export const ITALIAN_FOOD_SOURCES = {
  vitamin_a: ['Carote', 'Patate dolci', 'Spinaci', 'Zucca'],
  vitamin_b1: ['Maiale', 'Legumi', 'Semi di girasole', 'Avena'],
  vitamin_b2: ['Latte', 'Yogurt', 'Mandorle', 'Uova'],
  vitamin_b3: ['Pollo', 'Tonno', 'Arachidi', 'Tacchino'],
  vitamin_b5: ['Avocado', 'Uova', 'Broccoli', 'Funghi'],
  vitamin_b6: ['Pollo', 'Banana', 'Patate', 'Ceci'],
  vitamin_b7: ['Uova', 'Mandorle', 'Patate dolci', 'Noci'],
  vitamin_b9: ['Spinaci', 'Lenticchie', 'Asparagi', 'Ceci'],
  vitamin_b12: ['Salmone', 'Manzo', 'Uova', 'Tonno'],
  vitamin_c: ['Kiwi', 'Peperoni', 'Arance', 'Fragole'],
  vitamin_d: ['Salmone', 'Sgombro', 'Uova', 'Sardine'],
  vitamin_e: ['Mandorle', 'Semi di girasole', 'Avocado', 'Olio EVO'],
  vitamin_k: ['Spinaci', 'Cavolo riccio', 'Broccoli', 'Cime di rapa'],
  calcium: ['Latte', 'Yogurt', 'Parmigiano', 'Rucola'],
  iron: ['Carne rossa', 'Lenticchie', 'Spinaci', 'Ceci'],
  magnesium: ['Mandorle', 'Spinaci', 'Cioccolato fondente', 'Noci'],
  potassium: ['Banane', 'Patate', 'Avocado', 'Fagioli'],
  phosphorus: ['Pollo', 'Latte', 'Lenticchie', 'Mandorle'],
  zinc: ['Manzo', 'Semi di zucca', 'Lenticchie', 'Ceci'],
  copper: ['Fegato', 'Cioccolato fondente', 'Anacardi', 'Lenticchie'],
  manganese: ['Noci', 'Riso integrale', 'Avena', 'Mandorle'],
  selenium: ['Noci del Brasile', 'Tonno', 'Uova', 'Pollo'],
  iodine: ['Alghe', 'Merluzzo', 'Yogurt', 'Gamberi'],
  proteins: ['Pollo', 'Uova', 'Lenticchie', 'Manzo'],
  carbs: ['Riso', 'Pasta', 'Pane integrale', 'Avena'],
  fats: ['Olio EVO', 'Avocado', 'Noci', 'Mandorle'],
  fiber: ['Legumi', 'Avena', 'Broccoli', 'Mele'],
  omega3: ['Salmone', 'Noci', 'Semi di lino', 'Sgombro'],
  omega6: ['Olio di semi di girasole', 'Noci', 'Mandorle'],
  water: ['Acqua', 'Cetrioli', 'Anguria', 'Melone'],
  calories: ['Olio EVO', 'Noci', 'Pasta', 'Riso'],
  sodium: ['Sale', 'Parmigiano', 'Sardine', 'Olive'],
};

export const DIET_CONFIGS = {
  standard: {
    label: 'Standard',
    dashboardMetrics: {
      top: ['proteins', 'carbs', 'fats', 'fiber'],
      bottom: ['water', 'vitamin_c', 'vitamin_d', 'calcium']
    },
    ignoreLow: [],
    warnings: [],
  },
  keto: {
    label: 'Keto',
    dashboardMetrics: {
      top: ['carbs', 'fats', 'proteins', 'fiber'],
      bottom: ['magnesium', 'potassium', 'sodium', 'water']
    },
    ignoreLow: ['carbs'],
    warnings: [
      { key: 'carbs', max: 50, message: 'Carboidrati sopra il target Keto di oggi.' }
    ],
  },
  carnivore: {
    label: 'Carnivore',
    dashboardMetrics: {
      top: ['proteins', 'fats', 'calories', 'water'],
      bottom: ['vitamin_b12', 'iron', 'zinc', 'sodium']
    },
    ignoreLow: ['carbs', 'fiber'],
    warnings: [],
  },
  intermittent_fasting: {
    label: 'Digiuno Intermittente',
    dashboardMetrics: {
      top: ['proteins', 'fiber', 'calories', 'water'],
      bottom: ['magnesium', 'potassium', 'calcium', 'sodium']
    },
    ignoreLow: [],
    warnings: [],
  }
};

/**
 * 1. calculateMealNutrients
 * Calculates nutrients for a specific meal quantity (g) based on 100g normalized food data.
 */
export function calculateMealNutrients(food, quantityGrams) {
  if (!food || !quantityGrams) return null;
  const factor = quantityGrams / 100;

  const meal = {
    food_id: food.id,
    name: food.name,
    quantity_grams: quantityGrams,
    calories: (food.calories || 0) * factor,
    proteins: (food.proteins || 0) * factor,
    carbs: (food.carbs || 0) * factor,
    fats: (food.fats || 0) * factor,
    fiber: (food.fiber || 0) * factor,
    water: (food.water || 0) * factor,
    omega3: (food.omega3 || 0) * factor,
    omega6: (food.omega6 || 0) * factor,
    food_nutrients: []
  };

  if (Array.isArray(food.food_nutrients)) {
    meal.food_nutrients = food.food_nutrients.map(n => ({
      nutrient_key: n.nutrient_key,
      nutrient_name: n.nutrient_name,
      amount: n.amount * factor,
      unit: n.unit
    }));
  }

  return meal;
}

/**
 * 2. calculateDailyTotals
 * Aggregates all meals to compute daily nutrient totals.
 */
export function calculateDailyTotals(meals) {
  const totals = {
    calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0,
    water: 0, omega3: 0, omega6: 0,
    micronutrients: {}
  };

  if (!meals || meals.length === 0) return totals;

  meals.forEach(meal => {
    totals.calories += meal.calories || 0;
    totals.proteins += meal.proteins || 0;
    totals.carbs += meal.carbs || 0;
    totals.fats += meal.fats || 0;
    totals.fiber += meal.fiber || 0;
    totals.water += meal.water || 0;
    totals.omega3 += meal.omega3 || 0;
    totals.omega6 += meal.omega6 || 0;

    if (Array.isArray(meal.food_nutrients)) {
      meal.food_nutrients.forEach(n => {
        if (!totals.micronutrients[n.nutrient_key]) {
          totals.micronutrients[n.nutrient_key] = 0;
        }
        totals.micronutrients[n.nutrient_key] += n.amount;
      });
    }
  });

  return totals;
}

/**
 * 2b. calculateAverageTotals
 * Aggregates an array of daily totals and returns the average.
 */
export function calculateAverageTotals(dailyTotalsArray) {
  if (!dailyTotalsArray || dailyTotalsArray.length === 0) return calculateDailyTotals([]);
  
  const sum = calculateDailyTotals([]);
  const count = dailyTotalsArray.length;

  dailyTotalsArray.forEach(totals => {
    Object.keys(sum).forEach(key => {
      if (key !== 'micronutrients') {
        sum[key] += (totals[key] || 0);
      }
    });
    if (totals.micronutrients) {
      Object.keys(totals.micronutrients).forEach(key => {
        if (!sum.micronutrients[key]) sum.micronutrients[key] = 0;
        sum.micronutrients[key] += totals.micronutrients[key];
      });
    }
  });

  Object.keys(sum).forEach(key => {
    if (key !== 'micronutrients') sum[key] = sum[key] / count;
  });
  Object.keys(sum.micronutrients).forEach(key => {
    sum.micronutrients[key] = sum.micronutrients[key] / count;
  });

  return sum;
}

/**
 * 3. calculateNutrientPercentage
 * Calculates the percentage of the target achieved.
 */
export function calculateNutrientPercentage(total, target) {
  if (!target || target === 0) return 100;
  return Math.round((total / target) * 100);
}

/**
 * 4. getNutrientStatus
 * Returns the status color code based on the percentage achieved.
 */
export function getNutrientStatus(percentage) {
  if (percentage >= 90) return 'green';
  if (percentage >= 60) return 'orange';
  return 'red';
}

/**
 * 5. getTopNutritionalPriorities
 * Identifies the top missing nutrients ordered by the lowest percentage.
 */
export function getTopNutritionalPriorities(totals, rda = DAILY_TARGETS, limit = 3, profile = null) {
  const missing = [];
  const dietType = profile?.diet_type || 'standard';
  const dietConfig = DIET_CONFIGS?.[dietType] || DIET_CONFIGS?.['standard'] || { ignoreLow: [] };
  
  // Helper to process a key
  const processKey = (key, amount) => {
    if (dietConfig.ignoreLow.includes(key)) return; // Salta se la dieta non lo penalizza
    const target = rda[key];
    if (target) {
      const pct = calculateNutrientPercentage(amount, target);
      const status = getNutrientStatus(pct);
      if (status !== 'green') {
        missing.push({ key, amount, target, percentage: pct, status });
      }
    }
  };

  // Check macros
  const macros = ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3', 'omega6'];
  macros.forEach(m => processKey(m, totals[m]));

  // Check micros
  if (totals.micronutrients) {
    Object.keys(rda).forEach(key => {
      if (!macros.includes(key)) {
        processKey(key, totals.micronutrients[key] || 0);
      }
    });
  }

  missing.sort((a, b) => a.percentage - b.percentage);
  return missing.slice(0, limit);
}

/**
 * 6. calculateNutrientDeficit
 */
export function calculateNutrientDeficit(total, target) {
  if (!target || total >= target) return 0;
  return target - total;
}

/**
 * 7. calculateFoodAmountForDeficit
 */
export function calculateFoodAmountForDeficit(deficitAmount, foodNutrientPer100g) {
  if (!foodNutrientPer100g || foodNutrientPer100g <= 0) return Infinity;
  return Math.round((deficitAmount / foodNutrientPer100g) * 100);
}

/**
 * 8. generateQuantifiedFixSuggestions
 */
export function generateQuantifiedFixSuggestions(nutrientKey, deficitAmount, foods, excludedKeywords = []) {
  if (deficitAmount <= 0) return [];
  
  // 1. Usa la whitelist italiana come priorità assoluta e filtra per allergie
  let italianOptions = ITALIAN_FOOD_SOURCES[nutrientKey] || [];
  if (excludedKeywords.length > 0) {
    italianOptions = italianOptions.filter(foodName => diseaseEngine.isFoodSafe(foodName, excludedKeywords));
  }
  
  const suggestions = [];
  let addedRealistic = false;

  // Se abbiamo i cibi dal database, cerchiamo di quantificarli usando la whitelist
  if (foods && foods.length > 0) {
    const candidates = [];
    
    // Trova i cibi nella whitelist all'interno del DB
    italianOptions.forEach(whiteItem => {
      const dbFood = foods.find(f => f.name.toLowerCase().includes(whiteItem.toLowerCase()));
      if (dbFood) {
        let amountPer100g = dbFood[nutrientKey] || 0;
        if (amountPer100g === 0 && Array.isArray(dbFood.food_nutrients)) {
          const n = dbFood.food_nutrients.find(x => x.nutrient_key === nutrientKey);
          if (n) amountPer100g = n.amount;
        }
        if (amountPer100g > 0) {
          candidates.push({ name: whiteItem, amountPer100g });
        }
      }
    });

    candidates.sort((a, b) => b.amountPer100g - a.amountPer100g);

    for (let i = 0; i < Math.min(3, candidates.length); i++) {
      const food = candidates[i];
      const requiredGrams = calculateFoodAmountForDeficit(deficitAmount, food.amountPer100g);
      
      if (requiredGrams > 800) continue; // Porzione irreale
      
      addedRealistic = true;
      if (food.name.toLowerCase().includes('uov')) {
        const pieces = Math.ceil(requiredGrams / 50);
        suggestions.push(`✓ ${pieces} Uova`);
      } else {
        suggestions.push(`✓ ${requiredGrams} g ${food.name}`);
      }
    }
  }

  // 2. Fallback: Se non abbiamo dati per la quantificazione, mostra solo i nomi della whitelist
  if (!addedRealistic && italianOptions.length > 0) {
    return italianOptions.slice(0, 3).map(f => `✓ ${f}`);
  }

  if (suggestions.length === 0) {
    return ["Aumenta il consumo di alimenti integrali."];
  }

  return suggestions;
}

/**
 * Utility: Restituisce il breakdown dello score per spiegare il calcolo all'utente
 */
export function getScoreBreakdown(dailyTotals, profile = null) {
  const rda = getRDA(profile);
  const comparison = compareWithRDA(dailyTotals, profile);
  const breakdown = [];

  const addItems = (keys, status) => {
    keys.forEach(k => {
      const target = rda[k];
      const isMacro = ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3', 'omega6'].includes(k);
      const val = isMacro ? (dailyTotals[k] || 0) : ((dailyTotals.micronutrients && dailyTotals.micronutrients[k]) ? dailyTotals.micronutrients[k] : 0);
      const pct = calculateNutrientPercentage(val, target);
      breakdown.push({
        key: k,
        label: NUTRIENT_LABELS[k] || k,
        percentage: pct,
        status: status
      });
    });
  };

  addItems(comparison.ok, 'ok');
  addItems(comparison.low, 'low');
  addItems(comparison.missing, 'missing');

  return breakdown;
}

/**
 * 9. calculateNutritionScore
 * Calcola lo score (0-100) basato sulla media delle percentuali (max 100% per nutriente)
 */
export function calculateNutritionScore(dailyTotals, profile = null) {
  if (!dailyTotals) return 0;
  let totalPercent = 0;
  let count = 0;

  const rda = getRDA(profile);
  const dietType = profile?.diet_type || 'standard';
  const dietConfig = DIET_CONFIGS?.[dietType] || DIET_CONFIGS?.['standard'] || { ignoreLow: [] };

  const allKeys = Object.keys(rda);
  allKeys.forEach(key => {
    let amount;
    const isMacro = ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3', 'omega6'].includes(key);
    if (isMacro) {
      amount = dailyTotals[key] || 0;
    } else {
      amount = (dailyTotals.micronutrients && dailyTotals.micronutrients[key]) ? dailyTotals.micronutrients[key] : 0;
    }

    const target = rda[key];
    if (target > 0) {
      let pct = (amount / target) * 100;
      
      // Logica Keto / Diete Low-Carb
      if (dietConfig.ignoreLow.includes(key)) {
        // Se è sotto target non penalizza, se è zero è addirittura 100% positivo
        if (amount <= target) {
          pct = 100;
        } else {
          // Penalizza proporzionalmente
          pct = Math.max(0, 100 - ((amount - target) / target * 100));
        }
      }

      if (pct > 100) pct = 100; // Cap a 100%
      totalPercent += pct;
      count++;
    }
  });

  if (count === 0) return 0;
  return Math.round(totalPercent / count);
}

/**
 * 10. getNutritionScoreLabel
 */
export function getNutritionScoreLabel(score) {
  if (score >= 90) return 'Ottimo';
  if (score >= 75) return 'Buono';
  if (score >= 60) return 'Da migliorare';
  return 'Basso';
}

/**
 * 11. getRDA
 * Calcola i target personalizzati basati sul profilo e condizioni mediche
 */
export function getRDA(profile, healthContext = null) {
  let targets = { ...DAILY_TARGETS };
  if (profile?.diet_type === 'keto') {
    targets.carbs = 30; // 30g carbs
    targets.fats = 120; // boost fats
  } else if (profile?.diet_type === 'carnivore') {
    targets.carbs = 0;
    targets.fiber = 0;
    targets.fats = 150;
    targets.proteins = 120;
  }
  
  if (healthContext?.conditions) {
    targets = diseaseEngine.applyConditionAdjustments(targets, healthContext.conditions);
  }
  
  return targets;
}

/**
 * 12. compareWithRDA
 * Confronta un totale giornaliero con l'RDA e separa in ok, low, missing
 */
export function compareWithRDA(totals, profile = null) {
  const result = { ok: [], low: [], missing: [] };
  if (!totals) return result;

  const rda = getRDA(profile);
  const dietType = profile?.diet_type || 'standard';
  const dietConfig = DIET_CONFIGS?.[dietType] || DIET_CONFIGS?.['standard'] || { ignoreLow: [] };

  const processNutrient = (key, amount) => {
    const target = rda[key];
    if (target) {
      if (dietConfig.ignoreLow.includes(key)) {
        if (amount <= target) result.ok.push(key);
        else result.low.push(key);
        return;
      }
      
      const pct = calculateNutrientPercentage(amount, target);
      if (pct >= 90) result.ok.push(key);
      else if (pct >= 60) result.low.push(key);
      else result.missing.push(key);
    }
  };

  const macros = ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3', 'omega6'];
  macros.forEach(m => processNutrient(m, totals[m]));

  if (totals.micronutrients) {
    Object.keys(rda).forEach(key => {
      if (!macros.includes(key)) {
        processNutrient(key, totals.micronutrients[key] || 0);
      }
    });
  }

  return result;
}

/**
 * 13. calculateDailyHealthStatus
 * Determina il colore del calendario in base a score + numero di nutrienti critici
 */
export function calculateDailyHealthStatus(score, missingCount) {
  // Score 85 ma 5 nutrienti critici -> non deve diventare verde
  if (missingCount >= 3) return 'red'; // Apporto basso (rosso)
  if (missingCount > 0 || score < 80) return 'orange'; // Da migliorare (arancione)
  return 'green'; // OK (verde)
}

export default {
  calculateMealNutrients,
  calculateDailyTotals,
  calculateAverageTotals,
  calculateNutrientPercentage,
  getNutrientStatus,
  getTopNutritionalPriorities,
  calculateNutrientDeficit,
  calculateFoodAmountForDeficit,
  generateQuantifiedFixSuggestions,
  calculateNutritionScore,
  getNutritionScoreLabel,
  getRDA,
  compareWithRDA,
  calculateDailyHealthStatus,
  DAILY_TARGETS,
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  ITALIAN_FOOD_SOURCES,
  getScoreBreakdown,
  DIET_CONFIGS
};
