import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { findDuplicateFoods } from '../src/lib/food-normalizer.js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching foods for duplicate analysis...');
  const { data: foods, error } = await supabase.from('foods').select('*');
  if (error) {
    console.error('Error fetching foods:', error);
    process.exit(1);
  }

  console.log(`Found ${foods.length} foods. Analyzing...`);
  
  const duplicateReport = [];
  const checkedIds = new Set();

  for (const food of foods) {
    if (checkedIds.has(food.id)) continue;

    // Filter out the current food
    const others = foods.filter(f => f.id !== food.id && !checkedIds.has(f.id));
    const duplicates = findDuplicateFoods(food, others, 0.85);

    if (duplicates.length > 0) {
      const dups = duplicates.map(d => ({
        id: d.food.id,
        name: d.food.name,
        score: (d.score * 100).toFixed(1) + '%'
      }));
      
      duplicateReport.push({
        target: { id: food.id, name: food.name },
        duplicates: dups
      });

      // Mark as checked to avoid reverse reports
      duplicates.forEach(d => checkedIds.add(d.food.id));
    }
  }

  console.log('\n--- DUPLICATE REPORT ---');
  if (duplicateReport.length === 0) {
    console.log('Nessun potenziale duplicato trovato nel database attuale.');
  } else {
    console.log(`Trovati ${duplicateReport.length} gruppi di potenziali duplicati:`);
    duplicateReport.forEach((g, i) => {
      console.log(`\nGruppo ${i + 1}:`);
      console.log(`  Base: [${g.target.id}] ${g.target.name}`);
      g.duplicates.forEach(d => {
        console.log(`  Possibile Duplicato: [${d.id}] ${d.name} (Somiglianza: ${d.score})`);
      });
    });
  }
}

main();
