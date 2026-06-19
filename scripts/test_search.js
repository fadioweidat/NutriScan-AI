import { normalizeFoodName } from '../src/lib/food-normalizer.js';

console.log("Testing Normalizer for search:");
console.log("Query '  Banane Fresche  ' ->", normalizeFoodName("  Banane Fresche  "));
console.log("Query 'Salmone Affumicato Norvegese' ->", normalizeFoodName("Salmone Affumicato Norvegese"));

const isBarcode = /^\d{8,14}$/.test("8001234567890");
console.log("Is '8001234567890' a barcode?", isBarcode);

const isBarcode2 = /^\d{8,14}$/.test("banana");
console.log("Is 'banana' a barcode?", isBarcode2);
