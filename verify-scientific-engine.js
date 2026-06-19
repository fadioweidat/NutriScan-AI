import scientificEngine from './src/lib/engines/scientific-nutrition-engine.js';

console.log("=== STARTING SCIENTIFIC NUTRITION ENGINE VALIDATION ===\n");

let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAILURE: ${message}`);
  }
}

// ----------------------------------------------------
// 1. Ferro + Vitamina C = sinergia riconosciuta
// ----------------------------------------------------
const synIronVitC = scientificEngine.NUTRIENT_SYNERGIES.find(s => s.key === 'ferro_vegetale_vitamina_c');
assert(
  synIronVitC && synIronVitC.type === 'synergy' && synIronVitC.partners.includes('iron') && synIronVitC.partners.includes('vitamin_c'),
  "Sinergia Ferro vegetale + Vitamina C mappata correttamente"
);

// ----------------------------------------------------
// 2. Ferro + Calcio = competizione riconosciuta
// ----------------------------------------------------
const compIronCalc = scientificEngine.NUTRIENT_SYNERGIES.find(s => s.key === 'ferro_calcio');
assert(
  compIronCalc && compIronCalc.type === 'competition' && compIronCalc.partners.includes('iron') && compIronCalc.partners.includes('calcium'),
  "Competizione Ferro ↔ Calcio mappata correttamente"
);

// ----------------------------------------------------
// 3. Ferro eme = 5 stelle
// ----------------------------------------------------
const beefBio = scientificEngine.getBioavailabilityStars('bistecca di manzo', 'iron');
assert(
  beefBio.stars === '★★★★★' && beefBio.rating === 5,
  `Bistecca (manzo) ha 5 stelle per il ferro (eme): ${beefBio.stars}`
);

// ----------------------------------------------------
// 4. Spinaci per ferro = 2 stelle o biodisponibilità bassa
// ----------------------------------------------------
const spinachBio = scientificEngine.getBioavailabilityStars('spinaci cotti', 'iron');
assert(
  spinachBio.stars === '★★☆☆☆' && spinachBio.rating === 2,
  `Spinaci hanno 2 stelle per il ferro (non-eme): ${spinachBio.stars}`
);

// ----------------------------------------------------
// 5. Salmone o spinaci freschi = food quality score alto
// ----------------------------------------------------
const salmonFood = {
  name: 'Salmone selvaggio',
  proteins_g: 20,
  fats_g: 13,
  carbs_g: 0,
  fiber_g: 0,
  food_nutrients: [
    { nutrient_key: 'vitamin_d', amount: 15 },
    { nutrient_key: 'potassium', amount: 360 }
  ]
};
const salmonScore = scientificEngine.calculateFoodQualityScore(salmonFood);
console.log(`Food Quality Score - Salmone: ${salmonScore}`);
assert(
  salmonScore >= 75,
  `Salmone ha un Food Quality Score elevato: ${salmonScore}`
);

// ----------------------------------------------------
// 6. Alimento processato/zuccherato = food quality score più basso
// ----------------------------------------------------
const sweetFood = {
  name: 'Merendina dolce al cioccolato',
  proteins_g: 2,
  fats_g: 15,
  carbs_g: 55,
  fiber_g: 0.5,
  sodium_mg: 450
};
const sweetScore = scientificEngine.calculateFoodQualityScore(sweetFood);
console.log(`Food Quality Score - Merendina: ${sweetScore}`);
assert(
  sweetScore < 40,
  `Merendina dolce ha un Food Quality Score penalizzato: ${sweetScore}`
);

// ----------------------------------------------------
// 7. Calcio scheda educativa contiene fonti, sinergie e inibitori
// ----------------------------------------------------
const calciumSheet = scientificEngine.EDUCATIONAL_SHEETS.calcio;
assert(
  calciumSheet && 
  calciumSheet.fonti.includes('Latticini') && 
  calciumSheet.sinergie.includes('Vitamina D') && 
  calciumSheet.inibitori.includes('Ossalati'),
  "La scheda del Calcio contiene correttamente fonti, sinergie e inibitori"
);

// ----------------------------------------------------
// 8. Vitamina D spiega sole e limiti dell’alimentazione
// ----------------------------------------------------
const vitDSheet = scientificEngine.EDUCATIONAL_SHEETS.vitamina_d;
assert(
  vitDSheet && 
  vitDSheet.funzione.includes('intestinale del calcio') && 
  vitDSheet.biodisponibilita.includes('insufficiente a coprire') && 
  vitDSheet.nota_medica.includes('esposizione solare'),
  "La scheda della Vitamina D descrive correttamente la sintesi solare e i limiti alimentari"
);

// ----------------------------------------------------
// 9. AI context contiene scientificContext
// ----------------------------------------------------
const healthCtx = {
  profile: { diet_type: 'standard' },
  conditions: [],
  medications: [],
  allergies: []
};
const lifestyleCtx = {
  sleep: { quality_score: 5 },
  stress: { stress_level: 2 }
};
const scientificCtx = scientificEngine.generateScientificContext(healthCtx, lifestyleCtx);
assert(
  scientificCtx && Array.isArray(scientificCtx.priorities) && Array.isArray(scientificCtx.activeSynergies),
  "Scientific Context generato correttamente per l'AI con priorità e sinergie active"
);

// ----------------------------------------------------
// 10. Nessun linguaggio diagnostico
// ----------------------------------------------------
let diagnosticWordsFound = false;
const diagnosticKeywords = ['diagnosi', 'cura', 'malattia', 'pericolo', 'clinica', 'prescrizione'];

Object.values(scientificEngine.EDUCATIONAL_SHEETS).forEach(sheet => {
  const text = JSON.stringify(sheet).toLowerCase();
  diagnosticKeywords.forEach(kw => {
    if (text.includes(` ${kw} `) || text.includes(` ${kw},`) || text.includes(` ${kw}.`)) {
      diagnosticWordsFound = true;
      console.warn(`[WARNING] Trovato potenziale termine diagnostico '${kw}' nella scheda di ${sheet.name}`);
    }
  });
});

assert(
  !diagnosticWordsFound,
  "Nessun linguaggio diagnostico o prescrittivo rilevato nelle schede educative"
);

// ----------------------------------------------------
// CONCLUSIONE
// ----------------------------------------------------
console.log("\n=== RISULTATO DEL TEST DI VALIDAZIONE SCIENTIFICA ===");
console.log(`Test Superati: ${testsPassed} / ${totalTests}`);

if (testsPassed === totalTests) {
  console.log("🚀 TUTTI I TEST DI INTELLIGENZA SCIENTIFICA HANNO SUPERATO LA VERIFICA!");
  process.exit(0);
} else {
  console.error("❌ ALCUNI TEST DI VALIDAZIONE SONO FALLITI.");
  process.exit(1);
}
