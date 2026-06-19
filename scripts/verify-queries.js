import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fetchAll(table, select = '*') {
  let allData = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + step - 1);
    if (error) {
      console.error(error);
      break;
    }
    allData.push(...data);
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

async function run() {
  const foods = await fetchAll('foods');
  const foodNutrients = await fetchAll('food_nutrients', 'id, food_id');

  console.log('----------------------------------------------------');
  console.log('1. SELECT source, COUNT(*) FROM foods GROUP BY source ORDER BY source;');
  const countBySource = foods.reduce((acc, f) => {
    acc[f.source] = (acc[f.source] || 0) + 1;
    return acc;
  }, {});
  const sortedSources = Object.keys(countBySource).sort();
  sortedSources.forEach(s => console.log(`${s} | ${countBySource[s]}`));

  console.log('\n----------------------------------------------------');
  console.log('1b. SELECT COUNT(*) FROM food_nutrients;');
  console.log(foodNutrients.length);

  console.log('\n----------------------------------------------------');
  console.log("1c. SELECT COUNT(*) FROM foods WHERE source='USDA';");
  console.log(foods.filter(f => f.source === 'USDA').length);

  console.log('\n----------------------------------------------------');
  console.log("1d. SELECT COUNT(*) FROM foods WHERE source IN ('OPEN_FOOD_FACTS','OFF');");
  console.log(foods.filter(f => f.source === 'OPEN_FOOD_FACTS' || f.source === 'OFF').length);

  console.log('\n----------------------------------------------------');
  console.log("1e. SELECT COUNT(*) FROM foods WHERE source='CREA';");
  console.log(foods.filter(f => f.source === 'CREA').length);

  console.log('\n----------------------------------------------------');
  console.log("2. SELECT id, name, source FROM foods WHERE source='USDA' LIMIT 10;");
  const usda10 = foods.filter(f => f.source === 'USDA').slice(0, 10);
  console.table(usda10.map(f => ({ id: f.id, name: f.name, source: f.source })));

  console.log('\n----------------------------------------------------');
  console.log("3. SELECT id, name, source FROM foods WHERE source IN ('OPEN_FOOD_FACTS','OFF') LIMIT 10;");
  const off10 = foods.filter(f => f.source === 'OPEN_FOOD_FACTS' || f.source === 'OFF').slice(0, 10);
  console.table(off10.map(f => ({ id: f.id, name: f.name, source: f.source })));

  console.log('\n----------------------------------------------------');
  console.log("4. Verifica che ogni alimento abbia nutrienti (LIMIT 20 ASC);");
  const nutrientCountByFood = foodNutrients.reduce((acc, fn) => {
    acc[fn.food_id] = (acc[fn.food_id] || 0) + 1;
    return acc;
  }, {});

  const foodsWithNutrientsCount = foods.map(f => ({
    name: f.name,
    nutrient_count: nutrientCountByFood[f.id] || 0
  })).sort((a, b) => a.nutrient_count - b.nutrient_count).slice(0, 20);
  console.table(foodsWithNutrientsCount);

  console.log('\n----------------------------------------------------');
  console.log("7. SELECT source, source_id, COUNT(*) FROM foods GROUP BY source, source_id HAVING COUNT(*) > 1;");
  
  const srcSrcId = foods.reduce((acc, f) => {
    const key = `${f.source}::${f.source_id}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  let duplicatesFound = false;
  Object.keys(srcSrcId).forEach(k => {
    if (srcSrcId[k] > 1) {
      duplicatesFound = true;
      const [src, srcid] = k.split('::');
      console.log(`${src} | ${srcid} | ${srcSrcId[k]}`);
    }
  });

  if (!duplicatesFound) {
    console.log("0 rows (Nessun duplicato trovato)");
  }

}

run();
