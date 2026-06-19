/**
 * Daily Score Engine (Phase 3)
 * Calculates the Daily Health Score, Diet Compliance, and Educational Risk Level.
 */

// 1. DIET COMPLIANCE CALCULATION (0-100%)
export function calculateDietCompliance(totals, dietType, meals = [], conditions = []) {
  const type = (dietType || 'standard').toLowerCase();
  
  // If no totals/meals logged, default compliance is 100% (neutral starting point)
  if (!totals && meals.length === 0) {
    return 100;
  }

  const carbs = Number(totals?.carbs || totals?.carbs_g || 0);
  const fiber = Number(totals?.fiber || totals?.fiber_g || 0);
  const calories = Number(totals?.calories || 0);

  // String signatures for animal and non-paleo foods
  const mealNames = meals.map(m => (m.foods?.name || m.name || '').toLowerCase());
  
  const animalKeywords = [
    'manzo', 'pollo', 'tacchino', 'maiale', 'pesce', 'salmone', 'tonno', 'cozze', 'vongole',
    'prosciutto', 'salame', 'salsiccia', 'fegato', 'carne', 'uovo', 'uova', 'latte', 'formaggio',
    'parmigiano', 'mozzarella', 'yogurt', 'burro', 'miele'
  ];

  const processedKeywords = [
    'merendina', 'biscotti', 'patatine', 'zucchero', 'cola', 'soda', 'cioccolato al latte', 'würstel'
  ];

  let baseCompliance;

  switch (type) {
    case 'keto':
    case 'cheto':
    case 'chetogenica': {
      // Keto: carbs <= 30g (or <= 10% kcal)
      if (carbs <= 30) baseCompliance = 100;
      else baseCompliance = Math.max(0, Math.round(100 - (carbs - 30) * 2.5));
      break;
    }

    case 'carnivore':
    case 'carnivora': {
      // Carnivore: near zero carbs (<= 10g), only animal foods
      let compliance = 100;
      if (carbs > 10) {
        compliance -= (carbs - 10) * 5;
      }
      // Check if any non-animal keywords are found in meal names
      const nonAnimalFoods = mealNames.filter(name => 
        !animalKeywords.some(kw => name.includes(kw)) && 
        (name.includes('insalata') || name.includes('mela') || name.includes('banana') || name.includes('verdura') || name.includes('pane') || name.includes('pasta'))
      );
      compliance -= nonAnimalFoods.length * 20;
      baseCompliance = Math.max(0, Math.round(compliance));
      break;
    }

    case 'vegan':
    case 'vegana': {
      // Vegan: zero animal products
      let infractions = 0;
      mealNames.forEach(name => {
        if (animalKeywords.some(kw => name.includes(kw))) {
          infractions++;
        }
      });
      baseCompliance = Math.max(0, Math.round(100 - infractions * 25));
      break;
    }

    case 'vegetarian':
    case 'vegetariana': {
      // Vegetarian: no meat or fish, but eggs/dairy allowed
      let infractions = 0;
      const meatFishKeywords = ['manzo', 'pollo', 'tacchino', 'maiale', 'pesce', 'salmone', 'tonno', 'cozze', 'vongole', 'prosciutto', 'salame', 'salsiccia', 'fegato', 'carne'];
      mealNames.forEach(name => {
        if (meatFishKeywords.some(kw => name.includes(kw))) {
          infractions++;
        }
      });
      baseCompliance = Math.max(0, Math.round(100 - infractions * 25));
      break;
    }

    case 'low carb':
    case 'low_carb':
    case 'lowcarb': {
      // Low Carb: carbs <= 100g
      if (carbs <= 100) baseCompliance = 100;
      else baseCompliance = Math.max(0, Math.round(100 - (carbs - 100) * 1.2));
      break;
    }

    case 'mediterranean':
    case 'mediterranea': {
      // Mediterranean: carbs 40-60%, fiber >= 20g
      let score = 100;
      if (calories > 0) {
        const carbKcalPct = (carbs * 4 / calories) * 100;
        if (carbKcalPct < 40) score -= (40 - carbKcalPct) * 2;
        if (carbKcalPct > 65) score -= (carbKcalPct - 65) * 2;
      }
      if (fiber < 20) {
        score -= (20 - fiber) * 4;
      }
      baseCompliance = Math.max(0, Math.round(score));
      break;
    }

    case 'paleo': {
      // Paleo: no grains, legumes, dairy, processed foods
      let infractions = 0;
      const paleoViolations = ['pane', 'pasta', 'riso', 'grano', 'orzo', 'farina', 'crusca', 'avena', 'fagioli', 'lenticchie', 'ceci', 'soia', 'latte', 'formaggio', 'yogurt', 'burro', ...processedKeywords];
      mealNames.forEach(name => {
        if (paleoViolations.some(kw => name.includes(kw))) {
          infractions++;
        }
      });
      baseCompliance = Math.max(0, Math.round(100 - infractions * 20));
      break;
    }

    case 'fasting':
    case 'digiuno': {
      // Intermittent Fasting: compliance is high if meals are condensed (e.g. <= 3 meals)
      if (meals.length <= 3) baseCompliance = 100;
      else baseCompliance = Math.max(0, Math.round(100 - (meals.length - 3) * 15));
      break;
    }

    default:
      baseCompliance = 100;
      break;
  }

  // Adjust compliance based on health conditions
  let conditionCompliancePenalty = 0;
  
  (conditions || []).forEach(c => {
    const name = c.condition_name.toLowerCase();
    
    if (name.includes('diabete')) {
      const sugar = Number(totals?.sugar || totals?.sugar_g || 0);
      if (sugar > 30) {
        conditionCompliancePenalty += 20; // 20% penalty if sugar > 30g
      }
    }
    
    if (name.includes('ipertensione')) {
      const sodium = Number(totals?.sodium || 0);
      if (sodium > 2000) {
        conditionCompliancePenalty += 20; // 20% penalty if sodium > 2000mg
      }
    }
    
    if (name.includes('colesterolo') || name.includes('ipercolesterolemia')) {
      const saturatedFat = Number(totals?.saturated_fat || totals?.saturated_fat_g || 0);
      if (saturatedFat > 20) {
        conditionCompliancePenalty += 20; // 20% penalty if saturated fat > 20g
      }
    }
    
    if (name.includes('celia')) {
      const glutenKeywords = ['pane', 'pasta', 'pizza', 'farina', 'biscotti', 'crackers', 'grano', 'orzo', 'farro', 'avena'];
      let glutenFound = false;
      mealNames.forEach(nameStr => {
        if (glutenKeywords.some(kw => nameStr.includes(kw)) && !nameStr.includes('senza glutine') && !nameStr.includes('gluten free')) {
          glutenFound = true;
        }
      });
      if (glutenFound) {
        conditionCompliancePenalty += 50; // 50% penalty if gluten found
      }
    }
    
    if (name.includes('anemia')) {
      const iron = Number(totals?.iron || totals?.micronutrients?.iron || 0);
      if (totals && iron < 10) {
        conditionCompliancePenalty += 15;
      }
    }
    
    if (name.includes('osteoporosi')) {
      const calcium = Number(totals?.calcium || totals?.micronutrients?.calcium || 0);
      const vitD = Number(totals?.vitamin_d || totals?.micronutrients?.vitamin_d || 0);
      if (totals && (calcium < 800 || vitD < 10)) {
        conditionCompliancePenalty += 15;
      }
    }
    
    if (name.includes('insufficienza renale')) {
      const protein = Number(totals?.proteins || totals?.proteins_g || 0);
      if (protein > 90) {
        conditionCompliancePenalty += 15;
      }
    }
  });

  return Math.max(0, Math.round(baseCompliance - conditionCompliancePenalty));
}

// 2. DAILY HEALTH SCORE CALCULATION (0-100)
export function calculateDailyHealthScore({ totals, dietType, meals = [], sleepLog, stressLog, hydrationLog, activityLogs = [], conditions = [] }) {
  let score = 0;

  // A. Nutrition & Diet Compliance (max 30 points)
  const dietCompliance = calculateDietCompliance(totals, dietType, meals, conditions);
  const nutritionPercent = totals ? Math.min(100, Math.max(0, Number(totals.score || 50))) : 50;
  // Blend nutrition balance (70%) and diet compliance (30%)
  const blendedNutrition = (nutritionPercent * 0.7) + (dietCompliance * 0.3);
  score += Math.round(blendedNutrition * 0.3); // max 30 points

  // B. Sleep duration & quality (max 20 points)
  let sleepScore = 14; // Default neutral if no log
  if (sleepLog) {
    const hours = Number(sleepLog.duration_hours || 0);
    const quality = Number(sleepLog.quality_score || 3);
    
    // Duration: optimal 7-9 hours (10 pts)
    let durPts;
    if (hours >= 7 && hours <= 9) durPts = 10;
    else if (hours < 7) durPts = (hours / 7) * 10;
    else durPts = Math.max(0, 10 - (hours - 9) * 2);

    // Quality: 1-5 stars (10 pts)
    const qualPts = (quality / 5) * 10;
    
    sleepScore = durPts + qualPts;
  }
  score += Math.round(sleepScore); // max 20 points

  // C. Physical Activity minutes (max 20 points)
  let activityScore = 5; // Default sedentary if no activities log
  if (activityLogs && activityLogs.length > 0) {
    const totalMinutes = activityLogs.reduce((sum, act) => sum + Number(act.duration_minutes || 0), 0);
    // Optimal target: >= 30 minutes of exercise
    if (totalMinutes >= 30) {
      activityScore = 20;
    } else {
      activityScore = 5 + (totalMinutes / 30) * 15;
    }
  }
  score += Math.round(activityScore); // max 20 points

  // D. Hydration water intake (max 15 points)
  let hydrationScore = 0;
  if (hydrationLog) {
    const water = Number(hydrationLog.water_ml || 0);
    // Optimal target: >= 2000 ml
    if (water >= 2000) {
      hydrationScore = 15;
    } else {
      hydrationScore = (water / 2000) * 15;
    }
  }
  score += Math.round(hydrationScore); // max 15 points

  // E. Stress levels (max 15 points)
  let stressScore = 10; // Default neutral if no log
  if (stressLog) {
    const stress = Number(stressLog.stress_level || 5);
    // Optimal target: stress <= 3
    stressScore = Math.max(0, ((10 - stress) / 9) * 15);
  }
  score += Math.round(stressScore); // max 15 points

  // F. Apply direct condition penalties to Health Score
  let conditionScorePenalty = 0;
  (conditions || []).forEach(c => {
    const name = c.condition_name.toLowerCase();
    
    if (name.includes('diabete')) {
      const sugar = Number(totals?.sugar || totals?.sugar_g || 0);
      if (sugar > 30) {
        conditionScorePenalty += 10;
      }
    }
    
    if (name.includes('ipertensione')) {
      const sodium = Number(totals?.sodium || 0);
      if (sodium > 2000) {
        conditionScorePenalty += 10;
      }
    }
    
    if (name.includes('colesterolo') || name.includes('ipercolesterolemia')) {
      const saturatedFat = Number(totals?.saturated_fat || totals?.saturated_fat_g || 0);
      if (saturatedFat > 20) {
        conditionScorePenalty += 10;
      }
    }
    
    if (name.includes('celia')) {
      const glutenKeywords = ['pane', 'pasta', 'pizza', 'farina', 'biscotti', 'crackers', 'grano', 'orzo', 'farro', 'avena'];
      let glutenFound = false;
      const mealNames = meals.map(m => (m.foods?.name || m.name || '').toLowerCase());
      mealNames.forEach(nameStr => {
        if (glutenKeywords.some(kw => nameStr.includes(kw)) && !nameStr.includes('senza glutine') && !nameStr.includes('gluten free')) {
          glutenFound = true;
        }
      });
      if (glutenFound) {
        conditionScorePenalty += 20;
      }
    }
    
    if (name.includes('anemia')) {
      const iron = Number(totals?.iron || totals?.micronutrients?.iron || 0);
      if (totals && iron < 10) {
        conditionScorePenalty += 10;
      }
    }
    
    if (name.includes('osteoporosi')) {
      const calcium = Number(totals?.calcium || totals?.micronutrients?.calcium || 0);
      const vitD = Number(totals?.vitamin_d || totals?.micronutrients?.vitamin_d || 0);
      if (totals && (calcium < 800 || vitD < 10)) {
        conditionScorePenalty += 10;
      }
    }
    
    if (name.includes('insufficienza renale')) {
      const protein = Number(totals?.proteins || totals?.proteins_g || 0);
      if (protein > 90) {
        conditionScorePenalty += 10;
      }
    }
  });

  return Math.max(0, Math.min(100, Math.round(score - conditionScorePenalty)));
}

// 3. EDUCATIONAL RISK LEVEL CALCULATION (LOW, MEDIUM, HIGH)
export function calculateRiskLevel(healthScore, conditions = [], medications = [], biomarkers = []) {
  let riskPoints = 0;

  // A. Health Score contribution
  if (healthScore < 50) {
    riskPoints += 5;
  } else if (healthScore < 75) {
    riskPoints += 2;
  }

  // B. Health conditions (more conditions increase risk)
  if (conditions.length > 0) {
    riskPoints += Math.min(3, conditions.length);
  }

  // C. Biomarker concerns (deficiencies/excess)
  const abnormalBiomarkers = biomarkers.filter(b => b.status === 'low' || b.status === 'high');
  if (abnormalBiomarkers.length > 0) {
    riskPoints += Math.min(3, abnormalBiomarkers.length);
  }

  // D. Active medication interaction triggers
  const criticalMeds = medications.filter(m => {
    const name = m.medication_name.toLowerCase();
    return name.includes('warfarin') || name.includes('levotiroxina') || name.includes('metformina') || name.includes('cardioaspirina');
  });
  if (criticalMeds.length > 0) {
    riskPoints += 1;
  }

  // Deduce Risk level
  if (riskPoints >= 6) return 'HIGH';
  if (riskPoints >= 3) return 'MEDIUM';
  return 'LOW';
}

export default {
  calculateDietCompliance,
  calculateDailyHealthScore,
  calculateRiskLevel
};
