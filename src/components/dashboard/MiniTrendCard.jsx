import { useMemo } from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import engine from '../../lib/nutrition-engine';

export default function MiniTrendCard({ weeklyMeals, rda, dietConfig }) {
  const { ok, improve, low } = useMemo(() => {
    if (!weeklyMeals || weeklyMeals.length === 0 || !rda) return { ok: 0, improve: 0, low: 0 };
    
    // Raggruppa per giorno
    const mealsByDay = {};
    weeklyMeals.forEach(m => {
      if (!mealsByDay[m.entry_date]) mealsByDay[m.entry_date] = [];
      mealsByDay[m.entry_date].push(m);
    });

    const loggedDays = Object.keys(mealsByDay);
    if (loggedDays.length === 0) return { ok: 0, improve: 0, low: 0 };

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

    // Conta gli status
    let okC = 0, impC = 0, lowC = 0;
    Object.keys(rda).forEach(key => {
      const target = rda[key];
      const val = averages[key];
      
      if (dietConfig?.ignoreLow?.includes(key)) {
        if (val <= target) okC++;
        else lowC++;
        return;
      }
      
      const pct = engine.calculateNutrientPercentage(val, target);
      const status = engine.getNutrientStatus(pct);
      if (status === 'green') okC++;
      else if (status === 'orange') impC++;
      else lowC++;
    });

    return { ok: okC, improve: impC, low: lowC };

  }, [weeklyMeals, rda, dietConfig]);

  return (
    <Link to="/nutrient-map" className="block bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all group h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-purple-400" />
            Trend (7 Giorni)
          </h3>
          <p className="text-white/40 text-xs uppercase tracking-wider">Sintesi nutrienti</p>
        </div>
        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-purple-400 transition-colors" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{ok}</div>
          <div className="text-[10px] text-emerald-400/70 uppercase font-semibold mt-1">OK</div>
        </div>
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{improve}</div>
          <div className="text-[10px] text-amber-400/70 uppercase font-semibold mt-1">Da M.</div>
        </div>
        <div className="bg-rose-400/10 border border-rose-400/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-rose-400">{low}</div>
          <div className="text-[10px] text-rose-400/70 uppercase font-semibold mt-1">Basso</div>
        </div>
      </div>
    </Link>
  );
}
