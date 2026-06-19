/**
 * Recipe Engine (Phase 4)
 * Contains the static database of recipes and helpers for filtering.
 */

export const RECIPES = [
  {
    id: 'frittata_erbe',
    name: 'Frittata al Formaggio ed Erbe',
    diet_types: ['keto', 'cheto', 'chetogenica', 'vegetariana', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'osteoporosi'],
    excluded_ingredients: ['uova', 'uovo', 'latte', 'formaggio', 'parmigiano'],
    calories: 280,
    proteins: 18,
    carbs: 2,
    fats: 22,
    fiber: 0.5,
    vitamins: { a: 120, c: 2, d: 2.5, b12: 1.2 },
    minerals: { iron: 1.8, calcium: 150, sodium: 320, potassium: 180, magnesium: 15, zinc: 1.1, copper: 0.08 },
    prep_time: 15,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Uova', amount: '3 pz', weight_g: 150, category: 'Uova' },
      { name: 'Formaggio Parmigiano', amount: '20 g', weight_g: 20, category: 'Latticini' },
      { name: 'Burro', amount: '10 g', weight_g: 10, category: 'Latticini' },
      { name: 'Erba cipollina', amount: '5 g', weight_g: 5, category: 'Verdura' }
    ],
    instructions: 'Sbattere le uova con il parmigiano. Scaldare il burro in una padella, versare il composto e cuocere a fuoco lento. Guarnire con erba cipollina.'
  },
  {
    id: 'salmone_forno',
    name: 'Salmone al Forno con Rosmarino',
    diet_types: ['keto', 'cheto', 'chetogenica', 'carnivore', 'carnivora', 'mediterranea', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia', 'anemia', 'osteoporosi'],
    excluded_ingredients: ['pesce', 'salmone'],
    calories: 290,
    proteins: 28,
    carbs: 0,
    fats: 20,
    fiber: 0,
    vitamins: { a: 40, c: 0, d: 15, b12: 4.8 },
    minerals: { iron: 0.9, calcium: 20, sodium: 110, potassium: 450, magnesium: 30, zinc: 0.8, copper: 0.05 },
    prep_time: 20,
    difficulty: 'Facile',
    cost: 'Medio',
    ingredients: [
      { name: 'Salmone fresco', amount: '150 g', weight_g: 150, category: 'Pesce' },
      { name: 'Olio d\'oliva', amount: '10 ml', weight_g: 10, category: 'Latticini' }, // category: Latticini / Condimenti
      { name: 'Rosmarino', amount: '2 g', weight_g: 2, category: 'Spezie' }
    ],
    instructions: 'Disporre il salmone su una teglia, spennellare con olio, aggiungere rosmarino e sale. Cuocere in forno a 180°C per 15-20 minuti.'
  },
  {
    id: 'bistecca_burro',
    name: 'Bistecca di Manzo al Burro',
    diet_types: ['keto', 'cheto', 'chetogenica', 'carnivore', 'carnivora', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'anemia'],
    excluded_ingredients: ['manzo', 'carne', 'burro', 'latte'],
    calories: 410,
    proteins: 35,
    carbs: 0,
    fats: 30,
    fiber: 0,
    vitamins: { a: 30, c: 0, d: 0.2, b12: 2.8 },
    minerals: { iron: 3.2, calcium: 15, sodium: 220, potassium: 380, magnesium: 25, zinc: 4.5, copper: 0.12 },
    prep_time: 15,
    difficulty: 'Medio',
    cost: 'Alto',
    ingredients: [
      { name: 'Bistecca di Manzo', amount: '180 g', weight_g: 180, category: 'Carne' },
      { name: 'Burro', amount: '15 g', weight_g: 15, category: 'Latticini' }
    ],
    instructions: 'Cuocere la bistecca in una padella caldissima per 3-4 minuti per lato. Aggiungere il burro a fine cottura ed irrorare la carne.'
  },
  {
    id: 'zuppa_lenticchie',
    name: 'Zuppa di Lenticchie e Zenzero',
    diet_types: ['vegana', 'vegan', 'vegetariana', 'mediterranea', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia', 'anemia'],
    excluded_ingredients: ['lenticchie', 'fagioli', 'legumi'],
    calories: 210,
    proteins: 12,
    carbs: 32,
    fats: 4,
    fiber: 9,
    vitamins: { a: 150, c: 8, d: 0, b12: 0 },
    minerals: { iron: 4.2, calcium: 40, sodium: 180, potassium: 510, magnesium: 45, zinc: 1.8, copper: 0.25 },
    prep_time: 35,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Lenticchie secche', amount: '70 g', weight_g: 70, category: 'Legumi' },
      { name: 'Carota', amount: '50 g', weight_g: 50, category: 'Verdura' },
      { name: 'Sedano', amount: '30 g', weight_g: 30, category: 'Verdura' },
      { name: 'Zenzero fresco', amount: '5 g', weight_g: 5, category: 'Spezie' }
    ],
    instructions: 'Sciacquare le lenticchie. Soffriggere carota e sedano, aggiungere lo zenzero grattugiato e le lenticchie. Coprire con acqua e bollire per 30 minuti.'
  },
  {
    id: 'insalata_quinoa',
    name: 'Insalata Vegana Quinoa ed Avocado',
    diet_types: ['vegana', 'vegan', 'vegetariana', 'mediterranea', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia'],
    excluded_ingredients: [],
    calories: 240,
    proteins: 6,
    carbs: 22,
    fats: 14,
    fiber: 7,
    vitamins: { a: 80, c: 15, d: 0, b12: 0 },
    minerals: { iron: 2.1, calcium: 30, sodium: 10, potassium: 420, magnesium: 60, zinc: 1.2, copper: 0.15 },
    prep_time: 20,
    difficulty: 'Facile',
    cost: 'Medio',
    ingredients: [
      { name: 'Quinoa', amount: '60 g', weight_g: 60, category: 'Cereali' },
      { name: 'Avocado', amount: '80 g', weight_g: 80, category: 'Frutta' },
      { name: 'Pomodorini', amount: '50 g', weight_g: 50, category: 'Verdura' },
      { name: 'Succo di Limone', amount: '10 ml', weight_g: 10, category: 'Bevande' }
    ],
    instructions: 'Lessare la quinoa. Tagliare l\'avocado e i pomodorini. Mescolare il tutto e condire con succo di limone e un filo d\'olio.'
  },
  {
    id: 'pollo_limone',
    name: 'Petto di Pollo Grigliato al Limone',
    diet_types: ['keto', 'cheto', 'chetogenica', 'carnivore', 'carnivora', 'mediterranea', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia', 'anemia', 'insufficienza renale'],
    excluded_ingredients: ['pollo', 'carne'],
    calories: 170,
    proteins: 30,
    carbs: 1,
    fats: 5,
    fiber: 0,
    vitamins: { a: 10, c: 5, d: 0.1, b12: 0.5 },
    minerals: { iron: 1.1, calcium: 15, sodium: 90, potassium: 330, magnesium: 28, zinc: 1.2, copper: 0.06 },
    prep_time: 15,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Petto di Pollo', amount: '150 g', weight_g: 150, category: 'Carne' },
      { name: 'Limone', amount: '1 pz', weight_g: 50, category: 'Frutta' },
      { name: 'Olio d\'oliva', amount: '5 ml', weight_g: 5, category: 'Spezie' }
    ],
    instructions: 'Marinare il pollo con limone e spezie. Grigliare su una piastra ben calda per 5 minuti per lato.'
  },
  {
    id: 'pancake_banana',
    name: 'Pancake Proteici alla Banana',
    diet_types: ['vegetariana', 'low carb', 'standard'],
    applicable_conditions: ['ipertensione'],
    excluded_ingredients: ['uova', 'avena', 'glutine'],
    calories: 210,
    proteins: 15,
    carbs: 25,
    fats: 6,
    fiber: 4,
    vitamins: { a: 50, c: 6, d: 1.2, b12: 0.6 },
    minerals: { iron: 1.5, calcium: 80, sodium: 120, potassium: 450, magnesium: 40, zinc: 0.9, copper: 0.10 },
    prep_time: 15,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Banana', amount: '1 pz', weight_g: 100, category: 'Frutta' },
      { name: 'Uova', amount: '2 pz', weight_g: 100, category: 'Uova' },
      { name: 'Crusca di Avena', amount: '20 g', weight_g: 20, category: 'Cereali' }
    ],
    instructions: 'Schiacciare la banana e amalgamarla con le uova e la crusca. Cuocere a cucchiaiate in una padella antiaderente bollente.'
  },
  {
    id: 'tonno_fagiolini',
    name: 'Tonno e Fagiolini all\'Insalata',
    diet_types: ['keto', 'cheto', 'chetogenica', 'mediterranea', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia', 'anemia', 'osteoporosi'],
    excluded_ingredients: ['pesce', 'tonno'],
    calories: 210,
    proteins: 24,
    carbs: 5,
    fats: 10,
    fiber: 3,
    vitamins: { a: 90, c: 12, d: 5, b12: 2.2 },
    minerals: { iron: 2.1, calcium: 65, sodium: 190, potassium: 410, magnesium: 35, zinc: 1.3, copper: 0.11 },
    prep_time: 15,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Tonno in scatola al naturale', amount: '100 g', weight_g: 100, category: 'Pesce' },
      { name: 'Fagiolini lessati', amount: '100 g', weight_g: 100, category: 'Verdura' },
      { name: 'Olio d\'oliva', amount: '10 ml', weight_g: 10, category: 'Spezie' }
    ],
    instructions: 'Mescolare il tonno sgocciolato con i fagiolini bolliti. Condire con olio e sale.'
  },
  {
    id: 'tofu_broccoli',
    name: 'Tofu Saltato con Broccoli e Mandorle',
    diet_types: ['vegana', 'vegan', 'vegetariana', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia', 'osteoporosi'],
    excluded_ingredients: ['soia', 'tofu', 'mandorle', 'frutta a guscio'],
    calories: 200,
    proteins: 14,
    carbs: 8,
    fats: 12,
    fiber: 5,
    vitamins: { a: 110, c: 65, d: 0, b12: 0 },
    minerals: { iron: 2.8, calcium: 210, sodium: 50, potassium: 390, magnesium: 70, zinc: 1.5, copper: 0.18 },
    prep_time: 20,
    difficulty: 'Facile',
    cost: 'Medio',
    ingredients: [
      { name: 'Tofu fresco', amount: '120 g', weight_g: 120, category: 'Legumi' },
      { name: 'Broccoli', amount: '100 g', weight_g: 100, category: 'Verdura' },
      { name: 'Mandorle affettate', amount: '15 g', weight_g: 15, category: 'Frutta' }
    ],
    instructions: 'Tagliare il tofu a cubetti e saltarlo in padella. Lessare brevemente i broccoli e unirli al tofu. Cospargere con mandorle tostate.'
  },
  {
    id: 'brodo_ossa',
    name: 'Brodo di Ossa di Manzo',
    diet_types: ['keto', 'cheto', 'chetogenica', 'carnivore', 'carnivora', 'low carb'],
    applicable_conditions: ['diabete', 'anemia', 'osteoporosi'],
    excluded_ingredients: ['carne', 'manzo'],
    calories: 60,
    proteins: 10,
    carbs: 0,
    fats: 2,
    fiber: 0,
    vitamins: { a: 0, c: 0, d: 0, b12: 0.4 },
    minerals: { iron: 0.5, calcium: 25, sodium: 280, potassium: 120, magnesium: 10, zinc: 0.4, copper: 0.02 },
    prep_time: 120,
    difficulty: 'Medio',
    cost: 'Basso',
    ingredients: [
      { name: 'Ossa di Manzo', amount: '200 g', weight_g: 200, category: 'Carne' },
      { name: 'Acqua', amount: '500 ml', weight_g: 500, category: 'Bevande' }
    ],
    instructions: 'Bollire le ossa di manzo in abbondante acqua a fuoco lento per diverse ore.'
  },
  {
    id: 'uova_burro_carnivore',
    name: 'Uova al Tegamino con Burro Chiarificato',
    diet_types: ['keto', 'cheto', 'chetogenica', 'carnivore', 'carnivora', 'low carb'],
    applicable_conditions: ['diabete', 'anemia', 'osteoporosi'],
    excluded_ingredients: ['uova', 'uovo', 'burro', 'latte'],
    calories: 280,
    proteins: 13,
    carbs: 0.5,
    fats: 25,
    fiber: 0,
    vitamins: { a: 140, c: 0, d: 2.1, b12: 1.0 },
    minerals: { iron: 1.6, calcium: 40, sodium: 180, potassium: 130, magnesium: 12, zinc: 1.0, copper: 0.07 },
    prep_time: 10,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Uova', amount: '2 pz', weight_g: 100, category: 'Uova' },
      { name: 'Burro chiarificato', amount: '15 g', weight_g: 15, category: 'Latticini' }
    ],
    instructions: 'Fondere il burro chiarificato nel tegamino, adagiare le uova e cuocere fino alla densità desiderata.'
  },
  {
    id: 'caprese_premium',
    name: 'Insalata Caprese Premium',
    diet_types: ['keto', 'cheto', 'chetogenica', 'vegetariana', 'mediterranea', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'osteoporosi'],
    excluded_ingredients: ['mozzarella', 'latte', 'formaggio'],
    calories: 190,
    proteins: 10,
    carbs: 3,
    fats: 15,
    fiber: 1,
    vitamins: { a: 95, c: 8, d: 0.3, b12: 0.7 },
    minerals: { iron: 0.4, calcium: 180, sodium: 210, potassium: 220, magnesium: 18, zinc: 0.9, copper: 0.04 },
    prep_time: 10,
    difficulty: 'Facile',
    cost: 'Medio',
    ingredients: [
      { name: 'Mozzarella di bufala', amount: '80 g', weight_g: 80, category: 'Latticini' },
      { name: 'Pomodoro ramato', amount: '100 g', weight_g: 100, category: 'Verdura' },
      { name: 'Olio d\'oliva', amount: '10 ml', weight_g: 10, category: 'Spezie' }
    ],
    instructions: 'Affettare mozzarella e pomodoro. Alternare le fette su un piatto, aggiungere basilico e un filo d\'olio d\'oliva.'
  },
  {
    id: 'crema_zucca_ceci',
    name: 'Crema di Zucca e Ceci',
    diet_types: ['vegana', 'vegan', 'vegetariana', 'mediterranea', 'standard'],
    applicable_conditions: ['ipertensione', 'colesterolo alto', 'ipercolesterolemia', 'anemia'],
    excluded_ingredients: ['ceci', 'legumi'],
    calories: 190,
    proteins: 8,
    carbs: 28,
    fats: 5,
    fiber: 6,
    vitamins: { a: 420, c: 14, d: 0, b12: 0 },
    minerals: { iron: 2.5, calcium: 55, sodium: 120, potassium: 440, magnesium: 32, zinc: 1.1, copper: 0.15 },
    prep_time: 30,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Zucca decorticata', amount: '150 g', weight_g: 150, category: 'Verdura' },
      { name: 'Ceci lessati', amount: '80 g', weight_g: 80, category: 'Legumi' },
      { name: 'Olio d\'oliva', amount: '5 ml', weight_g: 5, category: 'Spezie' }
    ],
    instructions: 'Cuocere la zucca a cubetti con acqua, frullarla e unire i ceci bolliti interi. Condire con olio.'
  },
  {
    id: 'uova_spinaci',
    name: 'Uova al Tegamino con Spinaci',
    diet_types: ['keto', 'cheto', 'chetogenica', 'vegetariana', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'anemia', 'osteoporosi'],
    excluded_ingredients: ['uova', 'uovo'],
    calories: 170,
    proteins: 14,
    carbs: 2,
    fats: 12,
    fiber: 2,
    vitamins: { a: 280, c: 18, d: 2.1, b12: 1.1 },
    minerals: { iron: 2.9, calcium: 90, sodium: 190, potassium: 380, magnesium: 45, zinc: 1.3, copper: 0.10 },
    prep_time: 15,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Uova', amount: '2 pz', weight_g: 100, category: 'Uova' },
      { name: 'Spinaci freschi', amount: '80 g', weight_g: 80, category: 'Verdura' },
      { name: 'Olio d\'oliva', amount: '5 ml', weight_g: 5, category: 'Spezie' }
    ],
    instructions: 'Saltare gli spinaci in padella con un filo d\'olio, aggiungere le uova sopra e incoperchiare per cuocere l\'albume.'
  },
  {
    id: 'sgombro_pepe',
    name: 'Sgombro Scottato al Pepe Nero',
    diet_types: ['keto', 'cheto', 'chetogenica', 'carnivore', 'carnivora', 'mediterranea', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia', 'anemia', 'osteoporosi'],
    excluded_ingredients: ['pesce', 'sgombro'],
    calories: 250,
    proteins: 22,
    carbs: 0,
    fats: 18,
    fiber: 0,
    vitamins: { a: 30, c: 0, d: 8, b12: 4.2 },
    minerals: { iron: 1.4, calcium: 30, sodium: 160, potassium: 320, magnesium: 28, zinc: 1.0, copper: 0.08 },
    prep_time: 15,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Sgombro filetto', amount: '120 g', weight_g: 120, category: 'Pesce' },
      { name: 'Pepe nero', amount: '2 g', weight_g: 2, category: 'Spezie' }
    ],
    instructions: 'Scottare lo sgombro sulla griglia ben calda sul lato della pelle per 4 minuti, poi girare per altri 2 minuti. Salare e pepare.'
  },
  {
    id: 'smoothie_fragola',
    name: 'Smoothie Proteico alla Fragola',
    diet_types: ['vegana', 'vegan', 'vegetariana', 'low carb', 'keto', 'cheto', 'chetogenica'],
    applicable_conditions: ['ipertensione'],
    excluded_ingredients: [],
    calories: 160,
    proteins: 20,
    carbs: 8,
    fats: 5,
    fiber: 3,
    vitamins: { a: 15, c: 35, d: 1.0, b12: 1.5 },
    minerals: { iron: 1.2, calcium: 110, sodium: 90, potassium: 280, magnesium: 30, zinc: 0.7, copper: 0.06 },
    prep_time: 5,
    difficulty: 'Facile',
    cost: 'Medio',
    ingredients: [
      { name: 'Fragole', amount: '80 g', weight_g: 80, category: 'Frutta' },
      { name: 'Bevanda alla mandorla', amount: '200 ml', weight_g: 200, category: 'Bevande' },
      { name: 'Proteine isolate di pisello', amount: '20 g', weight_g: 20, category: 'Cereali' }
    ],
    instructions: 'Frullare tutti gli ingredienti in un mixer fino a ottenere un composto liscio ed omogeneo.'
  },
  {
    id: 'merluzzo_zucchine',
    name: 'Merluzzo al Vapore con Zucchine',
    diet_types: ['mediterranea', 'low carb', 'keto', 'cheto', 'chetogenica', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia', 'insufficienza renale'],
    excluded_ingredients: ['pesce', 'merluzzo'],
    calories: 130,
    proteins: 22,
    carbs: 4,
    fats: 3,
    fiber: 2,
    vitamins: { a: 20, c: 10, d: 1.5, b12: 1.8 },
    minerals: { iron: 0.7, calcium: 30, sodium: 120, potassium: 390, magnesium: 25, zinc: 0.8, copper: 0.04 },
    prep_time: 20,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Filetto di Merluzzo', amount: '120 g', weight_g: 120, category: 'Pesce' },
      { name: 'Zucchine', amount: '100 g', weight_g: 100, category: 'Verdura' },
      { name: 'Olio d\'oliva', amount: '5 ml', weight_g: 5, category: 'Spezie' }
    ],
    instructions: 'Cuocere a vapore il merluzzo insieme alle zucchine affettate per circa 15 minuti. Condire con olio a crudo.'
  },
  {
    id: 'hummus_cetrioli',
    name: 'Hummus di Ceci con Cetrioli',
    diet_types: ['vegana', 'vegan', 'vegetariana', 'mediterranea', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia'],
    excluded_ingredients: ['ceci', 'legumi'],
    calories: 190,
    proteins: 6,
    carbs: 20,
    fats: 10,
    fiber: 5,
    vitamins: { a: 10, c: 6, d: 0, b12: 0 },
    minerals: { iron: 1.8, calcium: 50, sodium: 180, potassium: 250, magnesium: 35, zinc: 1.1, copper: 0.12 },
    prep_time: 15,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Ceci precotti', amount: '100 g', weight_g: 100, category: 'Legumi' },
      { name: 'Cetriolo fresco', amount: '100 g', weight_g: 100, category: 'Verdura' },
      { name: 'Salsa Tahina', amount: '15 g', weight_g: 15, category: 'Spezie' }
    ],
    instructions: 'Frullare i ceci con la tahina, limone e poca acqua. Servire la crema fredda accompagnata da bastoncini di cetriolo.'
  },
  {
    id: 'tacchino_asparagi',
    name: 'Petto di Tacchino con Asparagi',
    diet_types: ['keto', 'cheto', 'chetogenica', 'carnivore', 'carnivora', 'mediterranea', 'low carb', 'standard'],
    applicable_conditions: ['diabete', 'ipertensione', 'colesterolo alto', 'ipercolesterolemia', 'anemia'],
    excluded_ingredients: ['tacchino', 'carne'],
    calories: 170,
    proteins: 26,
    carbs: 2,
    fats: 6,
    fiber: 2,
    vitamins: { a: 60, c: 15, d: 0.1, b12: 0.8 },
    minerals: { iron: 1.4, calcium: 25, sodium: 95, potassium: 360, magnesium: 26, zinc: 1.8, copper: 0.08 },
    prep_time: 20,
    difficulty: 'Facile',
    cost: 'Basso',
    ingredients: [
      { name: 'Petto di Tacchino', amount: '130 g', weight_g: 130, category: 'Carne' },
      { name: 'Asparagi freschi', amount: '100 g', weight_g: 100, category: 'Verdura' },
      { name: 'Olio d\'oliva', amount: '5 ml', weight_g: 5, category: 'Spezie' }
    ],
    instructions: 'Cuocere gli asparagi a vapore. Scottare le fette di tacchino in padella ed impiattare con un filo d\'olio.'
  },
  {
    id: 'risotto_funghi',
    name: 'Risotto Integrale ai Funghi',
    diet_types: ['vegana', 'vegan', 'vegetariana', 'mediterranea', 'standard'],
    applicable_conditions: ['ipertensione', 'colesterolo alto', 'ipercolesterolemia'],
    excluded_ingredients: [],
    calories: 260,
    proteins: 7,
    carbs: 45,
    fats: 6,
    fiber: 4,
    vitamins: { a: 5, c: 2, d: 1.5, b12: 0 },
    minerals: { iron: 1.9, calcium: 30, sodium: 140, potassium: 380, magnesium: 45, zinc: 1.4, copper: 0.18 },
    prep_time: 40,
    difficulty: 'Medio',
    cost: 'Medio',
    ingredients: [
      { name: 'Riso integrale', amount: '70 g', weight_g: 70, category: 'Cereali' },
      { name: 'Funghi champignon', amount: '80 g', weight_g: 80, category: 'Verdura' },
      { name: 'Olio d\'oliva', amount: '5 ml', weight_g: 5, category: 'Spezie' }
    ],
    instructions: 'Tostare il riso con olio e cipolla. Aggiungere i funghi ed acqua bollente poco alla volta fino a cottura.'
  }
];

export function getRecipesByDiet(dietType) {
  const type = (dietType || 'standard').toLowerCase();
  return RECIPES.filter(r => r.diet_types.includes(type));
}

export function filterRecipes(recipes, { allergies = [], intolerances = [], conditions = [] }) {
  const excludedKeywords = new Set();
  
  // Collect excluded allergy keywords
  const ALLERGY_MAP = {
    'latte': ['latte', 'formaggio', 'mozzarella', 'parmigiano', 'burro', 'yogurt'],
    'uova': ['uovo', 'uova'],
    'pesce': ['pesce', 'salmone', 'tonno', 'sgombro', 'merluzzo'],
    'glutine': ['glutine', 'avena', 'pane', 'pasta']
  };

  allergies.concat(intolerances).forEach(a => {
    const name = a.toLowerCase();
    const map = ALLERGY_MAP[name] || [name];
    map.forEach(kw => excludedKeywords.add(kw));
  });

  return recipes.filter(r => {
    // 1. Check allergies/intolerances
    const lowerName = r.name.toLowerCase();
    const hasAllergen = Array.from(excludedKeywords).some(kw => 
      lowerName.includes(kw) || r.excluded_ingredients.some(ex => ex.toLowerCase().includes(kw))
    );
    if (hasAllergen) return false;

    // 2. Check strict celiachia condition vs gluten ingredients
    const isCeliac = conditions.some(c => c.toLowerCase().includes('celia'));
    if (isCeliac) {
      const glutenKws = ['pane', 'pasta', 'pizza', 'farina', 'avena', 'orzo', 'farro', 'glutine'];
      const hasGluten = glutenKws.some(kw => 
        lowerName.includes(kw) || r.excluded_ingredients.some(ex => ex.toLowerCase().includes(kw))
      );
      if (hasGluten) return false;
    }

    return true;
  });
}

export default {
  RECIPES,
  getRecipesByDiet,
  filterRecipes
};
