import { Flame, Beef, Wheat, Droplets, Salad, Zap, Heart, Info, AlertTriangle } from 'lucide-react';
import engine from '../../lib/nutrition-engine';
import NutrientBar from '../NutrientBar';

const getMacroIcon = (key) => {
  const map = {
    proteins: Beef, carbs: Wheat, fats: Droplets, fiber: Salad, calories: Flame
  };
  return map[key] || Zap;
};

const getMacroColor = (key) => {
  const map = {
    proteins: 'lime', carbs: 'cyan', fats: 'amber', fiber: 'emerald', calories: 'orange'
  };
  return map[key] || 'blue';
};

export default function MacroSummaryCard({ dailyTotals, rda, dietConfig }) {
  if (!dailyTotals || !dietConfig) return null;

  const topMetrics = dietConfig.dashboardMetrics.top;
  const bottomMetrics = dietConfig.dashboardMetrics.bottom;

  // Trova eventuali warning attivi
  const activeWarnings = (dietConfig.warnings || []).filter(w => {
    const val = dailyTotals[w.key] || 0;
    return val > w.max;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3 ml-1">
        <h3 className="text-white/70 text-sm font-medium">
          Dati Oggi — <span className="text-white">{dietConfig.label}</span>
        </h3>
        <div className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full">
          <Flame className="w-3 h-3 inline mr-1" />
          {Math.round(dailyTotals.calories || 0)} / {Math.round(rda?.calories || engine.DAILY_TARGETS.calories)} kcal
        </div>
      </div>
      
      {activeWarnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {activeWarnings.map((w, idx) => (
            <div key={idx} className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-start gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{w.message} ({Math.round(dailyTotals[w.key] || 0)}{engine.NUTRIENT_UNITS[w.key] || 'g'})</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {topMetrics.map((key) => {
          const isMacro = ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3', 'omega6'].includes(key);
          const current = isMacro ? (dailyTotals[key] || 0) : (dailyTotals.micronutrients?.[key] || 0);
          const target = rda?.[key] || engine.DAILY_TARGETS[key] || 1;
          const Icon = getMacroIcon(key);
          const color = getMacroColor(key);
          const label = engine.NUTRIENT_LABELS[key] || key;
          const unit = engine.NUTRIENT_UNITS[key] || 'g';

          return (
            <div
              key={key}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-white/50" />
                <span className="text-white/70 text-sm font-medium">{label}</span>
              </div>
              <NutrientBar
                label={label}
                current={Math.round(current * 10) / 10}
                target={Math.round(target)}
                unit={unit}
                color={color}
              />
            </div>
          );
        })}
      </div>

      {/* Micro-pills for key micronutrients */}
      <div className="mt-3 flex flex-wrap gap-2">
        {bottomMetrics.map(key => {
          const isMacro = ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3', 'omega6'].includes(key);
          const current = isMacro ? (dailyTotals[key] || 0) : (dailyTotals.micronutrients?.[key] || 0);
          const target = rda?.[key] || engine.DAILY_TARGETS[key] || 1;
          const pct = Math.min(100, Math.round((current / target) * 100));
          
          let colorClass = 'text-red-400 bg-red-400/10 border-red-400/20';
          if (dietConfig.ignoreLow.includes(key) && current <= target) {
            colorClass = 'text-lime-400 bg-lime-400/10 border-lime-400/20';
          } else {
            if (pct >= 90) colorClass = 'text-lime-400 bg-lime-400/10 border-lime-400/20';
            else if (pct >= 50) colorClass = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
          }

          const label = (engine.NUTRIENT_LABELS[key] || key).replace('Vitamina ', 'Vit ').replace(' (Vitamina B7)', '').replace('Acido Folico (Vitamina B9)', 'Folati');
          const unit = engine.NUTRIENT_UNITS[key] || 'mg';

          return (
            <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${colorClass}`}>
              <span>{label}</span>
              <span className="opacity-60">|</span>
              <span>{Math.round(current)}{unit}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
