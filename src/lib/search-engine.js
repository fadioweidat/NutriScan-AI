import { supabase } from './supabase.js';
import { normalizeFoodName } from './food-normalizer.js';

/**
 * 1. searchFoods
 * Motore di ricerca unificato per query testuali o numeriche (barcode)
 */
export async function searchFoods(queryStr, limit = 20) {
  if (!queryStr || queryStr.trim().length === 0) return [];
  
  const rawQuery = queryStr.trim().toLowerCase();
  
  // Se la query contiene solo numeri (almeno 8 cifre), si suppone sia un barcode
  const isBarcode = /^\d{8,14}$/.test(rawQuery);

  if (isBarcode) {
    const { data, error } = await supabase
      .from('foods')
      .select('*, food_nutrients(*)')
      .eq('barcode', rawQuery)
      .limit(1);
    
    if (error) {
      console.error('Search by barcode error:', error);
      return [];
    }
    return data || [];
  }

  // Ricerca testuale
  const normQuery = normalizeFoodName(rawQuery) || rawQuery;
  
  // Fetch up to 100 items to perform accurate JS sorting based on exact match
  const { data, error } = await supabase
    .from('foods')
    .select('*, food_nutrients(*)')
    .or(`name.ilike.%${normQuery}%,brand.ilike.%${normQuery}%`)
    .limit(100);

  if (error) {
    console.error('Search text error:', error);
    // Fallback se schema vecchio non ha la colonna 'brand'
    if (error.code === '42703' || error.message.includes('column')) {
       console.warn('Colonna brand mancante. Eseguo fallback ricerca solo su name.');
       const { data: fbData } = await supabase
          .from('foods')
          .select('*, food_nutrients(*)')
          .ilike('name', `%${normQuery}%`)
          .limit(limit);
       return fbData || [];
    }
    return [];
  }

  if (!data || data.length === 0) return [];

  const COMMON_ITALIAN_FOODS = ['pasta', 'riso', 'pane', 'latte', 'yogurt', 'parmigiano', 'mozzarella', 'banana', 'mela', 'pollo', 'manzo', 'tonno', 'salmone', 'uova', 'olio evo', 'pomodoro', 'zucchine'];
  const WEIRD_USDA_FOODS = ['alaska native', 'moose', 'whale', 'caribou', 'seal', 'bear', 'buffalo', 'wild game', 'scoter', 'goose liver'];

  const calculateQualityScore = (food) => {
    let score = 0;
    // 1. SYSTEM
    // 2. CREA
    // 3. OPEN_FOOD_FACTS
    // 4. USDA comuni
    // 5. USDA poco comuni
    if (food.source === 'system') score += 1000;
    else if (food.source === 'CREA') score += 800;
    else if (food.source === 'OPEN_FOOD_FACTS' || food.source === 'OFF') score += 600;
    else if (food.source === 'USDA') score += 400;

    const lowerName = (food.name || '').toLowerCase();
    
    const isCommon = COMMON_ITALIAN_FOODS.some(kw => lowerName.includes(kw));
    if (isCommon) score += 100;

    const isWeird = WEIRD_USDA_FOODS.some(kw => lowerName.includes(kw));
    if (isWeird) score -= 500; // Penalità pesante per USDA poco comuni

    return score;
  };

  const sorted = data.sort((a, b) => {
    const aName = (a.name || '').toLowerCase();
    const bName = (b.name || '').toLowerCase();

    const aExact = aName === rawQuery || aName === normQuery;
    const bExact = bName === rawQuery || bName === normQuery;

    // Se uno dei due matcha esattamente la query dell'utente, vince a prescindere dal rank (se sensato)
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Quality Score
    const aScore = calculateQualityScore(a);
    const bScore = calculateQualityScore(b);
    
    if (aScore !== bScore) return bScore - aScore;

    // Tie-breakers originali
    const aVerif = a.verified ? 1 : 0;
    const bVerif = b.verified ? 1 : 0;
    if (aVerif !== bVerif) return bVerif - aVerif;

    const aComp = a.nutrient_completeness || 0;
    const bComp = b.nutrient_completeness || 0;
    return bComp - aComp;
  });

  return sorted.slice(0, limit);
}

export default {
  searchFoods
};
