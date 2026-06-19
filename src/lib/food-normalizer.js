/**
 * NutriScan AI - Food Normalizer
 * Logica per deduplicazione e pulizia dei dati alimentari
 */

// Stopwords da ignorare per il calcolo della somiglianza
const STOP_WORDS = new Set(['fresco', 'fresca', 'fresche', 'intero', 'intera', 'intere', 'crudo', 'cruda', 'cotto', 'cotta', 'surgelato', 'con', 'al', 'alla', 'di', 'del']);

/**
 * 1. normalizeFoodName
 * Pulisce il nome del cibo per confronti coerenti.
 */
export function normalizeFoodName(name) {
  if (!name) return '';
  let clean = name.toLowerCase().trim();
  // Rimuovi caratteri speciali
  clean = clean.replace(/[^\w\sàèéìòù]/g, ' ');
  // Rimuovi stopwords
  const tokens = clean.split(/\s+/).filter(w => !STOP_WORDS.has(w) && w.length > 2);
  return tokens.join(' ');
}

/**
 * Distanza di Levenshtein per stringhe
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * 2. findDuplicateFoods
 * Cerca se l'alimento target esiste già in un array di cibi (es. il database caricato)
 */
export function findDuplicateFoods(targetFood, existingFoods, threshold = 0.85) {
  const normTarget = normalizeFoodName(targetFood.name);
  if (!normTarget) return [];

  const candidates = [];
  for (const food of existingFoods) {
    // Exact match barcode
    if (targetFood.barcode && food.barcode && targetFood.barcode === food.barcode) {
      candidates.push({ food, score: 1.0, type: 'barcode' });
      continue;
    }
    
    // Similarity match
    const normExisting = normalizeFoodName(food.name);
    if (!normExisting) continue;

    const distance = levenshteinDistance(normTarget, normExisting);
    const maxLength = Math.max(normTarget.length, normExisting.length);
    const similarity = 1 - (distance / maxLength);

    if (similarity >= threshold) {
      // Se hanno brand diversi, penalizza leggermente
      let finalScore = similarity;
      if (targetFood.brand && food.brand && targetFood.brand.toLowerCase() !== food.brand.toLowerCase()) {
        finalScore -= 0.1;
      }
      
      if (finalScore >= threshold) {
        candidates.push({ food, score: finalScore, type: 'name' });
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * 3. mergeFoodRecords
 * Unisce due record mantenendo la "source" più autorevole e fondendo i campi mancanti.
 * Ordine di autorevolezza: USDA > CREA > Local > OFF
 */
const SOURCE_RANK = {
  'USDA': 4,
  'CREA': 3,
  'LOCAL': 2,
  'OPEN_FOOD_FACTS': 1,
  'UNKNOWN': 0
};

export function mergeFoodRecords(existingFood, newFood) {
  const existingRank = SOURCE_RANK[existingFood.source] || SOURCE_RANK['UNKNOWN'];
  const newRank = SOURCE_RANK[newFood.source] || SOURCE_RANK['UNKNOWN'];

  const base = existingRank >= newRank ? { ...existingFood } : { ...newFood };
  const secondary = existingRank >= newRank ? { ...newFood } : { ...existingFood };

  // Fai un merge superficiale per campi vuoti
  const merged = { ...base };
  for (const key of Object.keys(secondary)) {
    if ((merged[key] === null || merged[key] === undefined || merged[key] === '') && secondary[key]) {
      merged[key] = secondary[key];
    }
  }
  
  // Array nutrizionali: mantieni quello della fonte più autorevole
  merged.food_nutrients = existingRank >= newRank ? existingFood.food_nutrients : newFood.food_nutrients;

  return merged;
}

export default {
  normalizeFoodName,
  findDuplicateFoods,
  mergeFoodRecords
};
