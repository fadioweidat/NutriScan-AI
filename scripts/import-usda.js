import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const usdaApiKey = process.env.USDA_API_KEY || 'DEMO_KEY';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1] || 100;
const offsetArg = args.find(a => a.startsWith('--offset='))?.split('=')[1] || 0;
const batchSizeArg = args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || 100;
const isDryRun = args.includes('--dry-run');

const TOTAL_LIMIT = parseInt(limitArg, 10);
const START_OFFSET = parseInt(offsetArg, 10);
const BATCH_SIZE = parseInt(batchSizeArg, 10);

// Keywords to flag alcoholic beverages
const ALCOHOL_KEYWORDS = ['alcoholic beverage', 'wine', 'beer', 'liquor', 'alcohol'];

function isAlcohol(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return ALCOHOL_KEYWORDS.some(kw => lower.includes(kw));
}

// USDA Nutrient ID mapping to NutriScan keys
const USDA_NUTRIENT_MAP = {
  1008: 'calories',
  1003: 'proteins',
  1005: 'carbs',
  1004: 'fats',
  1079: 'fiber',
  1051: 'water',
  1087: 'calcium',
  1089: 'iron',
  1090: 'magnesium',
  1091: 'phosphorus',
  1092: 'potassium',
  1095: 'zinc',
  1098: 'copper',
  1101: 'manganese',
  1103: 'selenium',
  1162: 'vitamin_c',
  1165: 'vitamin_b1',
  1166: 'vitamin_b2',
  1167: 'vitamin_b3',
  1170: 'vitamin_b5',
  1175: 'vitamin_b6',
  1177: 'vitamin_b9',
  1178: 'vitamin_b12',
  1106: 'vitamin_a',
  1110: 'vitamin_d',
  1109: 'vitamin_e',
  1185: 'vitamin_k'
};

async function fetchUSDABatch(pageNumber, pageSize) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}`;
  const body = {
    query: "*",
    dataType: ["Foundation", "SR Legacy"],
    pageSize: pageSize,
    pageNumber: pageNumber
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`USDA API Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.foods || [];
}

function processFoodData(usdaFood) {
  const foodRecord = {
    name: usdaFood.description,
    brand: usdaFood.brandOwner || null,
    category: usdaFood.foodCategory || null,
    barcode: usdaFood.gtinUpc || null,
    source: 'USDA',
    source_id: usdaFood.fdcId.toString(),
    verified: true,
    source_priority: 4,
    nutrient_completeness: usdaFood.foodNutrients.length,
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    water: 0
  };

  const micronutrients = [];

  usdaFood.foodNutrients.forEach(n => {
    const key = USDA_NUTRIENT_MAP[n.nutrientId];
    if (key) {
      const amount = parseFloat(n.value) || 0;
      if (['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water'].includes(key)) {
        foodRecord[key] = amount;
      } else {
        micronutrients.push({
          nutrient_key: key,
          nutrient_name: n.nutrientName,
          amount: amount,
          unit: n.unitName
        });
      }
    }
  });

  return { foodRecord, micronutrients };
}

async function main() {
  console.log(`Starting USDA Import. Target Limit: ${TOTAL_LIMIT}, Batch Size: ${BATCH_SIZE}`);
  if (isDryRun) console.log('*** DRY RUN MODE ***');

  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let missingNutrients = 0;
  
  const totalBatches = Math.ceil(TOTAL_LIMIT / BATCH_SIZE);

  for (let batch = 0; batch < totalBatches; batch++) {
    const currentOffset = START_OFFSET + (batch * BATCH_SIZE);
    const pageNumber = Math.floor(currentOffset / BATCH_SIZE) + 1;
    // For the last batch, request only the remainder if TOTAL_LIMIT is not a multiple of BATCH_SIZE
    const requestSize = Math.min(BATCH_SIZE, TOTAL_LIMIT - (batch * BATCH_SIZE));
    
    console.log(`\n--- Batch ${batch + 1}/${totalBatches} (Page ${pageNumber}, Size ${requestSize}) ---`);

    let foods;
    try {
      foods = await fetchUSDABatch(pageNumber, requestSize);
      console.log(`> Fetched ${foods.length} items from USDA API`);
    } catch (err) {
      console.error(`> Batch ${batch + 1} Failed fetching from API:`, err.message);
      totalErrors++;
      continue; // Continue with next batch
    }

    if (foods.length === 0) {
      console.log('> No more foods returned by API. Ending.');
      break;
    }

    // Process all foods in memory first
    const itemsToInsert = foods.map(f => processFoodData(f));

    // Dedup via Supabase querying source_id
    const sourceIds = itemsToInsert.map(i => i.foodRecord.source_id);
    let existingIds = new Set();
    
    if (!isDryRun && sourceIds.length > 0) {
      const { data: existing, error: dupError } = await supabase
        .from('foods')
        .select('source_id')
        .eq('source', 'USDA')
        .in('source_id', sourceIds);
      
      if (!dupError && existing) {
        existingIds = new Set(existing.map(e => e.source_id));
      }
    }

    let batchImported = 0;
    let batchSkipped = 0;
    let batchErrors = 0;
    let batchSkippedAlcohol = 0;
    let batchSkippedNoNutrients = 0;

    for (const item of itemsToInsert) {
      const { foodRecord, micronutrients } = item;

      if (existingIds.has(foodRecord.source_id)) {
        batchSkipped++;
        totalSkipped++;
        continue;
      }

      if (isAlcohol(foodRecord.name)) {
        batchSkippedAlcohol++;
        continue;
      }

      if (micronutrients.length === 0) {
        missingNutrients++;
        batchSkippedNoNutrients++;
        continue;
      }

      if (isDryRun) {
        batchImported++;
        totalImported++;
        continue;
      }

      // Insert food record
      const { data: insertedFood, error: foodError } = await supabase
        .from('foods')
        .insert([foodRecord])
        .select()
        .single();

      if (foodError) {
        batchErrors++;
        totalErrors++;
        console.error(`> Error inserting ${foodRecord.name}:`, foodError.message);
        continue;
      }

      // Insert micronutrients
      if (micronutrients.length > 0 && insertedFood) {
        const payload = micronutrients.map(m => ({
          ...m,
          food_id: insertedFood.id
        }));

        const { error: microError } = await supabase
          .from('food_nutrients')
          .insert(payload);

        if (microError) {
          console.warn(`> Warning: Could not insert nutrients for ${foodRecord.name}:`, microError.message);
        }
      }

      batchImported++;
      totalImported++;
    }

    console.log(`> Batch Results: ${batchImported} imported, ${batchSkipped} skipped (dups), ${batchSkippedAlcohol} skipped (alcohol), ${batchSkippedNoNutrients} skipped (no nutrients), ${batchErrors} errors`);
  }

  console.log('\n=============================');
  console.log('       IMPORT COMPLETE       ');
  console.log('=============================');
  console.log(`Total limit requested : ${TOTAL_LIMIT}`);
  console.log(`Total successfully in : ${totalImported}`);
  console.log(`Total skipped (dups)  : ${totalSkipped}`);
  console.log(`Total failed (errors) : ${totalErrors}`);
  console.log(`Foods lacking ntrints : ${missingNutrients}`);
  console.log('=============================');
}

main();
