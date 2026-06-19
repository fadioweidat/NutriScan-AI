import { useMemo } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import engine from '../../lib/nutrition-engine';

export default function NutritionalPriorities({ weeklyMeals, rda, dietConfig, profile }) {
  const priorities = useMemo(() => {
    if (!weeklyMeals || weeklyMeals.length === 0 || !rda) return [];
    
    // Raggruppa per giorno
    const mealsByDay = {};
    weeklyMeals.forEach(m => {
      if (!mealsByDay[m.entry_date]) mealsByDay[m.entry_date] = [];
      mealsByDay[m.entry_date].push(m);
    });

    const loggedDays = Object.keys(mealsByDay);
    if (loggedDays.length === 0) return [];

    const dailyStats = loggedDays.map(date => engine.calculateDailyTotals(mealsByDay[date]));

    // Calcola media
    const averages = {};
    Object.keys(rda).forEach(key => {
      let sum = 0;
      dailyStats.forEach(stat => {
        const isMacro = ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3', 'omega6'].includes(key);
        let val = isMacro ? (stat[key] || 0) : ((stat.micronutrients && stat.micronutrients[key]) ? stat.micronutrients[key] : 0);
        sum += val;
      });
      averages[key] = sum / loggedDays.length;
    });

    // Trova le % più basse
    const pcts = [];
    Object.keys(rda).forEach(key => {
      if (dietConfig?.ignoreLow?.includes(key)) return;
      
      const pct = engine.calculateNutrientPercentage(averages[key], rda[key]);
      if (pct < 90) {
        pcts.push({ key, pct });
      }
    });

    pcts.sort((a, b) => a.pct - b.pct);
    return pcts.slice(0, 3);

  }, [weeklyMeals, rda, dietConfig]);

  const formatName = (key) => engine.NUTRIENT_LABELS[key] || key;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-lg">
        <AlertCircle className="w-5 h-5 text-orange-400" />
        Le tue priorità nutrizionali
      </h3>
      <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Basato sui giorni tracciati ({weeklyMeals.length > 0 ? Object.keys(weeklyMeals.reduce((acc, m) => { acc[m.entry_date] = true; return acc; }, {})).length : 0} gg)</p>
      
      {priorities.length === 0 ? (
        <div className="flex items-center gap-3 text-lime-400 bg-lime-400/10 p-4 rounded-xl">
          <CheckCircle2 className="w-6 h-6" />
          <p>Tutti i nutrienti sono in target!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {priorities.map((p, idx) => (
            <div key={p.key} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center">
              <div>
                <h4 className="text-white font-bold text-md">#{idx + 1} {formatName(p.key)}</h4>
              </div>
              <div className="text-orange-400 font-bold text-xl">
                {p.pct}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
