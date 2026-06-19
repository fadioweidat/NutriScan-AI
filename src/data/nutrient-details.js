export const NUTRIENT_DETAILS = {
  vitamin_a: {
    category: 'Vitamina',
    shortLabel: 'Vit A',
    function: ['Supporta la vista e la salute oculare', 'Contribuisce al sistema immunitario', 'Mantiene la pelle in salute'],
    deficiency: ['Visione notturna ridotta', 'Pelle secca'],
    excess: ['Da monitorare: un eccesso cronico di vitamina A preformata può essere tossico per il fegato']
  },
  vitamin_b1: {
    category: 'Vitamina',
    shortLabel: 'B1',
    function: ['Converte il cibo in energia cellulare', 'Supporta il sistema nervoso'],
    deficiency: ['Stanchezza muscolare', 'Irritabilità', 'Affaticamento cognitivo']
  },
  vitamin_b2: {
    category: 'Vitamina',
    shortLabel: 'B2',
    function: ['Aiuta il metabolismo energetico', 'Supporta la pelle e gli occhi', 'Agisce da antiossidante'],
    deficiency: ['Labbra screpolate', 'Sensibilità alla luce']
  },
  vitamin_b3: {
    category: 'Vitamina',
    shortLabel: 'B3',
    function: ['Essenziale per le reazioni enzimatiche energetiche', 'Aiuta a proteggere il DNA'],
    deficiency: ['Pelle arrossata o desquamata in zone esposte al sole', 'Stanchezza']
  },
  vitamin_b5: {
    category: 'Vitamina',
    shortLabel: 'B5',
    function: ['Sintesi di colesterolo e ormoni', 'Produzione di energia dai grassi'],
    deficiency: ['Rara. Può associarsi a intorpidimento o crampi']
  },
  vitamin_b6: {
    category: 'Vitamina',
    shortLabel: 'B6',
    function: ['Supporta il metabolismo delle proteine', 'Essenziale per i neurotrasmettitori'],
    deficiency: ['Umore altalenante', 'Stanchezza cronica', 'Da monitorare in diete vegane o restrittive']
  },
  vitamin_b7: {
    category: 'Vitamina',
    shortLabel: 'B7',
    function: ['Metabolismo degli acidi grassi', 'Mantiene unghie e capelli forti'],
    deficiency: ['Unghie fragili', 'Perdita di capelli', 'Da monitorare se si consumano uova crude in eccesso']
  },
  vitamin_b9: {
    category: 'Vitamina',
    shortLabel: 'B9',
    function: ['Sintesi del DNA', 'Divisione cellulare (essenziale in gravidanza)'],
    deficiency: ['Stanchezza', 'Debolezza', 'Importante monitoraggio pre-concepimento']
  },
  vitamin_b12: {
    category: 'Vitamina',
    shortLabel: 'B12',
    function: ['Formazione dei globuli rossi', 'Salute dei nervi e funzioni neurologiche'],
    deficiency: ['Senso di formicolio', 'Stanchezza estrema', 'Problemi di memoria', 'Critico da integrare in diete vegane'],
    excess: ['Solitamente sicura in quanto idrosolubile, ma alti dosaggi non sono necessari']
  },
  vitamin_c: {
    category: 'Vitamina',
    shortLabel: 'Vit C',
    function: ['Potente antiossidante', 'Fondamentale per il collagene', 'Migliora l\'assorbimento del ferro'],
    deficiency: ['Gengive che sanguinano facilmente', 'Pelle secca', 'Ripresa lenta da ferite'],
    excess: ['Un eccesso forte da integratori può causare fastidi gastrointestinali temporanei']
  },
  vitamin_d: {
    category: 'Vitamina',
    shortLabel: 'Vit D',
    function: ['Assorbimento del calcio', 'Salute delle ossa', 'Supporto al sistema immunitario'],
    deficiency: ['Debolezza ossea', 'Stanchezza generale', 'Difese immunitarie ridotte in inverno'],
    excess: ['Da monitorare: un eccesso severo da integratori può causare tossicità da calcio']
  },
  vitamin_e: {
    category: 'Vitamina',
    shortLabel: 'Vit E',
    function: ['Protegge le membrane cellulari dai danni', 'Supporta la risposta immunitaria'],
    deficiency: ['Rara. Può essere legata a problemi di malassorbimento dei grassi']
  },
  vitamin_k: {
    category: 'Vitamina',
    shortLabel: 'Vit K',
    function: ['Coagulazione del sangue', 'Salute delle ossa'],
    deficiency: ['Tendenza ai lividi', 'Sanguinamenti lievi', 'Da monitorare se si assumono fluidificanti ematici']
  },
  calcium: {
    category: 'Minerale',
    shortLabel: 'Ca',
    function: ['Struttura di ossa e denti', 'Trasmissione degli impulsi nervosi', 'Contrazione muscolare'],
    deficiency: ['Debolezza ossea nel lungo termine', 'Crampi muscolari'],
    excess: ['Possibile calcificazione eccessiva da integratori, calcoli renali']
  },
  iron: {
    category: 'Minerale',
    shortLabel: 'Fe',
    function: ['Trasporto di ossigeno nel sangue', 'Metabolismo muscolare'],
    deficiency: ['Stanchezza persistente', 'Pallore', 'Respiro corto sotto sforzo'],
    excess: ['Da monitorare: l\'eccesso può depositarsi negli organi interni (es. fegato)']
  },
  magnesium: {
    category: 'Minerale',
    shortLabel: 'Mg',
    function: ['Supporto a oltre 300 enzimi', 'Rilassamento muscolare e del sistema nervoso', 'Produzione di energia'],
    deficiency: ['Fascicolazioni muscolari (es. tic all\'occhio)', 'Crampi notturni', 'Qualità del sonno scarsa'],
    excess: ['Da integratori: possibile effetto lassativo osmotico']
  },
  potassium: {
    category: 'Minerale',
    shortLabel: 'K',
    function: ['Regolazione dei fluidi cellulari', 'Contrazione muscolare e salute cardiaca'],
    deficiency: ['Pressione arteriosa instabile', 'Affaticamento', 'Da monitorare molto in diete Chetogeniche/Low Carb']
  },
  phosphorus: {
    category: 'Minerale',
    shortLabel: 'P',
    function: ['Salute delle ossa in sinergia col calcio', 'Componente strutturale del DNA'],
    deficiency: ['Estremamente rara, presente in molti cibi proteici']
  },
  zinc: {
    category: 'Minerale',
    shortLabel: 'Zn',
    function: ['Funzione immunitaria', 'Salute della pelle', 'Metabolismo del testosterone'],
    deficiency: ['Guarigione lenta', 'Sensibilità alle infezioni', 'Perdita di gusto/olfatto'],
    excess: ['Un forte eccesso può inibire l\'assorbimento del rame']
  },
  copper: {
    category: 'Minerale',
    shortLabel: 'Cu',
    function: ['Formazione di globuli rossi', 'Pigmentazione', 'Sistema nervoso'],
    deficiency: ['Anemia secondaria', 'Stanchezza']
  },
  manganese: {
    category: 'Minerale',
    shortLabel: 'Mn',
    function: ['Cofattore enzimatico', 'Formazione delle ossa', 'Antiossidante intramitocondriale'],
    deficiency: ['Rara']
  },
  selenium: {
    category: 'Minerale',
    shortLabel: 'Se',
    function: ['Salute della tiroide', 'Protezione antiossidante', 'Supporto immunitario'],
    deficiency: ['Funzione tiroidea subottimale', 'Debolezza'],
    excess: ['Da monitorare: eccesso dalle Noci del Brasile o integratori può causare fragilità di unghie/capelli']
  },
  iodine: {
    category: 'Minerale',
    shortLabel: 'I',
    function: ['Produzione di ormoni tiroidei', 'Metabolismo basale'],
    deficiency: ['Sensazione di freddo costante', 'Rallentamento del metabolismo', 'Stanchezza cronica'],
    excess: ['Eccessi improvvisi possono alterare l\'equilibrio tiroideo']
  },
  sodium: {
    category: 'Minerale',
    shortLabel: 'Na',
    function: ['Equilibrio dei liquidi cellulari', 'Trasmissione nervosa', 'Volume ematico'],
    deficiency: ['Mal di testa', 'Debolezza', 'Spesso in Keto/Digiuno per perdita rapida di liquidi'],
    excess: ['Ritenzione idrica', 'Innalzamento pressione arteriosa se cronicamente elevato']
  },
  proteins: {
    category: 'Macronutriente',
    shortLabel: 'Prot',
    function: ['Costruzione e riparazione muscolare', 'Sintesi di ormoni e anticorpi', 'Mantenimento massa magra'],
    deficiency: ['Recupero muscolare lento', 'Fame frequente', 'Perdita di massa magra']
  },
  carbs: {
    category: 'Macronutriente',
    shortLabel: 'Carb',
    function: ['Energia primaria rapida per cervello e muscoli', 'Ripristino del glicogeno'],
    deficiency: ['Possibile annebbiamento mentale in fase di adattamento', 'Stanchezza muscolare esplosiva in allenamento']
  },
  fats: {
    category: 'Macronutriente',
    shortLabel: 'Fat',
    function: ['Sintesi ormonale vitale', 'Assorbimento vitamine A,D,E,K', 'Energia a lento rilascio'],
    deficiency: ['Secchezza pelle', 'Sazietà ridotta']
  },
  fiber: {
    category: 'Fibra',
    shortLabel: 'Fibra',
    function: ['Salute del microbiota intestinale', 'Regolazione della glicemia', 'Sazietà a lungo termine'],
    deficiency: ['Irregolarità intestinale', 'Picchi glicemici post-prandiali'],
    excess: ['Gonfiore temporaneo se introdotta troppo velocemente']
  },
  omega3: {
    category: 'Grassi Essenziali',
    shortLabel: 'Omg-3',
    function: ['Salute cardiovascolare', 'Proprietà anti-infiammatorie sistemiche', 'Salute cerebrale'],
    deficiency: ['Pelle secca', 'Articolazioni rigide', 'Da monitorare se si consuma poco pesce']
  },
  omega6: {
    category: 'Grassi Essenziali',
    shortLabel: 'Omg-6',
    function: ['Struttura cellulare', 'Risposte immunitarie e infiammatorie fisiologiche'],
    deficiency: ['Estremamente rara, dieta moderna è solitamente molto ricca'],
    excess: ['Eccesso rispetto agli Omega-3 può favorire uno stato pro-infiammatorio']
  },
  water: {
    category: 'Idratazione',
    shortLabel: 'H2O',
    function: ['Termoregolazione', 'Trasporto nutrienti', 'Volume ematico', 'Funzionalità renale'],
    deficiency: ['Sete', 'Mal di testa', 'Calo della performance fisica e mentale'],
    excess: ['In casi estremi diluizione degli elettroliti sanguigni']
  },
  calories: {
    category: 'Energia',
    shortLabel: 'Kcal',
    function: ['Bilancio energetico del corpo', 'Mantenimento del peso e delle funzioni vitali'],
    deficiency: ['Calo di peso', 'Perdita di energia e termogenesi'],
    excess: ['Aumento di massa']
  }
};

export const getNutrientDetails = (key) => {
  return NUTRIENT_DETAILS[key] || {
    category: 'Generico',
    shortLabel: key,
    function: ['Informazione non specificata per questo elemento'],
    deficiency: [],
    excess: []
  };
};
