import { useState, useMemo } from 'react';
import engine from '../lib/nutrition-engine';
import { Calendar, CheckCircle2, ChevronDown, ListFilter, Activity } from 'lucide-react';
import NutrientOverviewGrid from './nutrient-map/NutrientOverviewGrid';
import NutrientAnalysisTable from './nutrient-map/NutrientAnalysisTable';
import NutrientDetailModal from './nutrient-map/NutrientDetailModal';

const BASE_KEYS = [
  'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3',
  'vitamin_c', 'vitamin_d', 'calcium', 'iron', 'magnesium', 'potassium', 'zinc'
];

export default function NutrientMap({ meals, foods, profile }) {
  const [timeframe, setTimeframe] = useState('7days'); // 'today', '7days', '30days'
  const [mode, setMode] = useState('base'); // 'base', 'advanced'
  const [selectedNutrient, setSelectedNutrient] = useState(null);
  
  const rda = useMemo(() => engine.getRDA(profile), [profile]);
  const dietType = profile?.diet_type || 'standard';
  const dietConfig = engine.DIET_CONFIGS?.[dietType] || engine.DIET_CONFIGS?.['standard'] || {
    label: 'Standard',
    dashboardMetrics: { top: [], bottom: [] },
    ignoreLow: [],
    warnings: []
  };

  const { averages, daysUnderTarget, daysCount } = useMemo(() => {
    // 1. Filtriamo i pasti in base al timeframe
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let daysToKeep = 0;
    if (timeframe === 'today') daysToKeep = 1;
    if (timeframe === '7days') daysToKeep = 7;
    if (timeframe === '30days') daysToKeep = 30;

    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - daysToKeep + 1);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const filteredMeals = meals.filter(m => {
      if (timeframe === 'today') return m.entry_date === todayStr;
      return m.entry_date >= cutoffStr && m.entry_date <= todayStr;
    });

    // 2. Raggruppiamo per giorno
    const mealsByDay = {};
    filteredMeals.forEach(m => {
      if (!mealsByDay[m.entry_date]) mealsByDay[m.entry_date] = [];
      mealsByDay[m.entry_date].push(m);
    });

    const loggedDays = Object.keys(mealsByDay);
    const nDays = loggedDays.length || 1; // Evita divisione per zero

    // 3. Calcoliamo i totali giornalieri per ogni giorno
    const dailyStats = loggedDays.map(date => {
      return engine.calculateDailyTotals(mealsByDay[date]);
    });

    // 4. Calcoliamo le medie e i giorni sotto target
    const averages = {};
    const daysUnderTarget = {}; // key -> count

    const allKeys = Object.keys(rda);
    
    allKeys.forEach(key => {
      let sum = 0;
      let underCount = 0;

      dailyStats.forEach(stat => {
        let val = 0;
        const isMacro = ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3', 'omega6'].includes(key);
        if (isMacro) val = stat[key] || 0;
        else val = (stat.micronutrients && stat.micronutrients[key]) ? stat.micronutrients[key] : 0;
        
        sum += val;
        
        if (!dietConfig.ignoreLow.includes(key)) {
          const pct = engine.calculateNutrientPercentage(val, rda[key]);
          if (pct < 90) underCount++;
        }
      });

      averages[key] = sum / nDays;
      daysUnderTarget[key] = underCount;
    });

    return { averages, daysUnderTarget, daysCount: nDays };
  }, [meals, timeframe, rda, dietConfig]);

  // Keys to show based on mode
  const keysToShow = mode === 'base' 
    ? BASE_KEYS 
    : Object.keys(rda);

  // Calcolo color code user-requested: Verde >=100%, Giallo 80-99%, Arancio 50-79%, Rosso <50%
  const getColorCode = (pct, key, avgVal, target) => {
    // Diet specific bypass
    if (dietConfig.ignoreLow.includes(key)) {
      if (avgVal <= target) return 'green';
      else return 'red'; // Excess carbs in Keto for example
    }
    if (pct >= 100) return 'green';
    if (pct >= 80) return 'yellow';
    if (pct >= 50) return 'orange';
    return 'red';
  };

  const nutrientData = keysToShow.map(key => {
    const target = rda[key];
    const avgVal = averages[key] || 0;
    const pct = Math.min(999, Math.round((avgVal / target) * 100)); // cap visually to 999 to avoid overflow
    const realPct = (avgVal / target) * 100;
    const colorCode = getColorCode(realPct, key, avgVal, target);
    
    return {
      key,
      target,
      avgVal,
      pct,
      colorCode
    };
  });

  return (
    <div className="space-y-6">
      {/* Controlli Mappa */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
        <div className="flex gap-2 bg-[#0a0a0f] p-1 rounded-xl border border-white/[0.05]">
          <button
            onClick={() => setTimeframe('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeframe === 'today' ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Oggi
          </button>
          <button
            onClick={() => setTimeframe('7days')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeframe === '7days' ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:text-slate-200'}`}
          >
            7 Giorni
          </button>
          <button
            onClick={() => setTimeframe('30days')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeframe === '30days' ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:text-slate-200'}`}
          >
            30 Giorni
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('base')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${mode === 'base' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <ListFilter className="w-4 h-4" />
            Base
          </button>
          <button
            onClick={() => setMode('advanced')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${mode === 'advanced' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <Activity className="w-4 h-4" />
            Avanzata
          </button>
        </div>
      </div>

      <NutrientOverviewGrid nutrientData={nutrientData} onSelectNutrient={setSelectedNutrient} />
      
      <NutrientAnalysisTable 
        nutrientData={nutrientData} 
        foods={foods} 
        onSelectNutrient={setSelectedNutrient} 
        dietConfig={dietConfig} 
      />

      {selectedNutrient && (
        <NutrientDetailModal 
          nutrientKey={selectedNutrient}
          nutrientData={nutrientData}
          onClose={() => setSelectedNutrient(null)}
          foods={foods}
          dietConfig={dietConfig}
        />
      )}
    </div>
  );
}
