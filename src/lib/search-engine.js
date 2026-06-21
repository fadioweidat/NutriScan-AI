import { supabase } from './supabase.js';
import { normalizeFoodName } from './food-normalizer.js';

const DEFAULT_LIMIT = 20;
const SEARCH_FETCH_LIMIT = 120;

const FOOD_SYNONYMS = {
  patatine: ['patate', 'chips'],
  chips: ['patatine', 'patate'],
  cola: ['coca cola', 'coca-cola'],
  'coca cola': ['cola'],
  mozzarella: ['mozzarella vaccina', 'fior di latte'],
  caffe: ['espresso', 'caffe espresso'],
  'caffe espresso': ['espresso', 'caffe'],
  'caff\u00e8': ['espresso', 'caffe espresso'],
  pollo: ['petto di pollo', 'pollo arrosto'],
  pane: ['pane comune', 'pane bianco', 'pane integrale', 'bread'],
  pasta: ['pasta secca', 'spaghetti', 'penne', 'macaroni'],
  riso: ['riso bianco', 'riso integrale'],
  latte: ['latte vaccino', 'latte intero', 'latte parzialmente scremato', 'milk', 'whole milk'],
  mela: ['mele', 'mela golden', 'apple', 'apples'],
  banana: ['banane'],
  pizza: ['pizza margherita', 'pizza marinara', 'pizza quattro formaggi', 'pizza prosciutto', 'pizza vegetariana']
};

const ESSENTIAL_FOODS = [
  { name: 'Pizza Margherita', category: 'Piatti pronti', calories: 266, proteins: 11, carbs: 33, fats: 10, fiber: 2.3, water: 43 },
  { name: 'Pizza Marinara', category: 'Piatti pronti', calories: 240, proteins: 7, carbs: 38, fats: 7, fiber: 2.5, water: 45 },
  { name: 'Pizza Quattro Formaggi', category: 'Piatti pronti', calories: 302, proteins: 13, carbs: 30, fats: 15, fiber: 2, water: 39 },
  { name: 'Pizza Prosciutto', category: 'Piatti pronti', calories: 275, proteins: 13, carbs: 32, fats: 11, fiber: 2, water: 42 },
  { name: 'Pizza Vegetariana', category: 'Piatti pronti', calories: 245, proteins: 9, carbs: 34, fats: 8, fiber: 3, water: 46 },
  { name: 'Pasta secca', category: 'Cereali', calories: 353, proteins: 12, carbs: 72, fats: 1.5, fiber: 3, water: 10 },
  { name: 'Pasta cotta', category: 'Cereali', calories: 158, proteins: 5.8, carbs: 30.9, fats: 0.9, fiber: 1.8, water: 62 },
  { name: 'Riso bianco cotto', category: 'Cereali', calories: 130, proteins: 2.7, carbs: 28, fats: 0.3, fiber: 0.4, water: 68 },
  { name: 'Pane comune', category: 'Pane', calories: 265, proteins: 9, carbs: 49, fats: 3.2, fiber: 2.7, water: 36 },
  { name: 'Pane integrale', category: 'Pane', calories: 247, proteins: 9.7, carbs: 41, fats: 4.2, fiber: 7, water: 38 },
  { name: 'Mela', category: 'Frutta', calories: 52, proteins: 0.3, carbs: 14, fats: 0.2, fiber: 2.4, water: 86 },
  { name: 'Banana', category: 'Frutta', calories: 89, proteins: 1.1, carbs: 22.8, fats: 0.3, fiber: 2.6, water: 75 },
  { name: 'Latte intero', category: 'Latticini', calories: 61, proteins: 3.2, carbs: 4.8, fats: 3.3, fiber: 0, water: 88 },
  { name: 'Latte parzialmente scremato', category: 'Latticini', calories: 46, proteins: 3.4, carbs: 4.9, fats: 1.6, fiber: 0, water: 90 },
  { name: 'Pollo petto crudo', category: 'Carne', calories: 120, proteins: 22.5, carbs: 0, fats: 2.6, fiber: 0, water: 74 },
  { name: 'Piadina', category: 'Pane', calories: 330, proteins: 8.5, carbs: 52, fats: 10, fiber: 2.2, water: 27 },
  { name: 'Piselli', category: 'Legumi', calories: 81, proteins: 5.4, carbs: 14.5, fats: 0.4, fiber: 5.1, water: 79 }
].map((food, index) => ({
  ...food,
  id: `essential-${index + 1}`,
  source: 'system',
  source_id: `essential:${index + 1}`,
  verified: true,
  nutrient_completeness: 8,
  essential_fallback: true,
  food_nutrients: []
}));

const COMMON_ITALIAN_FOODS = [
  'pizza', 'pasta', 'riso', 'pane', 'latte', 'yogurt', 'parmigiano',
  'mozzarella', 'banana', 'mela', 'pollo', 'manzo', 'tonno', 'salmone',
  'uova', 'olio evo', 'pomodoro', 'zucchine', 'piadina', 'piselli'
];

const WEIRD_USDA_FOODS = [
  'alaska native', 'moose', 'whale', 'caribou', 'seal', 'bear',
  'buffalo', 'wild game', 'scoter', 'goose liver'
];

const escapeLike = (value) => value.replace(/[%_]/g, (char) => `\\${char}`);
const escapeOrValue = (value) => value.replace(/[(),]/g, ' ');

const stripAccents = (value) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeComparable = (value) =>
  stripAccents(String(value || '').toLowerCase().trim()).replace(/\s+/g, ' ');

const getFoodName = (food) => normalizeComparable(food?.name);

function levenshteinDistance(a, b) {
  if (!a) return b.length;
  if (!b) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = a[i - 1] === b[j - 1]
        ? previous[j - 1]
        : Math.min(previous[j - 1] + 1, previous[j] + 1, current[j - 1] + 1);
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function similarity(a, b) {
  const left = normalizeComparable(a);
  const right = normalizeComparable(b);
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 0;
  return 1 - (levenshteinDistance(left, right) / maxLength);
}

function getSearchTerms(rawQuery) {
  const lower = normalizeComparable(rawQuery);
  const normalized = normalizeComparable(normalizeFoodName(rawQuery) || rawQuery);
  const terms = new Set([lower, normalized]);

  [lower, normalized].forEach((term) => {
    const synonyms = FOOD_SYNONYMS[term] || FOOD_SYNONYMS[stripAccents(term)] || [];
    synonyms.forEach((synonym) => terms.add(normalizeComparable(synonym)));
  });

  return [...terms].filter(Boolean);
}

function dedupeByIdOrName(items) {
  const map = new Map();
  items.forEach((food) => {
    const key = food.id || `${normalizeComparable(food.name)}::${food.source || ''}`;
    if (!map.has(key)) map.set(key, food);
  });
  return [...map.values()];
}

function getSourceScore(food) {
  if (food.source === 'system') return 1000;
  if (food.source === 'CREA') return 800;
  if (food.source === 'OPEN_FOOD_FACTS' || food.source === 'OFF') return 600;
  if (food.source === 'USDA') return 400;
  return 200;
}

function getQualityScore(food) {
  const lowerName = getFoodName(food);
  let score = getSourceScore(food);

  if (COMMON_ITALIAN_FOODS.some((keyword) => lowerName.includes(keyword))) score += 100;
  if (WEIRD_USDA_FOODS.some((keyword) => lowerName.includes(keyword))) score -= 500;
  if (food.verified) score += 50;
  score += Math.min(Number(food.nutrient_completeness || 0), 50);

  return score;
}

function getRank(food, rawQuery, terms, stepRank) {
  if (food.ai_estimate) return 5;

  const name = getFoodName(food);
  const exact = terms.some((term) => name === term);
  if (exact) return 1;

  const tokens = name.split(/\s+/).filter(Boolean);
  const startsWith = terms.some((term) => name.startsWith(term) || tokens.some((token) => token.startsWith(term)));
  if (startsWith) return 2;

  const contains = terms.some((term) => {
    const termTokens = term.split(/\s+/).filter(Boolean);
    if (termTokens.length > 1) return name.includes(term);
    return tokens.some((token) => token === term);
  });
  if (contains) return 3;

  const similar = terms.some((term) => similarity(name, term) >= 0.72 || name.split(/\s+/).some((token) => similarity(token, term) >= 0.82));
  if (similar) return 4;

  return stepRank === 4 ? 4 : 99;
}

function rankFoods(items, rawQuery, terms, limit) {
  return dedupeByIdOrName(items)
    .map(({ food, stepRank }) => ({
      ...food,
      search_rank: getRank(food, rawQuery, terms, stepRank),
      search_quality_score: getQualityScore(food)
    }))
    .filter((food) => food.search_rank <= 5)
    .sort((a, b) => {
      if (a.search_rank !== b.search_rank) return a.search_rank - b.search_rank;
      if (a.search_quality_score !== b.search_quality_score) return b.search_quality_score - a.search_quality_score;
      return getFoodName(a).localeCompare(getFoodName(b), 'it');
    })
    .slice(0, limit);
}

function getEssentialFallbacks(terms) {
  return ESSENTIAL_FOODS
    .filter((food) => {
      const name = getFoodName(food);
      const tokens = name.split(/\s+/).filter(Boolean);
      return terms.some((term) => name === term || name.startsWith(term) || tokens.some((token) => token.startsWith(term)));
    })
    .map((food) => ({ food, stepRank: 3 }));
}

async function getFoodDatabaseSize() {
  const { count, error } = await supabase
    .from('foods')
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.warn('[FOOD_DATABASE_SIZE_ERROR]', error.message);
    return null;
  }

  console.info('[FOOD_DATABASE_SIZE]');
  console.info('Numero alimenti:', count ?? 0);
  return count ?? 0;
}

async function runFoodQuery(builder, fallbackBuilder = null) {
  const { data, error } = await builder();
  if (!error) return data || [];

  const missingColumn = error.code === '42703' || /column|schema cache/i.test(error.message || '');
  if (missingColumn && fallbackBuilder) {
    console.warn('[SEARCH_SCHEMA_FALLBACK]', error.message);
    const fallback = await fallbackBuilder();
    if (fallback.error) {
      console.error('[SEARCH_FALLBACK_ERROR]', fallback.error);
      return [];
    }
    return fallback.data || [];
  }

  console.error('[SEARCH_STEP_ERROR]', error);
  return [];
}

async function queryExact(term) {
  return runFoodQuery(
    () => supabase.from('foods').select('*, food_nutrients(*)').eq('name', term).limit(SEARCH_FETCH_LIMIT)
  );
}

async function queryCaseInsensitiveExact(term) {
  const safe = escapeLike(term);
  return runFoodQuery(
    () => supabase
      .from('foods')
      .select('*, food_nutrients(*)')
      .or(`name.ilike.${safe},brand.ilike.${safe}`)
      .limit(SEARCH_FETCH_LIMIT),
    () => supabase
      .from('foods')
      .select('*, food_nutrients(*)')
      .ilike('name', safe)
      .limit(SEARCH_FETCH_LIMIT)
  );
}

async function queryPartial(term) {
  const safe = `%${escapeLike(term)}%`;
  return runFoodQuery(
    () => supabase
      .from('foods')
      .select('*, food_nutrients(*)')
      .or(`name.ilike.${safe},brand.ilike.${safe},category.ilike.${safe}`)
      .limit(SEARCH_FETCH_LIMIT),
    () => supabase
      .from('foods')
      .select('*, food_nutrients(*)')
      .ilike('name', safe)
      .limit(SEARCH_FETCH_LIMIT)
  );
}

async function queryFullText(term) {
  const webSearchTerm = escapeOrValue(term);
  return runFoodQuery(
    () => supabase
      .from('foods')
      .select('*, food_nutrients(*)')
      .textSearch('name', webSearchTerm, { type: 'websearch', config: 'italian' })
      .limit(SEARCH_FETCH_LIMIT)
  );
}

async function queryFuzzy(term) {
  const prefix = escapeLike(term.slice(0, Math.min(3, Math.max(2, term.length))));
  if (prefix.length < 2) return [];

  const broadMatches = await runFoodQuery(
    () => supabase
      .from('foods')
      .select('*, food_nutrients(*)')
      .ilike('name', `%${prefix}%`)
      .limit(300)
  );

  return broadMatches.filter((food) => {
    const name = getFoodName(food);
    return similarity(name, term) >= 0.58 || name.split(/\s+/).some((token) => similarity(token, term) >= 0.78 || token.startsWith(term));
  });
}

async function createAiFoodEstimate(query) {
  console.info('[AI_FALLBACK]');
  console.info(true);

  const { data, error } = await supabase.functions.invoke('ai-food-estimate', {
    body: { query }
  });

  if (error) {
    console.error('[AI_FALLBACK_ERROR]', error);
    return [];
  }

  const estimate = data?.food || data?.estimate;
  if (!estimate?.name) return [];

  return [{
    id: `ai-estimate-${Date.now()}`,
    name: estimate.name,
    category: estimate.category || 'Stima AI',
    source: 'AI_ESTIMATE',
    source_id: `ai:${normalizeComparable(query)}`,
    verified: false,
    ai_estimate: true,
    search_rank: 5,
    calories: Number(estimate.calories || 0),
    proteins: Number(estimate.proteins || 0),
    carbs: Number(estimate.carbs || 0),
    fats: Number(estimate.fats || 0),
    fiber: Number(estimate.fiber || 0),
    water: Number(estimate.water || 0),
    food_nutrients: Array.isArray(estimate.food_nutrients) ? estimate.food_nutrients : []
  }];
}

/**
 * Motore di ricerca alimenti multi-step.
 *
 * @param {string} queryStr
 * @param {number} limit
 * @param {{ includeAiFallback?: boolean }} options
 */
export async function searchFoods(queryStr, limit = DEFAULT_LIMIT, options = {}) {
  if (!queryStr || queryStr.trim().length === 0) return [];

  const rawQuery = queryStr.trim();
  const comparableQuery = normalizeComparable(rawQuery);
  const terms = getSearchTerms(rawQuery);
  const isBarcode = /^\d{8,14}$/.test(comparableQuery);

  console.info('[SEARCH_QUERY]');
  console.info(rawQuery);
  await getFoodDatabaseSize();

  if (isBarcode) {
    const data = await runFoodQuery(
      () => supabase
        .from('foods')
        .select('*, food_nutrients(*)')
        .eq('barcode', comparableQuery)
        .limit(1)
    );
    console.info('[STEP1_RESULTS]');
    console.info(data.length);
    console.info('[AI_FALLBACK]');
    console.info(false);
    return data || [];
  }

  const exactTerms = [...new Set([rawQuery, ...terms])];
  const step1 = dedupeByIdOrName((await Promise.all(exactTerms.map(queryExact))).flat());
  console.info('[STEP1_RESULTS]');
  console.info(step1.length);

  const step2 = dedupeByIdOrName((await Promise.all(terms.map(queryCaseInsensitiveExact))).flat());
  console.info('[STEP2_RESULTS]');
  console.info(step2.length);

  const step3 = dedupeByIdOrName((await Promise.all(terms.map(queryPartial))).flat());
  console.info('[STEP3_RESULTS]');
  console.info(step3.length);

  const step4 = dedupeByIdOrName([
    ...(await Promise.all(terms.map(queryFullText))).flat(),
    ...(await Promise.all(terms.map(queryFuzzy))).flat()
  ]);
  console.info('[STEP4_RESULTS]');
  console.info(step4.length);

  const ranked = rankFoods([
    ...step1.map((food) => ({ food, stepRank: 1 })),
    ...step2.map((food) => ({ food, stepRank: 2 })),
    ...step3.map((food) => ({ food, stepRank: 3 })),
    ...step4.map((food) => ({ food, stepRank: 4 })),
    ...getEssentialFallbacks(terms)
  ], comparableQuery, terms, limit);

  if (ranked.length > 0) {
    console.info('[AI_FALLBACK]');
    console.info(false);
    return ranked;
  }

  if (options.includeAiFallback) {
    return createAiFoodEstimate(rawQuery);
  }

  console.info('[AI_FALLBACK]');
  console.info(false);
  return [];
}

export default {
  searchFoods
};
