import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import engine from '../../lib/nutrition-engine';

export default function FixTodayCard({ dailyTotals, foods, rda, dietConfig }) {
  const suggestions = useMemo(() => {
    if (!dailyTotals || !foods || foods.length === 0 || !rda) return [];
    
    // Trova i nutrienti più bassi oggi
    const lows = [];
    const isMacro = (key) => ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'water', 'omega3', 'omega6'].includes(key);
    
    Object.keys(rda).forEach(key => {
      if (dietConfig?.ignoreLow?.includes(key)) return;
      
      const val = isMacro(key) ? (dailyTotals[key] || 0) : ((dailyTotals.micronutrients && dailyTotals.micronutrients[key]) ? dailyTotals.micronutrients[key] : 0);
      const target = rda[key];
      const pct = engine.calculateNutrientPercentage(val, target);
      
      if (pct < 90) {
        lows.push({ key, deficit: engine.calculateNutrientDeficit(val, target), pct, val, target });
      }
    });

    lows.sort((a, b) => a.pct - b.pct);
    const topLows = lows.slice(0, 3); // Prendi i 3 peggiori

    const finalSuggestions = [];
    topLows.forEach(low => {
      const suggs = engine.generateQuantifiedFixSuggestions(low.key, low.deficit, foods, { diet_type: dietConfig?.key || 'standard' });
      // Prendi solo il miglior suggerimento pratico per nutriente
      const validSug = suggs.find(s => s.startsWith('✓'));
      if (validSug) {
        finalSuggestions.push({
          nutrient: low.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          text: validSug,
          amount: low.val,
          target: low.target,
          key: low.key
        });
      }
    });

    return finalSuggestions;

  }, [dailyTotals, foods, rda, dietConfig]);

  return (
    <div className="bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-6 h-full">
      <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-lg">
        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
        Correggi Oggi
      </h3>
      <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Azioni pratiche per raggiungere i target</p>
      
      {suggestions.length === 0 ? (
        <p className="text-white/60 text-sm">Non ci sono azioni correttive necessarie al momento.</p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((sug, idx) => (
            <div key={idx} className="flex flex-col gap-1 bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-xs font-semibold uppercase">{sug.nutrient}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-white font-medium text-xs">{Math.round(sug.amount)}{engine.NUTRIENT_UNITS[sug.key] || 'mg'}</span>
                  <span className="text-white/30 text-[10px]">/ {Math.round(sug.target)}{engine.NUTRIENT_UNITS[sug.key] || 'mg'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <span className="text-white/90 text-sm">{sug.text.replace('✓ ', '')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
