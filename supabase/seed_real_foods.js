import process from 'process';
import { createClient } from '@supabase/supabase-js';
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

// Real test foods according to Step 1 requirements
const REAL_FOODS = [
  {
    name: 'Uova (intere, crude)',
    category: 'uova',
    calories_per_100g: 143,
    proteins_g: 12.56,
    fats_g: 9.51,
    carbs_g: 0.72,
    fiber_g: 0,
    vitamin_a_mcg: 160,
    vitamin_d_mcg: 2,
    vitamin_b12_mcg: 0.89,
    calcium_mg: 56,
    iron_mg: 1.75,
    source: 'USDA',
    usda_fdc_id: 171287,
    is_custom: false
  },
  {
    name: 'Salmone (crudo)',
    category: 'pesce',
    calories_per_100g: 208,
    proteins_g: 20.42,
    fats_g: 13.42,
    carbs_g: 0,
    fiber_g: 0,
    vitamin_d_mcg: 16,
    vitamin_b12_mcg: 3.2,
    selenium_mcg: 36.5,
    omega_3_g: 2.5,
    source: 'USDA',
    usda_fdc_id: 175167,
    is_custom: false
  },
  {
    name: 'Mandorle (crude)',
    category: 'frutta secca',
    calories_per_100g: 579,
    proteins_g: 21.15,
    fats_g: 49.93,
    carbs_g: 21.55,
    fiber_g: 12.5,
    vitamin_e_mg: 25.6,
    magnesium_mg: 270,
    calcium_mg: 269,
    source: 'USDA',
    usda_fdc_id: 170567,
    is_custom: false
  },
  {
    name: 'Banana (cruda)',
    category: 'frutta',
    calories_per_100g: 89,
    proteins_g: 1.09,
    fats_g: 0.33,
    carbs_g: 22.84,
    fiber_g: 2.6,
    vitamin_c_mg: 8.7,
    potassium_mg: 358,
    source: 'USDA',
    usda_fdc_id: 173944,
    is_custom: false
  },
  {
    name: 'Spinaci (crudi)',
    category: 'verdura',
    calories_per_100g: 23,
    proteins_g: 2.86,
    fats_g: 0.39,
    carbs_g: 3.63,
    fiber_g: 2.2,
    vitamin_a_mcg: 469,
    vitamin_c_mg: 28.1,
    vitamin_k_mcg: 482.9,
    iron_mg: 2.71,
    source: 'USDA',
    usda_fdc_id: 168462,
    is_custom: false
  },
  {
    name: 'Yogurt greco (intero, bianco)',
    category: 'latticini',
    calories_per_100g: 97,
    proteins_g: 9.0,
    fats_g: 5.0,
    carbs_g: 3.98,
    fiber_g: 0,
    calcium_mg: 100,
    vitamin_b12_mcg: 0.75,
    source: 'USDA',
    usda_fdc_id: 328800,
    is_custom: false
  },
  {
    name: 'Pollo (petto, crudo)',
    category: 'carne',
    calories_per_100g: 120,
    proteins_g: 22.5,
    fats_g: 2.62,
    carbs_g: 0,
    fiber_g: 0,
    vitamin_b3_mg: 11.2,
    vitamin_b6_mg: 0.6,
    source: 'USDA',
    usda_fdc_id: 171077,
    is_custom: false
  },
  {
    name: 'Riso (bianco, crudo)',
    category: 'cereali',
    calories_per_100g: 365,
    proteins_g: 7.13,
    fats_g: 0.66,
    carbs_g: 79.95,
    fiber_g: 1.3,
    vitamin_b1_mg: 0.07,
    iron_mg: 0.8,
    source: 'USDA',
    usda_fdc_id: 169756,
    is_custom: false
  }
];

async function seedRealFoods() {
  console.log(`Starting seed of ${REAL_FOODS.length} real test foods...`);
  let successCount = 0;
  let errorCount = 0;

  for (const food of REAL_FOODS) {
    const { error } = await supabase
      .from('foods')
      .upsert(food, { onConflict: 'usda_fdc_id' });

    if (error) {
      console.error(`Error inserting ${food.name}:`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`Seed complete. Success: ${successCount}, Errors: ${errorCount}`);
}

seedRealFoods();
