import { supabase } from './supabase.js';

/**
 * Cerca un prodotto su Open Food Facts tramite Barcode (EAN/UPC).
 * Se lo trova, lo mappa al nostro schema e lo inserisce nel database globale (foods e food_nutrients).
 * 
 * @param {string} barcode 
 * @returns {object|null} Il record del database o null se non trovato
 */
export async function searchOpenFoodFactsByBarcode(barcode) {
  if (!barcode) return null;

  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      headers: {
        'User-Agent': 'NutriScan_AI/1.0 (test)'
      }
    });

    if (!res.ok) {
      console.error("Open Food Facts HTTP Error:", res.status);
      return null;
    }

    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      // Prodotto non trovato su OFF
      return null;
    }

    const p = data.product;
    const n = p.nutriments || {};

    const kcal = parseFloat(n['energy-kcal_100g']) || 0;
    const proteins = parseFloat(n['proteins_100g']) || 0;
    const carbs = parseFloat(n['carbohydrates_100g']) || 0;
    const fats = parseFloat(n['fat_100g']) || 0;
    const fiber = parseFloat(n['fiber_100g']) || 0;
    const water = 0; // OFF raramente lo fornisce direttamente per 100g solidi

    // Se non ci sono macronutrienti fondamentali, scartiamo (dati inutili)
    if (kcal === 0 && proteins === 0 && carbs === 0 && fats === 0) {
      console.warn("OFF Product found but without nutritional data.");
      return null;
    }

    // Costruiamo il record principale
    const foodRecord = {
      name: p.product_name || `Prodotto Sconosciuto (${barcode})`,
      brand: p.brands ? p.brands.split(',')[0].trim() : null,
      category: p.categories ? p.categories.split(',')[0].trim() : null,
      barcode: barcode,
      source: 'OPEN_FOOD_FACTS',
      source_id: p._id || barcode,
      verified: false,
      source_priority: 50,
      nutrient_completeness: 4, // Almeno i 4 macro base
      calories: kcal,
      proteins: proteins,
      carbs: carbs,
      fats: fats,
      fiber: fiber,
      water: water
    };

    // Estraiamo eventuali micronutrienti
    const micronutrients = [];
    const microMap = {
      'calcium_100g': { key: 'calcium', name: 'Calcio', unit: 'mg', multiplier: 1000 },
      'iron_100g': { key: 'iron', name: 'Ferro', unit: 'mg', multiplier: 1000 },
      'vitamin-c_100g': { key: 'vitamin_c', name: 'Vitamina C', unit: 'mg', multiplier: 1000 },
      'vitamin-d_100g': { key: 'vitamin_d', name: 'Vitamina D', unit: 'µg', multiplier: 1000000 },
      'sodium_100g': { key: 'sodium', name: 'Sodio', unit: 'mg', multiplier: 1000 }
    };

    for (const [offKey, def] of Object.entries(microMap)) {
      if (n[offKey] !== undefined) {
        let amt = parseFloat(n[offKey]);
        if (!isNaN(amt) && amt > 0) {
          amt = amt * def.multiplier; // Convert from g to mg/µg based on OFF standard (usually g for everything except vitamins sometimes)
          // Wait, OFF usually gives values in g if the key ends in _100g. 
          // Let's standardise: if the key is calcium_100g, it is in g. *1000 = mg.
          micronutrients.push({
            nutrient_key: def.key,
            nutrient_name: def.name,
            amount: amt,
            unit: def.unit
          });
          foodRecord.nutrient_completeness++;
        }
      }
    }

    // Inseriamo su Supabase per cache globale
    const { data: insertedFood, error: insertError } = await supabase
      .from('foods')
      .insert([foodRecord])
      .select('*, food_nutrients(*)')
      .single();

    if (insertError) {
      console.error("Errore salvataggio OFF in Supabase:", insertError);
      // Se fallisce l'insert (es. permessi RLS, duplice?), ritorniamo l'oggetto mockato 
      // per non bloccare l'UI dell'utente, ma avvisiamo in console
      return { ...foodRecord, food_nutrients: micronutrients, id: 'temp-' + Date.now() };
    }

    // Inseriamo i micronutrienti se presenti
    if (micronutrients.length > 0 && insertedFood) {
      const payload = micronutrients.map(m => ({ ...m, food_id: insertedFood.id }));
      await supabase.from('food_nutrients').insert(payload);
      
      // Aggiorniamo l'oggetto ritornato
      insertedFood.food_nutrients = micronutrients;
    }

    return insertedFood;

  } catch (err) {
    console.error("Error fetching from Open Food Facts:", err);
    return null;
  }
}
