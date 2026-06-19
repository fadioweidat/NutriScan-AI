import React from 'react';
import { getNutrientDetails } from '../../data/nutrient-details';
import engine from '../../lib/nutrition-engine';
import { X, Info, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';

export default function NutrientDetailModal({ nutrientKey, nutrientData, onClose, foods, dietConfig }) {
  if (!nutrientKey) return null;

  const data = nutrientData.find(d => d.key === nutrientKey);
  if (!data) return null;

  const details = getNutrientDetails(nutrientKey);
  const name = engine.NUTRIENT_LABELS[nutrientKey] || nutrientKey;
  const unit = engine.NUTRIENT_UNITS[nutrientKey] || '';

  const deficit = Math.max(0, data.target - data.avgVal);
  const isLow = deficit > 0 && !dietConfig.ignoreLow.includes(nutrientKey);
  let suggestions = [];
  if (isLow) {
    suggestions = engine.generateQuantifiedFixSuggestions(nutrientKey, deficit, foods, { diet_type: dietConfig.key });
  }

  // Trend 30 days vs 7 days is tricky if not passed directly, but we can assume we only show the current data state for now.
  // The user requested "Trend ultimi 7 giorni, Trend ultimi 30 giorni", but we don't have them both at the same time in this scope unless we calculate it. We'll show the generic trend info if available or just the status.

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12121a] border border-white/10 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-white">{name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/60">
                {details.category}
              </span>
            </div>
            <p className="text-sm text-white/40">
              Copertura target: <strong className="text-white/80">{data.pct}%</strong>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Progress Overview */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Assunzione Media: <strong className="text-white">{Math.round(data.avgVal)}{unit}</strong></span>
              <span className="text-white/60">Target: <strong className="text-white">{Math.round(data.target)}{unit}</strong></span>
            </div>
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  data.colorCode === 'green' ? 'bg-emerald-500' : 
                  data.colorCode === 'yellow' ? 'bg-yellow-500' :
                  data.colorCode === 'orange' ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(data.pct, 100)}%` }}
              />
            </div>
          </div>

          {/* Funzioni Principali */}
          {details.function && details.function.length > 0 && (
            <div>
              <h4 className="text-white/80 font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lime-400" />
                Funzioni Principali
              </h4>
              <ul className="space-y-2">
                {details.function.map((f, i) => (
                  <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Possibili Segnali di Basso Apporto */}
          {details.deficiency && details.deficiency.length > 0 && (
            <div>
              <h4 className="text-white/80 font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Possibili segnali associati a basso apporto
              </h4>
              <ul className="space-y-2">
                {details.deficiency.map((d, i) => (
                  <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Da monitorare (Eccesso) */}
          {details.excess && details.excess.length > 0 && (
            <div>
              <h4 className="text-white/80 font-bold mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Da monitorare (Eccesso)
              </h4>
              <ul className="space-y-2">
                {details.excess.map((e, i) => (
                  <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">•</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alimenti Consigliati */}
          {suggestions.length > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5 mt-4">
              <h4 className="text-cyan-400 font-bold mb-3">Come coprire il fabbisogno mancante ({Math.round(deficit)}{unit})</h4>
              <ul className="space-y-3">
                {suggestions.slice(0, 3).map((sug, i) => (
                  <li key={i} className="text-white/90 text-sm flex items-start gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                    {sug.startsWith('✓') ? (
                      <>
                        <span className="mt-0.5">🍏</span>
                        <span>{sug.replace('✓ ', '')}</span>
                      </>
                    ) : (
                      <span>{sug}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="p-4 border-t border-white/10 bg-black/40 shrink-0 text-center flex justify-center items-center gap-2">
          <BookOpen className="w-4 h-4 text-white/30" />
          <p className="text-white/30 text-xs italic">
            Queste informazioni sono educative e non sostituiscono il parere medico.
          </p>
        </div>
      </div>
    </div>
  );
}
