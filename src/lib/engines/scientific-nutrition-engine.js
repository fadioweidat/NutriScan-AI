/**
 * Scientific Nutrition Engine (Phase 2A.6)
 * Completely decoupled from nutrition-engine.js.
 * Encapsulates synergy/competition, bioavailability scores, food quality scores,
 * scientific confidence levels, personal priorities, explainability and nutrient education sheets.
 */

// 1. CONFIDENCE LEVELS
export const CONFIDENCE_LEVELS = {
  HIGH: '🟢 Alta affidabilità',
  MEDIUM: '🟡 Media',
  LIMITED: '🔵 Limitata'
};

// 2. NUTRIENT SYNERGIES & COMPETITIONS
export const NUTRIENT_SYNERGIES = [
  {
    key: 'ferro_vegetale_vitamina_c',
    type: 'synergy',
    partners: ['iron', 'vitamin_c'],
    name: "Ferro non-eme (vegetale) + Vitamina C",
    confidence: CONFIDENCE_LEVELS.HIGH,
    description: "La Vitamina C riduce il ferro vegetale non-eme in ferro ferroso solubile, aumentandone l'assorbimento intestinale fino a 3 volte."
  },
  {
    key: 'calcio_vitamina_d',
    type: 'synergy',
    partners: ['calcium', 'vitamin_d'],
    name: "Calcio + Vitamina D",
    confidence: CONFIDENCE_LEVELS.HIGH,
    description: "La Vitamina D stimola la sintesi dei trasportatori intestinali di calcio, risultando essenziale per la sua corretta fissazione ossea."
  },
  {
    key: 'vitamina_d_magnesio',
    type: 'synergy',
    partners: ['vitamin_d', 'magnesium'],
    name: "Vitamina D + Magnesio",
    confidence: CONFIDENCE_LEVELS.HIGH,
    description: "Il Magnesio funge da cofattore essenziale per gli enzimi epatici e renali che idrossilano e attivano la Vitamina D."
  },
  {
    key: 'ferro_calcio',
    type: 'competition',
    partners: ['iron', 'calcium'],
    name: "Ferro ↔ Calcio",
    confidence: CONFIDENCE_LEVELS.HIGH,
    description: "Il Calcio inibisce l'assorbimento sia del ferro eme che non-eme competendo per i trasportatori a livello della mucosa intestinale. Evitare latticini nello stesso pasto con fonti di ferro."
  },
  {
    key: 'calcio_ossalati',
    type: 'inhibition',
    partners: ['calcium', 'oxalates'],
    name: "Calcio ↔ Ossalati",
    confidence: CONFIDENCE_LEVELS.HIGH,
    description: "Gli ossalati presenti in spinaci, bietole e cioccolato legano il calcio formando sali insolubili (ossalato di calcio) non assorbibili."
  },
  {
    key: 'calcio_fitati',
    type: 'inhibition',
    partners: ['calcium', 'phytates'],
    name: "Calcio ↔ Fitati",
    confidence: CONFIDENCE_LEVELS.HIGH,
    description: "I fitati presenti nella crusca e nei cereali integrali non ammollati formano complessi stabili insolubili con il calcio, bloccandone l'assorbimento."
  },
  {
    key: 'zinco_rame',
    type: 'competition',
    partners: ['zinc', 'copper'],
    name: "Zinco ↔ Rame",
    confidence: CONFIDENCE_LEVELS.HIGH,
    description: "Alti livelli di Zinco stimolano la sintesi intestinale di metallotioneina, una proteina che lega il Rame impedendone l'assorbimento e portando a un potenziale deficit."
  }
];

// 3. BIOAVAILABILITY SCORE DICTIONARY
export function getBioavailabilityStars(foodName, nutrientKey) {
  const name = foodName.toLowerCase();
  const key = nutrientKey.toLowerCase();

  if (key === 'iron') {
    const isHeme = name.includes('carne') || name.includes('manzo') || name.includes('fegato') || name.includes('pollo') || name.includes('tacchino') || name.includes('pesce') || name.includes('salmone') || name.includes('tonno') || name.includes('cozze') || name.includes('vongole') || name.includes('bistecca');
    if (isHeme) {
      return {
        stars: '★★★★★',
        rating: 5,
        reason: "Alta biodisponibilità (Ferro Eme animale). Assorbito direttamente ed efficientemente dall'organismo indipendente dai chelanti dietetici."
      };
    }
    const isNonHeme = name.includes('spinaci') || name.includes('lenticchie') || name.includes('fagioli') || name.includes('ceci') || name.includes('vegetale') || name.includes('integrale') || name.includes('erba');
    if (isNonHeme) {
      return {
        stars: '★★☆☆☆',
        rating: 2,
        reason: "Biodisponibilità bassa (Ferro Non-Eme vegetale). Influenzato negativamente da fitati e tannini. Abbinare a fonti di Vitamina C per triplicare l'assorbimento."
      };
    }
  }

  if (key === 'calcium') {
    if (name.includes('latte') || name.includes('yogurt') || name.includes('mozzarella') || name.includes('formaggio') || name.includes('parmigiano')) {
      return {
        stars: '★★★★☆',
        rating: 4,
        reason: "Buona biodisponibilità. Favorito dal lattosio e da specifici peptidi del latte che mantengono il calcio in soluzione."
      };
    }
    if (name.includes('spinaci') || name.includes('bietole')) {
      return {
        stars: '★☆☆☆☆',
        rating: 1,
        reason: "Biodisponibilità estremamente ridotta a causa dell'alto contenuto di ossalati (il calcio forma composti insolubili)."
      };
    }
    if (name.includes('broccoli') || name.includes('cavolo') || name.includes('verza') || name.includes('rucola')) {
      return {
        stars: '★★★★☆',
        rating: 4,
        reason: "Buona biodisponibilità (50-60%). Nonostante l'origine vegetale, contengono pochissimi ossalati lasciando il calcio libero per l'assorbimento."
      };
    }
    if (name.includes('acqua') || name.includes('minerale')) {
      return {
        stars: '★★★☆☆',
        rating: 3,
        reason: "Biodisponibilità intermedia. I sali di calcio disciolti nell'acqua minerale calcica sono assorbiti in modo simile a quelli del latte."
      };
    }
  }

  if (key === 'vitamin_b12') {
    const isAnimal = name.includes('carne') || name.includes('fegato') || name.includes('pesce') || name.includes('salmone') || name.includes('tonno') || name.includes('uovo') || name.includes('uova') || name.includes('latte') || name.includes('formaggio') || name.includes('yogurt');
    if (isAnimal) {
      return {
        stars: '★★★★★',
        rating: 5,
        reason: "Origine animale naturale. Fonte primaria di vitamina B12 biologicamente attiva."
      };
    }
    return {
      stars: '☆☆☆☆☆',
      rating: 0,
      reason: "Assente. La vitamina B12 non è sintetizzata dai vegetali. Alimenti vegetali non fortificati non contengono B12 attiva."
    };
  }

  if (key === 'vitamin_d') {
    if (name.includes('salmone') || name.includes('sgombro') || name.includes('aringa') || name.includes('funghi')) {
      return {
        stars: '★★★☆☆',
        rating: 3,
        reason: "Assorbibilità discreta, ma le fonti alimentari sono scarse. L'apporto dietetico da solo è quasi sempre insufficiente rispetto al fabbisogno."
      };
    }
    return {
      stars: '★★☆☆☆',
      rating: 2,
      reason: "Sola alimentazione limitata. Ricordare che l'esposizione solare estiva è la principale via di accumulo fisiologico."
    };
  }

  // Default fallback
  return {
    stars: '★★★☆☆',
    rating: 3,
    reason: "Biodisponibilità standard."
  };
}

// 4. FOOD QUALITY SCORE
export function calculateFoodQualityScore(food) {
  if (!food) return 50;

  let score = 50; // base score

  // 1. Density bonuses
  const proteins = Number(food.proteins || food.proteins_g || 0);
  const fiber = Number(food.fiber || food.fiber_g || 0);
  const name = (food.name || '').toLowerCase();

  // Protein density (max 15 pts)
  if (proteins > 0) {
    score += Math.min(15, Math.round(proteins * 1.5));
  }

  // Fiber density (max 15 pts)
  if (fiber > 0) {
    score += Math.min(15, Math.round(fiber * 3));
  }

  // Micronutrients density (max 20 pts)
  if (Array.isArray(food.food_nutrients) && food.food_nutrients.length > 0) {
    score += Math.min(20, food.food_nutrients.length * 5);
  } else {
    // Check if food has manual micronutrient columns in the legacy foods schema
    let microCount = 0;
    const microKeys = ['calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg', 'vitamin_c_mg', 'vitamin_d_mcg'];
    microKeys.forEach(k => {
      if (Number(food[k]) > 0) microCount++;
    });
    score += Math.min(20, microCount * 4);
  }

  // 2. Penalties
  // Saturated fats/added sugars estimation: High carbs, zero fiber (max -15 pts)
  const carbs = Number(food.carbs || food.carbs_g || 0);
  if (carbs > 25 && fiber < 1.5) {
    score -= 15;
  }

  // High Sodium (max -15 pts)
  const sodium = Number(food.sodium || food.sodium_mg || 0);
  if (sodium > 350) {
    score -= 15;
  }

  // Ultra-processed name detection (max -20 pts)
  const processedKeywords = [
    'merendina', 'biscotti', 'patatine', 'zucchero', 'cola', 'soda', 
    'cioccolato al latte', 'würstel', 'sottoaceti', 'snack', 'confezionato', 
    'dolciumi', 'caramelle'
  ];
  if (processedKeywords.some(kw => name.includes(kw))) {
    score -= 20;
  }

  // Cap the score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// 5. EDUCATIONAL MODE DATABASE (EDUCATIONAL SHEETS)
export const EDUCATIONAL_SHEETS = {
  ferro: {
    name: "Ferro",
    funzione: "Costituente dell'emoglobina (trasporto di ossigeno) e della mioglobina, partecipa alla produzione di energia cellulare.",
    fonti: "Carne rossa magra, molluschi (cozze, vongole), fegato, lenticchie, ceci, spinaci, semi di zucca.",
    biodisponibilita: "Eme (animale): alto assorbimento (15-35%). Non-eme (vegetale): basso assorbimento (2-10%).",
    sinergie: "Vitamina C (es. succo di limone, arance, kiwi, peperoni) se consumata nello stesso pasto.",
    inibitori: "Tannini (tè, caffè), fitati (cereali integrali non ammollati), calcio (latticini presi nello stesso pasto).",
    carenza_eccesso: "Carenza: stanchezza cronica, anemia microcitica, ridotta concentrazione. Eccesso: accumulo tissutale (emosiderosi).",
    nota_medica: "Le note fornite sono a scopo puramente informativo ed educativo. In caso di sintomi di anemia o stanchezza prolungata, consultare il medico."
  },
  vitamina_d: {
    name: "Vitamina D",
    funzione: "Regola l'assorbimento intestinale del calcio e del fosforo, fondamentale per l'omeostasi ossea e il sistema immunitario.",
    fonti: "Salmone selvaggio, sgombro, aringa, tuorlo d'uovo, funghi esposti al sole.",
    biodisponibilita: "Discreta negli alimenti grassi, ma l'alimentazione da sola è spesso insufficiente a coprire il fabbisogno fisiologico totale.",
    sinergie: "Magnesio (attiva la vitamina D nei reni/fegato), Calcio (la vitamina D ne permette l'assorbimento).",
    inibitori: "Mancata esposizione solare, obesità (sequestro nel tessuto adiposo), sindromi da malassorbimento.",
    carenza_eccesso: "Carenza: osteomalacia, osteoporosi, fragilità ossea. Eccesso: ipercalcemia, calcificazione dei tessuti molli.",
    nota_medica: "L'esposizione solare è la via principale di accumulo. In caso di carenze documentate da esami del sangue, concordare una terapia di integrazione con il medico."
  },
  vitamina_b12: {
    name: "Vitamina B12",
    funzione: "Indispensabile per la sintesi del DNA, la formazione dei globuli rossi e il corretto funzionamento del sistema nervoso.",
    fonti: "Fegato, vongole, sgombro, carne di manzo, uova, formaggi, latte.",
    biodisponibilita: "Alta negli alimenti animali naturali. Praticamente nulla nei cibi vegetali non fortificati.",
    sinergie: "Acido folico (Vitamina B9), in quanto lavorano insieme nella sintesi cellulare.",
    inibitori: "Uso prolungato di metformina o protettori gastrici (inibitori di pompa protonica che riducono l'acido gastrico).",
    carenza_eccesso: "Carenza: anemia perniciosa, stanchezza estrema, danni neurologici (neuropatia). Eccesso: escreto dai reni (bassa tossicità).",
    nota_medica: "Nelle diete vegane o vegetariane, l'integrazione di B12 attiva è fondamentale. Consultare il medico per programmare i controlli ematici."
  },
  calcio: {
    name: "Calcio",
    funzione: "Principale minerale strutturale delle ossa e dei denti, fondamentale per la contrazione muscolare e la trasmissione nervosa.",
    fonti: "Latticini, acque minerali calciche (>300 mg/L), broccoli, cavolo riccio, mandorle, rucola.",
    biodisponibilita: "Alta nei latticini (30%) e brassicacee (50-60%). Bassissima negli spinaci (<5%) per via degli ossalati.",
    sinergie: "Vitamina D (favorisce l'assorbimento), Vitamina K (fissa il calcio nelle ossa evitando i vasi).",
    inibitori: "Ossalati (spinaci, cioccolato), fitati (crusca), eccesso di sale e caffeina (aumentano l'escrezione renale).",
    carenza_eccesso: "Carenza: riduzione della densità ossea, osteopenia, osteoporosi. Eccesso: calcoli renali, calcificazioni vascolari.",
    nota_medica: "Mantenere un corretto apporto di calcio è importante a tutte le età, ma l'eventuale integrazione va sempre valutata con un medico."
  },
  magnesio: {
    name: "Magnesio",
    funzione: "Cofattore in oltre 300 reazioni enzimatiche, sintesi proteica, controllo glicemico e rilassamento neuromuscolare.",
    fonti: "Mandorle, semi di zucca, spinaci, bietole, cioccolato fondente, fagioli neri, cereali integrali.",
    biodisponibilita: "Intermedia (circa 30-40%). Ridotta in presenza di fitati.",
    sinergie: "Vitamina D (supporta l'attivazione), Vitamina B6 (facilita l'ingresso del magnesio nelle cellule).",
    inibitori: "Eccesso di alcol, abuso di caffè, stress cronico (aumenta le perdite renali di magnesio).",
    carenza_eccesso: "Carenza: crampi muscolari, ansia, stanchezza, aritmie. Eccesso: disturbi gastrointestinali (effetto lassativo).",
    nota_medica: "Il magnesio è un minerale chiave per contrastare lo stress fisico e mentale. Discuterne l'uso con un professionista."
  },
  zinco: {
    name: "Zinco",
    funzione: "Coinvolto nella risposta immunitaria, guarigione delle ferite, sintesi proteica e percezione del gusto.",
    fonti: "Ostriche, carne rossa, semi di zucca, ceci, lenticchie, anacardi, yogurt.",
    biodisponibilita: "Superiore nelle fonti animali, parzialmente inibita dai fitati nei legumi e cereali.",
    sinergie: "Proteine animali (migliorano la solubilità e l'assorbimento dello zinco).",
    inibitori: "Fitati, eccesso di calcio o ferro ad alto dosaggio negli integratori.",
    carenza_eccesso: "Carenza: perdita di capelli, ridotta risposta immunitaria, alterazione del gusto. Eccesso: inibisce l'assorbimento del rame.",
    nota_medica: "Lo zinco è essenziale, ma dosaggi elevati da integratori prolungati possono interferire con altri minerali."
  },
  rame: {
    name: "Rame",
    funzione: "Partecipa alla produzione di energia cellulare, al metabolismo del ferro, alla sintesi del tessuto connettivo e della melanina.",
    fonti: "Fegato, ostriche, cioccolato fondente, anacardi, semi di girasole, lenticchie.",
    biodisponibilita: "Variabile, controllata dal trasportatore intestinale.",
    sinergie: "Ferro (il rame è necessario per l'enzima che trasporta e mobilita il ferro).",
    inibitori: "Dosi elevate di zinco o supplementazione massiccia di Vitamina C.",
    carenza_eccesso: "Carenza: anemia refrattaria al ferro, osteopenia, neutropenia. Eccesso: tossicità epatica (rara da alimenti).",
    nota_medica: "Rame e Zinco devono essere mantenuti in un corretto rapporto di equilibrio."
  },
  potassio: {
    name: "Potassio",
    funzione: "Principale elettrolito intracellulare, regola la pressione sanguigna, l'equilibrio dei liquidi e la funzione cardiaca.",
    fonti: "Banane, patate, spinaci, avocado, melone, fagioli bianchi, salmone.",
    biodisponibilita: "Elevata, assorbito passivamente lungo l'intestino tenue.",
    sinergie: "Sodio (in rapporto corretto per la pompa sodio-potassio cellulare).",
    inibitori: "Uso di lassativi o diuretici (aumentano drasticamente le perdite renali).",
    carenza_eccesso: "Carenza: debolezza muscolare, crampi, stipsi, aritmie cardiache. Eccesso (iperkalemia): aritmie gravi, debolezza.",
    nota_medica: "Attenzione in caso di assunzione di ACE-inibitori o patologie renali. Consultare il medico prima di variare l'apporto."
  },
  omega_3: {
    name: "Omega-3",
    funzione: "Costituenti delle membrane cellulari, antinfiammatori naturali, supportano la salute cardiovascolare e cerebrale.",
    fonti: "Salmone, sgombro, aringhe, noci, semi di lino, semi di chia.",
    biodisponibilita: "Elevata per fonti EPA/DHA animali (pesce). Bassa conversione da ALA (vegetali) a EPA/DHA.",
    sinergie: "Vitamina E (agisce come antiossidante proteggendo gli omega-3 dall'irrancidimento nei tessuti).",
    inibitori: "Eccessivo consumo di omega-6 (competono per gli stessi enzimi di conversione).",
    carenza_eccesso: "Carenza: pelle secca, infiammazione sistemica, deficit cognitivo. Eccesso: modesta fluidificazione sanguigna.",
    nota_medica: "Gli acidi grassi omega-3 supportano la salute di cuore e cervello. Chiedere consiglio al medico per supplementazione."
  },
  fibre: {
    name: "Fibre",
    funzione: "Regolano il transito intestinale, nutrono il microbiota (prebiotici), modulano l'assorbimento di colesterolo e glucosio.",
    fonti: "Legumi, avena, orzo, mele, pere, carciofi, cereali integrali, verdure.",
    biodisponibilita: "Non digerite dall'uomo, fermentate parzialmente dai batteri intestinali.",
    sinergie: "Acqua (le fibre solubili necessitano di acqua per formare il gel viscoso benefico).",
    inibitori: "Consumo a secco (senza idratazione può causare costipazione).",
    carenza_eccesso: "Carenza: stipsi, aumentato rischio cardiovascolare e dislipidemia. Eccesso: gonfiore, ridotto assorbimento di minerali.",
    nota_medica: "Aumentare l'apporto di fibre gradualmente per consentire al microbiota di adattarsi senza gonfiori."
  }
};

// 6. EXPLAINABILITY ENGINE
export function explainRecommendation(nutrientKey, foodName, healthContext) {
  const bio = getBioavailabilityStars(foodName, nutrientKey);
  
  const explanation = {
    why: `Ti consigliamo ${foodName} in quanto costituisce un'ottima fonte di ${nutrientKey.replace(/_/g, ' ')}.`,
    nutrient: nutrientKey,
    bioavailability: bio.stars + " - " + bio.reason,
    boosters: [],
    inhibitors: [],
    caution: "Nessuna cautela alimentare specifica rilevata per la popolazione generale."
  };

  // Add specific details
  if (nutrientKey === 'iron') {
    explanation.boosters.push("Associare ad alimenti ricchi di Vitamina C nello stesso pasto (es. agrumi, limone, peperoni).");
    explanation.inhibitors.push("Evitare il consumo contemporaneo di caffè, tè e latticini (il calcio e i tannini competono o inibiscono l'assorbimento).");
  }

  if (nutrientKey === 'calcium') {
    explanation.boosters.push("Assicurare livelli adeguati di Vitamina D ed esporsi alla luce solare.");
    explanation.inhibitors.push("Attenzione agli ossalati (es. spinaci) e ai fitati (cereali integrali non trattati) che legano il calcio impedendone l'assorbimento.");
  }

  // Cross-reference with medications for caution
  if (healthContext && healthContext.medications) {
    healthContext.medications.forEach(med => {
      const medName = med.medication_name.toLowerCase();
      if (medName.includes('warfarin') && nutrientKey === 'vitamin_k') {
        explanation.caution = "Possibile interazione. Non modificare la terapia senza consultare il medico. Alimenti ad altissimo contenuto di vitamina K possono interferire con il dosaggio del Warfarin.";
      }
      if (medName.includes('levotiroxina') && (nutrientKey === 'calcium' || nutrientKey === 'iron')) {
        explanation.caution = "Possibile interazione. Non modificare la terapia senza consultare il medico. Calcio e Ferro riducono l'assorbimento della levotiroxina. Assumere il farmaco a digiuno lontano da queste fonti.";
      }
      if (medName.includes('metformina') && nutrientKey === 'vitamin_b12') {
        explanation.caution = "Possibile interazione. Non modificare la terapia senza consultare il medico. L'uso cronico di metformina riduce l'assorbimento di Vitamina B12.";
      }
    });
  }

  return explanation;
}

// 7. PERSONAL PRIORITY ENGINE
export function getPersonalPriorities(healthContext, lifestyleContext) {
  const priorities = [];

  const { profile, conditions } = healthContext || {};
  const { sleep, stress } = lifestyleContext || {};

  // 1. Health conditions priorities
  if (conditions && conditions.length > 0) {
    conditions.forEach(cond => {
      const name = cond.condition_name.toLowerCase();
      if (name.includes('diabete')) {
        priorities.push({
          target: 'Fibre',
          reason: "Ottimizzare il controllo glicemico post-prandiale.",
          confidence: CONFIDENCE_LEVELS.HIGH
        });
      }
      if (name.includes('ipertensione')) {
        priorities.push({
          target: 'Potassio e riduzione Sodio',
          reason: "Favorire la vasodilatazione e l'escrezione di sodio per regolare la pressione.",
          confidence: CONFIDENCE_LEVELS.HIGH
        });
      }
      if (name.includes('osteoporosi')) {
        priorities.push({
          target: 'Calcio e Vitamina D',
          reason: "Supportare la ricalcificazione e la salute della matrice ossea.",
          confidence: CONFIDENCE_LEVELS.HIGH
        });
      }
    });
  }

  // 2. Lifestyle priorities
  if (stress && Number(stress.stress_level) >= 6) {
    priorities.push({
      target: 'Magnesio e Vitamina B6',
      reason: "Alleviare la stanchezza fisica e mentale causata da livelli elevati di stress.",
      confidence: CONFIDENCE_LEVELS.MEDIUM
    });
  }

  if (sleep && Number(sleep.quality_score) <= 3) {
    priorities.push({
      target: 'Triptofano / Magnesio',
      reason: "Promuovere il rilassamento muscolare e la sintesi di melatonina per migliorare il riposo.",
      confidence: CONFIDENCE_LEVELS.MEDIUM
    });
  }

  // 3. Diet priority
  const diet = profile?.diet_type || 'standard';
  if (diet === 'vegan' || diet === 'vegana' || diet === 'vegetarian' || diet === 'vegetariana') {
    priorities.push({
      target: 'Vitamina B12',
      reason: "Diete interamente vegetali non contengono fonti attive di B12; monitoraggio indispensabile.",
      confidence: CONFIDENCE_LEVELS.HIGH
    });
  }

  // Default priorities if none found
  if (priorities.length === 0) {
    priorities.push({
      target: 'Densità Micronutrienti',
      reason: "Garantire l'apporto giornaliero ottimale di vitamine e minerali.",
      confidence: CONFIDENCE_LEVELS.HIGH
    });
  }

  return priorities;
}

// 8. COMBINED CONTEXT GENERATION FOR AI
export function generateScientificContext(healthContext, lifestyleContext) {
  const priorities = getPersonalPriorities(healthContext, lifestyleContext);
  
  // Build a summary of synergies
  const activeSynergies = NUTRIENT_SYNERGIES.map(s => ({
    name: s.name,
    description: s.description,
    confidence: s.confidence
  }));

  return {
    priorities,
    activeSynergies,
    confidenceDefinition: CONFIDENCE_LEVELS,
    explain: (nutrientKey, foodName) => explainRecommendation(nutrientKey, foodName, healthContext)
  };
}

export default {
  CONFIDENCE_LEVELS,
  NUTRIENT_SYNERGIES,
  getBioavailabilityStars,
  calculateFoodQualityScore,
  EDUCATIONAL_SHEETS,
  explainRecommendation,
  getPersonalPriorities,
  generateScientificContext
};
