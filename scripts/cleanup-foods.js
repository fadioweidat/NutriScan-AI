import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const args = process.argv.slice(2);
const apply = args.includes('--apply');

// Keywords to flag alcoholic beverages
const ALCOHOL_KEYWORDS = ['alcoholic beverage', 'wine', 'beer', 'liquor', 'alcohol'];

function isAlcohol(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return ALCOHOL_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchAll(table, select = '*') {
  let allData = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + step - 1);
    if (error) {
      console.error(error);
      break;
    }
    allData.push(...data);
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

async function main() {
  console.log('--- DATABASE CLEANUP ---');
  if (!apply) {
    console.log('*** DRY RUN MODE (use --apply to delete) ***');
  } else {
    console.log('!!! APPLY MODE: Deletions will be executed !!!');
  }

  console.log('Fetching foods...');
  const foods = await fetchAll('foods');
  
  console.log('Fetching food nutrients...');
  const foodNutrients = await fetchAll('food_nutrients', 'food_id');
  
  console.log('Fetching meal entries references...');
  const mealEntries = await fetchAll('meal_entries', 'food_id');
  
  const usedFoodIds = new Set(mealEntries.map(m => m.food_id));
  
  const nutrientCountByFood = foodNutrients.reduce((acc, fn) => {
    acc[fn.food_id] = (acc[fn.food_id] || 0) + 1;
    return acc;
  }, {});

  const foodsToRemove = [];
  let skippedInUse = 0;
  let skippedSystem = 0;

  for (const f of foods) {
    if (f.source === 'system') {
      skippedSystem++;
      continue;
    }

    const hasNoNutrients = (nutrientCountByFood[f.id] || 0) === 0;
    const isAlcoholic = isAlcohol(f.name);

    if (hasNoNutrients || isAlcoholic) {
      if (usedFoodIds.has(f.id)) {
        console.log(`[SKIPPED - IN USE] Cannot delete ${f.name} (Used in meal_entries)`);
        skippedInUse++;
      } else {
        foodsToRemove.push({
          id: f.id,
          name: f.name,
          reason: isAlcoholic ? 'Alcoholic' : 'No Nutrients'
        });
      }
    }
  }

  console.log(`\nFound ${foodsToRemove.length} foods to remove.`);
  
  if (foodsToRemove.length > 0) {
    console.log('\nExamples (up to 20):');
    console.table(foodsToRemove.slice(0, 20));

    if (apply) {
      console.log(`\nExecuting deletion of ${foodsToRemove.length} records...`);
      
      const idsToDelete = foodsToRemove.map(f => f.id);
      
      // Delete in chunks to avoid URL too long issues if using REST
      const chunkSize = 100;
      let deletedCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        const chunk = idsToDelete.slice(i, i + chunkSize);
        const { error } = await supabase.from('foods').delete().in('id', chunk);
        if (error) {
          console.error(`Error deleting chunk: ${error.message}`);
          errorCount += chunk.length;
        } else {
          deletedCount += chunk.length;
        }
      }
      
      console.log(`\nSuccessfully deleted: ${deletedCount}`);
      if (errorCount > 0) console.log(`Errors during deletion: ${errorCount}`);
      
    } else {
      console.log('\nRun `node scripts/cleanup-foods.js --apply` to actually delete them.');
    }
  } else {
    console.log('No useless records found. DB is clean!');
  }
}

main();
