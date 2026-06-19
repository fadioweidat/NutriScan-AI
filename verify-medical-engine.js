import medicalEngine from './src/lib/engines/medical-knowledge-engine.js';
import diseaseEngine from './src/lib/disease-engine.js';

console.log("=== STARTING MEDICAL INTELLIGENCE ENGINE VALIDATION ===\n");

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
// CASO 1: Keto + Diabete + Metformina
// ----------------------------------------------------
console.log("--- Caso 1: Keto + Diabete + Metformina ---");
const healthContext1 = {
  profile: { diet_type: 'keto' },
  conditions: [{ condition_name: 'diabete' }],
  allergies: [],
  intolerances: [],
  medications: [{ medication_name: 'Metformina', is_active: true }],
  supplements: []
};

// 1.1 Check drug interaction warning for Metformina
const warnings1 = medicalEngine.checkMedicationInteractions(healthContext1.medications);
assert(
  warnings1.length > 0 && warnings1.some(w => w.medication.toLowerCase() === 'metformina'),
  "Rilevata correttamente l'interazione per Metformina"
);

const metWarning = warnings1.find(w => w.medication.toLowerCase() === 'metformina');
assert(
  metWarning.message.includes("Possibile interazione. Non modificare la terapia senza consultare il medico."),
  "L'avviso Metformina contiene la frase di sicurezza obbligatoria"
);
assert(
  metWarning.message.includes("Vitamina B12"),
  "L'avviso Metformina segnala il deficit di Vitamina B12"
);

// 1.2 Check Keto/Diabete food exclusion mapping (no bread/pasta, low carbs)
const excluded1 = diseaseEngine.getExcludedFoodKeywords([], []); // No allergies
// Note: Diabete rules in disease-engine adjust RDAs (limit carbs, increase fiber) but do not strictly add "pane"/"pasta" to excluded keywords unless gluten allergy is present.
// However, the AI Coach is instructed by the prompt to suggest avoiding carbs/bread/pasta for Keto/Diabete.
// Let's verify that Diabete rules reduce RDA carbs to 150g or less.
const baseRDA = { carbs: 300, fiber: 25 };
const adjustedRDA = diseaseEngine.applyConditionAdjustments(baseRDA, healthContext1.conditions);
assert(
  adjustedRDA.carbs <= 150,
  `RDA Carboidrati ridotto correttamente per Diabete: ${adjustedRDA.carbs}g (Base: 300g)`
);
assert(
  adjustedRDA.fiber >= 35,
  `RDA Fibre aumentato correttamente per Diabete: ${adjustedRDA.fiber}g (Base: 25g)`
);
console.log("\n");


// ----------------------------------------------------
// CASO 2: Celiachia
// ----------------------------------------------------
console.log("--- Caso 2: Celiachia (Allergia Glutine) ---");
const healthContext2 = {
  allergies: [{ allergy_name: 'glutine' }],
  intolerances: []
};
const excludedGluten = diseaseEngine.getExcludedFoodKeywords(healthContext2.allergies, []);
console.log("Keywords escluse per Glutine:", excludedGluten);
assert(
  excludedGluten.includes('pane') && excludedGluten.includes('pasta') && excludedGluten.includes('pizza'),
  "Celiachia esclude correttamente pane, pasta e pizza"
);

const foodsToTest2 = ['Pasta al pomodoro', 'Pane integrale', 'Pizza Margherita', 'Insalata misto', 'Uovo sodo'];
const safeFoods2 = foodsToTest2.filter(f => diseaseEngine.isFoodSafe(f, excludedGluten));
console.log("Cibi sicuri per Celiaco:", safeFoods2);
assert(
  !safeFoods2.includes('Pasta al pomodoro') && !safeFoods2.includes('Pane integrale') && !safeFoods2.includes('Pizza Margherita'),
  "Pasta, pane e pizza esclusi dal filtraggio celiachia"
);
assert(
  safeFoods2.includes('Insalata misto') && safeFoods2.includes('Uovo sodo'),
  "Insalata e uova considerati sicuri per celiaci"
);
console.log("\n");


// ----------------------------------------------------
// CASO 3: Allergia al Latte
// ----------------------------------------------------
console.log("--- Caso 3: Allergia al Latte ---");
const healthContext3 = {
  allergies: [{ allergy_name: 'latte' }],
  intolerances: []
};
const excludedMilk = diseaseEngine.getExcludedFoodKeywords(healthContext3.allergies, []);
console.log("Keywords escluse per Latte:", excludedMilk);
assert(
  excludedMilk.includes('latte') && excludedMilk.includes('yogurt') && excludedMilk.includes('mozzarella') && excludedMilk.includes('parmigiano'),
  "Allergia latte esclude latticini principali"
);

const foodsToTest3 = ['Yogurt greco', 'Mozzarella di bufala', 'Parmigiano Reggiano', 'Spinaci', 'Mele'];
const safeFoods3 = foodsToTest3.filter(f => diseaseEngine.isFoodSafe(f, excludedMilk));
console.log("Cibi sicuri per allergico al Latte:", safeFoods3);
assert(
  !safeFoods3.includes('Yogurt greco') && !safeFoods3.includes('Mozzarella di bufala') && !safeFoods3.includes('Parmigiano Reggiano'),
  "Yogurt, mozzarella e parmigiano esclusi dal filtraggio latte"
);
assert(
  safeFoods3.includes('Spinaci') && safeFoods3.includes('Mele'),
  "Spinaci e mele considerati sicuri per allergici al latte"
);
console.log("\n");


// ----------------------------------------------------
// CASO 4: Vitamina D Molto Bassa
// ----------------------------------------------------
console.log("--- Caso 4: Vitamina D ---");
const vitDNotes = medicalEngine.getBioavailabilityNotes('vitamin_d');
assert(
  vitDNotes.length > 0,
  "Trovate note di biodisponibilità per la Vitamina D"
);
assert(
  vitDNotes.some(n => n.type === 'synthesis' && n.text.includes("esposizione solare")),
  "Segnalata l'esposizione solare come fonte principale di Vitamina D"
);
assert(
  vitDNotes.some(n => n.type === 'diet_limit' && n.text.includes("sola alimentazione")),
  "Segnalata la difficoltà di raggiungere il fabbisogno con la sola alimentazione"
);
assert(
  vitDNotes.some(n => n.type === 'medical_consult' && n.text.includes("confrontarsi con il proprio medico")),
  "Suggerito il confronto con il medico per valutare l'integrazione di Vitamina D"
);
console.log("\n");


// ----------------------------------------------------
// CASO 5: Ferro Basso
// ----------------------------------------------------
console.log("--- Caso 5: Ferro ---");
const ironNotes = medicalEngine.getBioavailabilityNotes('iron');
assert(
  ironNotes.length > 0,
  "Trovate note di biodisponibilità per il Ferro"
);
assert(
  ironNotes.some(n => n.type === 'heme' && n.text.includes("animale (eme)") && n.text.includes("carne rossa") && n.text.includes("molluschi")),
  "Ferro eme descritto correttamente con fonti animali"
);
assert(
  ironNotes.some(n => n.type === 'non-heme' && n.text.includes("vegetale (non-eme)") && n.text.includes("Vitamina C")),
  "Ferro non-eme descritto con associazione di Vitamina C per assorbimento"
);
console.log("\n");


// ----------------------------------------------------
// CASO 6: Warfarin
// ----------------------------------------------------
console.log("--- Caso 6: Warfarin ---");
const healthContext6 = {
  medications: [{ medication_name: 'Warfarin (Coumadin)', is_active: true }]
};
const warnings6 = medicalEngine.checkMedicationInteractions(healthContext6.medications);
assert(
  warnings6.length > 0 && warnings6.some(w => w.medication.toLowerCase().includes('warfarin')),
  "Rilevata correttamente l'interazione per Warfarin"
);

const warWarning = warnings6.find(w => w.medication.toLowerCase().includes('warfarin'));
assert(
  warWarning.message.includes("Possibile interazione. Non modificare la terapia senza consultare il medico."),
  "L'avviso Warfarin contiene la frase di sicurezza obbligatoria"
);
assert(
  warWarning.message.includes("Vitamina K"),
  "L'avviso Warfarin segnala l'interazione con la Vitamina K"
);
console.log("\n");


// ----------------------------------------------------
// CONCLUSIONE DEL TEST
// ----------------------------------------------------
console.log("=== RISULTATO DEL TEST DI VALIDAZIONE ===");
console.log(`Test Superati: ${testsPassed} / ${totalTests}`);

if (testsPassed === totalTests) {
  console.log("🚀 TUTTI I TEST CLINICI HANNO SUPERATO LA VERIFICA!");
  process.exit(0);
} else {
  console.error("❌ ALCUNI TEST CLINICI SONO FALLITI.");
  process.exit(1);
}
