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

async function main() {
  console.log('--- DATABASE CHECK ---');

  // Check Foods per Source
  const sources = ['system', 'USDA', 'OPEN_FOOD_FACTS', 'CREA'];
  const sourceCounts = {};
  let totalFoods = 0;

  for (const src of sources) {
    const { count, error } = await supabase
      .from('foods')
      .select('*', { count: 'exact', head: true })
      .eq('source', src);
    
    if (!error && count > 0) {
      sourceCounts[src] = count;
      totalFoods += count;
    }
  }

  console.log('Foods per source:');
  console.table(sourceCounts);
  console.log(`Total Foods: ${totalFoods}`);

  // Check Food Nutrients Total
  const { count: nutrientsCount, error: nutrientsError } = await supabase
    .from('food_nutrients')
    .select('*', { count: 'exact', head: true });

  if (nutrientsError) {
    console.error('Error fetching nutrients count:', nutrientsError);
  } else {
    console.log(`Total Food Nutrients: ${nutrientsCount}`);
  }

  console.log('----------------------');
}

main();
