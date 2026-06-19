import process from 'process';
import { createClient } from '@supabase/supabase-js';
import { FOOD_DATABASE } from '../src/lib/foodDatabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFoods() {
  console.log(`Starting seed of ${FOOD_DATABASE.length} foods...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const food of FOOD_DATABASE) {
    const foodEntry = {
      name: food.name,
      category: food.category,
      calories_per_100g: food.calories || 0,
      proteins_g: food.proteins || 0,
      fats_g: food.fats || 0,
      carbs_g: food.carbs || 0,
      fiber_g: food.fiber || 0,
      
      // Vitamins
      vitamin_a_mcg: food.vitamins?.vitamin_a || 0,
      vitamin_c_mg: food.vitamins?.vitamin_c || 0,
      vitamin_d_mcg: food.vitamins?.vitamin_d || 0,
      vitamin_e_mg: food.vitamins?.vitamin_e || 0,
      vitamin_k_mcg: food.vitamins?.vitamin_k || 0,
      vitamin_b1_mg: food.vitamins?.vitamin_b1 || 0,
      vitamin_b2_mg: food.vitamins?.vitamin_b2 || 0,
      vitamin_b3_mg: food.vitamins?.vitamin_b3 || 0,
      vitamin_b5_mg: food.vitamins?.vitamin_b5 || 0,
      vitamin_b6_mg: food.vitamins?.vitamin_b6 || 0,
      vitamin_b7_mcg: food.vitamins?.vitamin_b7 || 0,
      vitamin_b12_mcg: food.vitamins?.vitamin_b12 || 0,
      folate_mcg: food.vitamins?.folate || 0,
      
      // Minerals
      calcium_mg: food.minerals?.calcium || 0,
      iron_mg: food.minerals?.iron || 0,
      magnesium_mg: food.minerals?.magnesium || 0,
      phosphorus_mg: food.minerals?.phosphorus || 0,
      potassium_mg: food.minerals?.potassium || 0,
      sodium_mg: food.minerals?.sodium || 0,
      zinc_mg: food.minerals?.zinc || 0,
      selenium_mcg: food.minerals?.selenium || 0,
      copper_mg: food.minerals?.copper || 0,
      manganese_mg: food.minerals?.manganese || 0,
      iodine_mcg: food.minerals?.iodine || 0,
      
      // Others
      omega_3_g: food.others?.omega_3 || 0,
      omega_6_g: food.others?.omega_6 || 0,
      water_g: food.others?.water || 0,

      source: 'local_seed',
      is_custom: false
    };

    const { error } = await supabase
      .from('foods')
      .insert(foodEntry);

    if (error) {
      console.error(`Error inserting ${food.name}:`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`Seed complete. Success: ${successCount}, Errors: ${errorCount}`);
}

seedFoods();
