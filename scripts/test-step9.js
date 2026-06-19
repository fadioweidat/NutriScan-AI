import { searchFoods } from '../src/lib/search-engine.js';
import dotenv from 'dotenv';
dotenv.config();

async function testSearches() {
  console.log("--- TEST STEP 9: Ricerca Professionale ---");
  
  const tests = ["banana", "salmon", "rice", "8001234567890"];
  
  for (const q of tests) {
    console.log(`\n> Ricerca: "${q}"`);
    const results = await searchFoods(q, 3);
    
    if (results.length === 0) {
      console.log("  Nessun risultato trovato.");
    } else {
      results.forEach((r, i) => {
        console.log(`  ${i+1}. [${r.source}] ${r.name} (Verificato: ${r.verified}, Nutrienti: ${r.nutrient_completeness}, Priorità: ${r.source_priority})`);
      });
    }
  }
}

testSearches();
