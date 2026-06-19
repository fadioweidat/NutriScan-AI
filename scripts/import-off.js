import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const barcodeArg = args.find(a => a.startsWith('--barcode='))?.split('=')[1];
const isDryRun = args.includes('--dry-run');

if (!limitArg && !barcodeArg) {
  console.error('Please specify either --limit=100 or --barcode=XYZ');
  process.exit(1);
}

// Map OFF nutrients to our keys
const OFF_NUTRIENT_MAP = {
  'energy-kcal_100g': 'calories',
  'proteins_100g': 'proteins',
  'carbohydrates_100g': 'carbs',
  'fat_100g': 'fats',
  'fiber_100g': 'fiber',
  'calcium_100g': 'calcium',
  'iron_100g': 'iron',
  'magnesium_100g': 'magnesium',
  'potassium_100g': 'potassium',
  'zinc_100g': 'zinc',
  'copper_100g': 'copper',
  'manganese_100g': 'manganese',
  'selenium_100g': 'selenium',
  'vitamin-a_100g': 'vitamin_a',
  'vitamin-c_100g': 'vitamin_c',
  'vitamin-d_100g': 'vitamin_d',
  'vitamin-e_100g': 'vitamin_e',
  'vitamin-k_100g': 'vitamin_k',
  'vitamin-b1_100g': 'vitamin_b1',
  'vitamin-b2_100g': 'vitamin_b2',
  'vitamin-b6_100g': 'vitamin_b6',
  'vitamin-b9_100g': 'vitamin_b9',
  'vitamin-b12_100g': 'vitamin_b12',
  'pantothenic-acid_100g': 'vitamin_b5'
};

async function fetchProducts() {
  if (barcodeArg) {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcodeArg}.json`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 1 && data.product) {
      return [data.product];
    } else {
      console.error(`Product not found for barcode: ${barcodeArg}`);
      return [];
    }
  } else {
    // Fetch a generic list of products with high completeness if possible
    const limit = parseInt(limitArg, 10);
    const url = `https://world.openfoodfacts.org/api/v2/search?sort_by=unique_scans_n&page_size=${limit}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.products || [];
  }
}

function processProduct(product) {
  if (!product.product_name) return null;

  const foodRecord = {
    name: product.product_name,
    brand: product.brands ? product.brands.split(',')[0].trim() : null,
    category: product.categories ? product.categories.split(',')[0].trim() : null,
    barcode: product.code || null,
    source: 'OPEN_FOOD_FACTS',
    source_id: product._id || product.code,
    verified: false,
    source_priority: 50,
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    water: 0
  };

  const micronutrients = [];
  let completenessCount = 0;

  if (product.nutriments) {
    Object.keys(OFF_NUTRIENT_MAP).forEach(offKey => {
      if (product.nutriments[offKey] !== undefined) {
        const value = parseFloat(product.nutriments[offKey]) || 0;
        const myKey = OFF_NUTRIENT_MAP[offKey];
        
        if (['calories', 'proteins', 'carbs', 'fats', 'fiber'].includes(myKey)) {
          foodRecord[myKey] = value;
          completenessCount++;
        } else if (value > 0) {
          micronutrients.push({
            nutrient_key: myKey,
            nutrient_name: myKey.replace('_', ' ').toUpperCase(),
            amount: value,
            unit: offKey.includes('kcal') ? 'kcal' : (product.nutriments[`${myKey}_unit`] || 'mg')
          });
          completenessCount++;
        }
      }
    });
  }

  foodRecord.nutrient_completeness = completenessCount;

  return { foodRecord, micronutrients };
}

async function main() {
  console.log('Starting Open Food Facts Import...');
  if (isDryRun) console.log('*** DRY RUN MODE ***');

  const products = await fetchProducts();
  console.log(`> Fetched ${products.length} products from Open Food Facts.`);

  const itemsToInsert = products.map(p => processProduct(p)).filter(Boolean);

  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let missingNutrients = 0;

  // Dedup Check
  const sourceIds = itemsToInsert.map(i => i.foodRecord.source_id);
  const barcodes = itemsToInsert.map(i => i.foodRecord.barcode).filter(Boolean);
  
  let existingIds = new Set();
  let existingBarcodes = new Set();

  if (!isDryRun && (sourceIds.length > 0 || barcodes.length > 0)) {
    const orClauses = [];
    if (sourceIds.length > 0) orClauses.push(`source_id.in.(${sourceIds.join(',')})`);
    if (barcodes.length > 0) orClauses.push(`barcode.in.(${barcodes.join(',')})`);

    const { data: existing, error: dupError } = await supabase
      .from('foods')
      .select('source_id, barcode')
      .or(orClauses.join(','));

    if (!dupError && existing) {
      existing.forEach(e => {
        if (e.source_id) existingIds.add(e.source_id);
        if (e.barcode) existingBarcodes.add(e.barcode);
      });
    }
  }

  for (const item of itemsToInsert) {
    const { foodRecord, micronutrients } = item;

    if (existingIds.has(foodRecord.source_id) || (foodRecord.barcode && existingBarcodes.has(foodRecord.barcode))) {
      totalSkipped++;
      continue;
    }

    if (foodRecord.calories === 0 && foodRecord.proteins === 0 && foodRecord.carbs === 0 && foodRecord.fats === 0) {
      missingNutrients++;
    }

    if (isDryRun) {
      totalImported++;
      continue;
    }

    const { data: insertedFood, error: foodError } = await supabase
      .from('foods')
      .insert([foodRecord])
      .select()
      .single();

    if (foodError) {
      totalErrors++;
      console.error(`> Error inserting ${foodRecord.name}:`, foodError.message);
      continue;
    }

    if (micronutrients.length > 0 && insertedFood) {
      const payload = micronutrients.map(m => ({
        ...m,
        food_id: insertedFood.id
      }));

      await supabase.from('food_nutrients').insert(payload);
    }

    totalImported++;
  }

  console.log('\n=============================');
  console.log('       OFF IMPORT COMPLETE   ');
  console.log('=============================');
  console.log(`Total fetched        : ${products.length}`);
  console.log(`Total successfully in: ${totalImported}`);
  console.log(`Total skipped (dups) : ${totalSkipped}`);
  console.log(`Total failed (errors): ${totalErrors}`);
  console.log(`Foods lacking macros : ${missingNutrients}`);
  console.log('=============================');
}

main();
