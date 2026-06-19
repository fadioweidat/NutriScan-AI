/**
 * Medical Knowledge Engine (Phase 2A.5)
 * Completely decoupled from nutrition-engine.js.
 * Encapsulates bioavailability knowledge, drug-food interactions, evidence levels, and clinical warnings.
 * All logic follows strict non-diagnostic, educational, and safety principles.
 */

// 1. EVIDENCE LEVELS DEFINITIONS
export const EVIDENCE_LEVELS = {
  STRONG: '🟢 Evidenza forte',
  MODERATE: '🟡 Evidenza moderata',
  LIMITED: '🔵 Evidenza limitata'
};

// 2. NUTRIENT EVIDENCE LEVELS MAPPING
// Maps nutrients under specific health goals/conditions to their scientific evidence level
export const NUTRIENT_EVIDENCE = {
  sodium: {
    ipertensione: {
      level: EVIDENCE_LEVELS.STRONG,
      note: "La riduzione del sodio al di sotto dei 1500mg/giorno è fortemente associata alla riduzione della pressione arteriosa."
    }
  },
  potassium: {
    ipertensione: {
      level: EVIDENCE_LEVELS.STRONG,
      note: "Un aumentato apporto di potassio favorisce l'escrezione di sodio e riduce la pressione arteriosa."
    }
  },
  calcium: {
    osteoporosi: {
      level: EVIDENCE_LEVELS.STRONG,
      note: "Il calcio è il costituente minerale fondamentale della matrice ossea."
    }
  },
  vitamin_d: {
    osteoporosi: {
      level: EVIDENCE_LEVELS.STRONG,
      note: "La vitamina D è indispensabile per l'assorbimento intestinale del calcio."
    }
  },
  fiber: {
    diabete: {
      level: EVIDENCE_LEVELS.STRONG,
      note: "Le fibre solubili rallentano l'assorbimento del glucosio, migliorando la risposta glicemica post-prandiale."
    },
    'colesterolo alto': {
      level: EVIDENCE_LEVELS.STRONG,
      note: "Le fibre solubili legano gli acidi biliari nell'intestino, favorendo l'escrezione del colesterolo LDL."
    }
  },
  omega3: {
    diabete: {
      level: EVIDENCE_LEVELS.MODERATE,
      note: "Gli acidi grassi omega-3 supportano la salute cardiovascolare e riducono i trigliceridi negli individui diabetici."
    },
    'colesterolo alto': {
      level: EVIDENCE_LEVELS.MODERATE,
      note: "Gli omega-3 aiutano a modulare il profil lipidico, riducendo in particolare i trigliceridi plasmatici."
    }
  },
  magnesium: {
    diabete: {
      level: EVIDENCE_LEVELS.MODERATE,
      note: "Il magnesio interviene nella sensibilità all'insulina e nel metabolismo del glucosio."
    },
    ipertensione: {
      level: EVIDENCE_LEVELS.MODERATE,
      note: "Il magnesio favorisce il rilassamento della muscolatura liscia vascolare, contribuendo a regolare la pressione."
    }
  },
  iron: {
    anemia: {
      level: EVIDENCE_LEVELS.STRONG,
      note: "Il ferro è il componente essenziale dell'emoglobina per il trasporto di ossigeno nei tessuti."
    }
  },
  vitamin_c: {
    anemia: {
      level: EVIDENCE_LEVELS.STRONG,
      note: "La vitamina C riduce il ferro non-eme (vegetale) a ferro ferroso, aumentandone significativamente la biodisponibilità intestinale."
    }
  }
};

// 3. BIOAVAILABILITY RULES
export const BIOAVAILABILITY_RULES = {
  iron: {
    notes: [
      {
        type: 'heme',
        text: "Il ferro di origine animale (eme), presente in carne rossa, fegato e molluschi, ha una biodisponibilità molto superiore (assorbimento del 15-35%) rispetto a quello vegetale.",
        evidence: EVIDENCE_LEVELS.STRONG
      },
      {
        type: 'non-heme',
        text: "Il ferro di origine vegetale (non-eme), presente in legumi, spinaci e cereali integrali, ha un assorbimento ridotto (2-10%). La Vitamina C aumenta drasticamente l'assorbimento del ferro vegetale se consumati nello stesso pasto (es. aggiungendo limone o consumando agrumi/peperoni). Evitare tè o caffè vicino ai pasti poiché i tannini ne riducono l'assorbimento.",
        evidence: EVIDENCE_LEVELS.STRONG
      }
    ]
  },
  calcium: {
    notes: [
      {
        type: 'dairy',
        text: "Il calcio dei latticini ha un'eccellente biodisponibilità (circa 30%) grazie alla presenza di lattosio e aminoacidi che ne favoriscono l'assorbimento.",
        evidence: EVIDENCE_LEVELS.STRONG
      },
      {
        type: 'mineral_water',
        text: "Le acque minerali ricche di calcio (oltre 150-300 mg/L) offrono una biodisponibilità di calcio paragonabile a quella del latte, costituendo un'ottima fonte priva di calorie.",
        evidence: EVIDENCE_LEVELS.STRONG
      },
      {
        type: 'vegetable',
        text: "Nei vegetali la biodisponibilità varia enormemente: è elevata in cavoli e broccoli (50-60%), ma molto bassa negli spinaci e nelle bietole (meno del 5%) a causa dell'alto contenuto di ossalati, che legano il calcio rendendolo insolubile.",
        evidence: EVIDENCE_LEVELS.STRONG
      }
    ]
  },
  vitamin_b12: {
    notes: [
      {
        type: 'source',
        text: "La vitamina B12 è prodotta esclusivamente da batteri ed è presente quasi unicamente in alimenti di origine animale (carne, pesce, uova, latticini).",
        evidence: EVIDENCE_LEVELS.STRONG
      },
      {
        type: 'vegan_warning',
        text: "Nelle diete rigorosamente vegetariane o vegane, l'apporto da fonti alimentari non fortificate è insufficiente. Si raccomanda di valutare il monitoraggio periodico della vitamina B12 con il proprio medico per pianificare un'integrazione adeguata.",
        evidence: EVIDENCE_LEVELS.STRONG
      }
    ]
  },
  vitamin_d: {
    notes: [
      {
        type: 'synthesis',
        text: "L'esposizione solare (sintesi cutanea guidata dai raggi UVB) è la fonte principale di vitamina D per l'organismo.",
        evidence: EVIDENCE_LEVELS.STRONG
      },
      {
        type: 'diet_limit',
        text: "L'apporto attraverso la sola alimentazione (es. tramite pesci grassi come il salmone, uova o funghi) è limitato ed è spesso difficile raggiungere il fabbisogno giornaliero ottimale.",
        evidence: EVIDENCE_LEVELS.STRONG
      },
      {
        type: 'medical_consult',
        text: "In caso di carenza accertata o ridotta esposizione solare, è consigliato confrontarsi con il proprio medico per valutare l'opportunità di una terapia di integrazione.",
        evidence: EVIDENCE_LEVELS.STRONG
      }
    ]
  }
};

// 4. DRUG-FOOD INTERACTIONS DICTIONARY
// Key: normalized medication name/class. Values: drug-food interactions details.
export const DRUG_INTERACTIONS = {
  statine: {
    drugs: ['atorvastatina', 'simvastatina', 'lovastatina', 'statina', 'statine'],
    interactsWith: 'pompelmo',
    severity: 'Alta',
    message: "Possibile interazione. Non modificare la terapia senza consultare il medico. Il pompelmo (sia frutto che succo) inibisce l'enzima intestinale CYP3A4, aumentando i livelli circolanti del farmaco e il rischio di effetti collaterali (es. miopatia)."
  },
  warfarin: {
    drugs: ['warfarin', 'coumadin'],
    interactsWith: 'vitamina k',
    severity: 'Alta',
    message: "Possibile interazione. Non modificare la terapia senza consultare il medico. Il warfarin è un anticoagulante che agisce come antagonista della vitamina K. Alimenti estremamente ricchi di Vitamina K (es. spinaci, broccoli, cavoli, cime di rapa) possono contrastare l'azione del farmaco. Si raccomanda di mantenere stabile l'apporto giornaliero di tali alimenti."
  },
  levotiroxina: {
    drugs: ['levotiroxina', 'eutirox', 'tiroxina'],
    interactsWith: 'calcio o ferro',
    severity: 'Moderata',
    message: "Possibile interazione. Non modificare la terapia senza consultare il medico. Gli integratori o gli alimenti fortificati ricchi di Calcio o Ferro possono legare la levotiroxina nel tratto gastrointestinale, compromettendone l'assorbimento. Assumere il farmaco a stomaco vuoto ed attendere almeno 4 ore prima di consumare cibi o integratori ricchi di calcio o ferro."
  },
  metformina: {
    drugs: ['metformina', 'glucophage'],
    interactsWith: 'vitamina b12',
    severity: 'Moderata',
    message: "Possibile interazione. Non modificare la terapia senza consultare il medico. L'uso cronico di metformina può ridurre l'assorbimento intestinale della Vitamina B12, aumentando il rischio di anemia o neuropatia a lungo termine. Valutare con il medico il monitoraggio periodico dei livelli di B12 ed un'eventuale integrazione."
  },
  'ace-inibitori': {
    drugs: ['ramipril', 'enalapril', 'lisinopril', 'captopril', 'ace-inibitori', 'ace inibitori'],
    interactsWith: 'potassio',
    severity: 'Moderata',
    message: "Possibile interazione. Non modificare la terapia senza consultare il medico. Gli ACE-inibitori riducono l'escrezione renale di potassio. Un consumo eccessivo di alimenti ricchi di potassio o l'uso di sostituti del sale contenenti potassio può aumentare il rischio di iperkalemia (potassio alto nel sangue)."
  }
};

// 5. HELPER FUNCTIONS

/**
 * Checks if a drug name matches any known medication class in our database
 */
export function checkMedicationInteractions(medications) {
  const activeWarnings = [];
  if (!medications || medications.length === 0) return activeWarnings;

  medications.forEach(med => {
    const medName = med.medication_name.toLowerCase();
    
    // Scan our interactions catalog
    Object.values(DRUG_INTERACTIONS).forEach((interaction) => {
      const match = interaction.drugs.some(d => medName.includes(d));
      if (match) {
        activeWarnings.push({
          medication: med.medication_name,
          interactsWith: interaction.interactsWith,
          severity: interaction.severity,
          message: interaction.message
        });
      }
    });
  });

  return activeWarnings;
}

/**
 * Retrieves bioavailability notes and evidence levels for a given nutrient
 */
export function getBioavailabilityNotes(nutrientKey, dietType = 'standard') {
  const rule = BIOAVAILABILITY_RULES[nutrientKey];
  if (!rule) return [];

  const notes = [...rule.notes];
  
  // Specific check for vegan/vegetarian Vitamin B12 warning
  if (nutrientKey === 'vitamin_b12' && (dietType === 'vegan' || dietType === 'vegetarian' || dietType === 'vegetariana' || dietType === 'vegana')) {
    // Return all, highlighting the vegan warning
    return notes;
  }
  
  // For standard profiles, we might filter out vegan-specific warnings if they are not relevant, 
  // but keeping them in database is good for reference. Let's return them all as they are educational.
  return notes;
}

/**
 * Retrieves evidence note for a nutrient and condition combination
 */
export function getEvidenceNote(nutrientKey, conditionName) {
  const nutrient = NUTRIENT_EVIDENCE[nutrientKey];
  if (!nutrient) return null;

  const normalizedCondition = conditionName.toLowerCase();
  const match = Object.entries(nutrient).find(([key]) => normalizedCondition.includes(key));
  
  if (match) {
    return {
      nutrient: nutrientKey,
      condition: match[0],
      level: match[1].level,
      note: match[1].note
    };
  }
  return null;
}

/**
 * Main function that compiles the whole medical context for a user
 * based on their healthContext (conditions, allergies, medications, etc.)
 */
export function generateMedicalContext(healthContext) {
  if (!healthContext) return null;

  const { profile, conditions, medications } = healthContext;
  const dietType = profile?.diet_type || 'standard';

  // 1. Check drug interactions
  const drugWarnings = checkMedicationInteractions(medications || []);

  // 2. Fetch bioavailability notes for crucial nutrients (Iron, Calcium, B12, Vitamin D)
  const bioavailability = {
    iron: getBioavailabilityNotes('iron', dietType),
    calcium: getBioavailabilityNotes('calcium', dietType),
    vitamin_b12: getBioavailabilityNotes('vitamin_b12', dietType),
    vitamin_d: getBioavailabilityNotes('vitamin_d', dietType)
  };

  // 3. Collect evidence notes for the user's active conditions
  const evidenceNotes = [];
  if (conditions && conditions.length > 0) {
    conditions.forEach(cond => {
      Object.keys(NUTRIENT_EVIDENCE).forEach(nutrientKey => {
        const note = getEvidenceNote(nutrientKey, cond.condition_name);
        if (note) {
          evidenceNotes.push(note);
        }
      });
    });
  }

  // 4. Clinical food constraints (Preferred vs To Limit) based on conditions
  const foodPriorities = {
    preferred: [],
    toLimit: []
  };

  if (conditions && conditions.length > 0) {
    conditions.forEach(cond => {
      const name = cond.condition_name.toLowerCase();
      if (name.includes('diabete')) {
        foodPriorities.preferred.push("Ortaggi a foglia verde, legumi (con moderazione), cereali integrali, pesce azzurro (magnesio, omega-3, fibre).");
        foodPriorities.toLimit.push("Pane bianco, pasta di semola raffinata, pizze tradizionali, zuccheri semplici.");
      }
      if (name.includes('ipertensione')) {
        foodPriorities.preferred.push("Banane, spinaci, patate dolci, avocado (fonti di potassio), mandorle, semi di zucca (magnesio).");
        foodPriorities.toLimit.push("Cibi in scatola, insaccati, formaggi stagionati, snack salati (eccesso di sodio).");
      }
      if (name.includes('colesterolo')) {
        foodPriorities.preferred.push("Avena, orzo, legumi (fibre solubili), noci, semi di lino, salmone (omega-3).");
        foodPriorities.toLimit.push("Carni grasse, burro, formaggi grassi, cibi ultra-processati (grassi saturi e idrogenati).");
      }
      if (name.includes('anemia')) {
        foodPriorities.preferred.push("Carne rossa magra, fegato, molluschi (ferro eme altamente biodisponibile), abbinati a succo di limone o kiwi (vitamina C).");
        foodPriorities.toLimit.push("Tè nero, tè verde, caffè e latticini consumati in concomitanza dei pasti principali (riducono l'assorbimento del ferro).");
      }
      if (name.includes('osteoporosi')) {
        foodPriorities.preferred.push("Latticini a basso contenuto di grassi, acque minerali calciche (>300 mg/L), broccoli, cavolo riccio.");
        foodPriorities.toLimit.push("Eccesso di sale, caffeina e bevande gassate contenenti acido fosforico (possono favorire la perdita di calcio osseo).");
      }
    });
  }

  return {
    drugWarnings,
    bioavailability,
    evidenceNotes,
    foodPriorities
  };
}

export default {
  EVIDENCE_LEVELS,
  NUTRIENT_EVIDENCE,
  BIOAVAILABILITY_RULES,
  DRUG_INTERACTIONS,
  checkMedicationInteractions,
  getBioavailabilityNotes,
  getEvidenceNote,
  generateMedicalContext
};
