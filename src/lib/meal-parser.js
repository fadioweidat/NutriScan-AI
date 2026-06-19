const WORD_NUMBERS = {
  'un': 1, 'una': 1, 'uno': 1, 'due': 2, 'tre': 3, 'quattro': 4, 'cinque': 5, 
  'sei': 6, 'sette': 7, 'otto': 8, 'nove': 9, 'dieci': 10, 'mezza': 0.5, 'mezzo': 0.5
};

const STANDARD_WEIGHTS = {
  'uova': 50, 'uovo': 50,
  'banana': 150, 'banane': 150,
  'mela': 150, 'mele': 150,
  'cucchiaio': 15, 'cucchiai': 15,
  'bicchiere': 200, 'bicchieri': 200,
  'porzione': 100, 'porzioni': 100,
  'pz': 100, 'pezzi': 100, 'pezzo': 100,
  'fetta': 30, 'fette': 30,
};

export function parseMealText(text) {
  if (!text) return [];
  
  // Pulisci il testo da preamboli comuni
  let cleanText = text.toLowerCase()
    .replace(/(oggi )?ho mangiato /g, '')
    .replace(/(colazione|pranzo|cena|snack):?/g, '')
    .trim();

  // Split per separatori logici
  const chunks = cleanText.split(/\s+e\s+|\s+ed\s+|\s+con\s+|,|\n|\+/).map(c => c.trim()).filter(Boolean);

  const results = [];

  // Regex per catturare opzionalmente: (Numero) (Unità) (di) (Alimento)
  const regex = /^(\d+(?:[.,]\d+)?|un|una|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|mezza|mezzo)?\s*(g|gr|grammi|kg|pz|pezzi|pezzo|uova|uovo|cucchiaio|cucchiai|bicchiere|bicchieri|porzione|porzioni|fetta|fette)?\s*(?:di\s+|d')?\s*(.*)$/;

  chunks.forEach(chunk => {
    const match = chunk.match(regex);
    if (!match) return;

    let numStr = match[1];
    let unitStr = match[2];
    let foodStr = match[3];

    // Se l'unità è il cibo stesso (es. "2 uova" dove foodStr resta vuoto)
    if (!foodStr && unitStr) {
       foodStr = unitStr;
    }

    let quantity = 1;
    let finalGrams = 100; // default assoluto

    // Converti la stringa numerica in Float
    if (numStr) {
      if (WORD_NUMBERS[numStr]) {
        quantity = WORD_NUMBERS[numStr];
      } else {
        quantity = parseFloat(numStr.replace(',', '.'));
      }
    }

    // Converti l'unità in grammi
    if (unitStr) {
      if (['kg'].includes(unitStr)) {
        finalGrams = quantity * 1000;
      } else if (['g', 'gr', 'grammi'].includes(unitStr)) {
        finalGrams = quantity;
      } else if (STANDARD_WEIGHTS[unitStr]) {
        finalGrams = quantity * STANDARD_WEIGHTS[unitStr];
      }
    } else {
      // Se l'unità è parte del nome (es. "una banana")
      const firstWord = foodStr.split(' ')[0];
      if (STANDARD_WEIGHTS[firstWord]) {
        finalGrams = quantity * STANDARD_WEIGHTS[firstWord];
      } else if (numStr && !['g', 'gr', 'grammi', 'kg'].includes(unitStr)) {
         finalGrams = quantity * 100; // default se c'è un numero ma nessuna unità nota (es. "2 panini")
      }
    }

    if (!foodStr) return; // ignora chunk vuoti
    
    // Pulisci stopwords finali
    foodStr = foodStr.replace(/^(di |d'|un |una |uno )/g, '').trim();
    if (!foodStr) return;

    results.push({
      food: foodStr,
      originalQuantity: quantity,
      originalUnit: unitStr || 'porzione',
      quantityGrams: finalGrams
    });
  });

  return results;
}
