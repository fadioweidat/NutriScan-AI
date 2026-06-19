/**
 * Shopping List Engine (Phase 4)
 * Compiles and aggregates ingredients from daily meal plans into a consolidated checklist.
 */

/**
 * Compiles a shopping list from all days and meals inside a weekly plan.
 * Unifies duplicate ingredients (sums quantities) and groups by category.
 */
export function generateShoppingList(mealPlanDays = []) {
  const rawItems = [];

  // 1. Gather all ingredients
  mealPlanDays.forEach(day => {
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealKey => {
      const meal = day[mealKey];
      if (meal && Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach(ing => {
          rawItems.push({
            name: ing.name,
            amount: ing.amount,
            category: ing.category || 'Altro'
          });
        });
      }
    });
  });

  // 2. Consolidate duplicates
  const grouped = {};
  
  rawItems.forEach(item => {
    const key = `${item.name.toLowerCase()}_${item.category}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        name: item.name,
        category: item.category,
        units: {}
      };
    }

    // Parse amount string, e.g. "150 g" or "3 pz"
    const match = item.amount.match(/^([\d.,]+)\s*(.*)$/);
    if (match) {
      const value = parseFloat(match[1].replace(',', '.'));
      const unit = (match[2] || '').trim();
      
      if (!grouped[key].units[unit]) {
        grouped[key].units[unit] = 0;
      }
      grouped[key].units[unit] += value;
    } else {
      // Fallback if formatting doesn't match standard
      const unit = item.amount;
      if (!grouped[key].units[unit]) {
        grouped[key].units[unit] = 0;
      }
      grouped[key].units[unit] += 1;
    }
  });

  // 3. Format unified strings
  const shoppingList = Object.values(grouped).map(g => {
    const amountStrings = Object.entries(g.units).map(([unit, value]) => {
      // Clean decimal formatting
      const cleanVal = Number(value.toFixed(1));
      return `${cleanVal} ${unit}`;
    });

    return {
      alimento: g.name,
      quantita: amountStrings.join(' + '),
      categoria: g.category,
      completato: false
    };
  });

  // Sort by category then by name
  return shoppingList.sort((a, b) => {
    if (a.categoria !== b.categoria) {
      return a.categoria.localeCompare(b.categoria);
    }
    return a.alimento.localeCompare(b.alimento);
  });
}

export default {
  generateShoppingList
};
