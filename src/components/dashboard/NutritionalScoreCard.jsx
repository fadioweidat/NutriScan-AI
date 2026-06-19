import { useState, useMemo } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Check, AlertTriangle, X } from 'lucide-react';
import engine from '../../lib/nutrition-engine';
import ScoreRing from '../ScoreRing';

export default function NutritionalScoreCard({ dailyTotals, hasMeals, profile }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const score = hasMeals ? engine.calculateNutritionScore(dailyTotals, profile) : null;
  const scoreLabel = hasMeals ? engine.getNutritionScoreLabel(score) : 'Score non disponibile';
  const breakdown = useMemo(() => hasMeals ? engine.getScoreBreakdown(dailyTotals, profile) : [], [dailyTotals, hasMeals, profile]);

  return (
    <div className="bg-gradient-to-br from-surface-light to-surface border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 via-cyan-400 to-lime-400 opacity-50"></div>
      <h2 className="text-white/80 text-lg font-medium mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-lime-400" />
        Nutritional Score di Oggi
      </h2>
      
      {hasMeals ? (
        <>
          <ScoreRing score={score} size={180} />
          <h3 className="text-2xl font-bold mt-4 text-white">
            {scoreLabel}
          </h3>
          <p className="text-white/60 text-sm mt-2 max-w-md mb-4">
            Il punteggio (0-100) è calcolato in base a quanto hai soddisfatto i tuoi target giornalieri di vitamine, minerali e macronutrienti.
          </p>

          {/* Breakdown / Come è stato calcolato */}
          <div className="w-full max-w-md mt-2">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors text-white/70"
            >
              Come è stato calcolato {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showBreakdown && (
              <div className="mt-4 space-y-2 text-left bg-black/20 p-4 rounded-xl border border-white/5 max-h-64 overflow-y-auto">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold">Dettaglio Target</p>
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      {item.status === 'ok' && <Check className="w-4 h-4 text-lime-400" />}
                      {item.status === 'low' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {item.status === 'missing' && <X className="w-4 h-4 text-red-400" />}
                      <span className="text-white/80">{item.label}</span>
                    </div>
                    <span className={`font-semibold ${
                      item.status === 'ok' ? 'text-lime-400' :
                      item.status === 'low' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {item.status === 'ok' ? 'OK' : item.status === 'low' ? 'Basso' : 'Assente'} ({Math.round(item.percentage)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="py-6">
          <p className="text-white/50 font-medium">Score non disponibile</p>
          <p className="text-white/40 text-sm mt-2">Aggiungi almeno un pasto per calcolare il punteggio</p>
        </div>
      )}
    </div>
  );
}
