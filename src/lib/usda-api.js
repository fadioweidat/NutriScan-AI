/**
 * NutriScan AI - USDA API Fallback Service
 */

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = import.meta.env.USDA_API_KEY || '';

export function isUSDAConfigured() {
  return API_KEY.length > 0;
}

/**
 * Cerca un alimento tramite nome nel database USDA (Fallback).
 */
export async function searchFood(query, pageSize = 10) {
  if (!query || !query.trim()) return [];
  if (!isUSDAConfigured()) {
    console.warn('USDA_API_KEY mancante. Fallback API disabilitato.');
    return [];
  }

  try {
    const url = `${USDA_BASE_URL}/foods/search?api_key=${API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.trim(),
        pageSize: pageSize,
        dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)']
      })
    });

    if (!response.ok) throw new Error('Errore durante la ricerca USDA');
    const data = await response.json();
    return data.foods || [];
  } catch (error) {
    console.error('Errore searchFood:', error);
    return [];
  }
}

/**
 * Recupera i dettagli nutrizionali di un singolo alimento tramite USDA FDC ID.
 */
export async function getFoodDetails(fdcId) {
  if (!fdcId) return null;
  if (!isUSDAConfigured()) return null;

  try {
    const url = `${USDA_BASE_URL}/food/${fdcId}?api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Errore durante il recupero dei dettagli USDA');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Errore getFoodDetails:', error);
    return null;
  }
}

export default {
  searchFood,
  getFoodDetails,
  isUSDAConfigured
};
