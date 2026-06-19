import React from 'react';
import { getNutrientDetails } from '../../data/nutrient-details';

export default function NutrientOverviewGrid({ nutrientData, onSelectNutrient }) {
  // Raggruppiamo i nutrienti per macro-categoria in modo da dar loro un senso logico (vitamine, minerali, macro)
  
  const renderGroup = (title, items) => {
    if (!items.length) return null;
    return (
      <div className="mb-6">
        <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {items.map(item => {
            const details = getNutrientDetails(item.key);
            
            // Colore di base per il badge
            let bg = 'bg-white/5 hover:bg-white/10';
            let border = 'border-white/10';
            let textColor = 'text-white/80';
            let pctColor = 'text-white/50';

            if (item.colorCode === 'green') {
              bg = 'bg-lime-500/10 hover:bg-lime-500/20';
              border = 'border-lime-500/30';
              textColor = 'text-lime-100';
              pctColor = 'text-lime-400';
            } else if (item.colorCode === 'yellow') {
              bg = 'bg-yellow-500/10 hover:bg-yellow-500/20';
              border = 'border-yellow-500/30';
              textColor = 'text-yellow-100';
              pctColor = 'text-yellow-400';
            } else if (item.colorCode === 'orange') {
              bg = 'bg-amber-500/10 hover:bg-amber-500/20';
              border = 'border-amber-500/30';
              textColor = 'text-amber-100';
              pctColor = 'text-amber-400';
            } else if (item.colorCode === 'red') {
              bg = 'bg-red-500/10 hover:bg-red-500/20';
              border = 'border-red-500/30';
              textColor = 'text-red-100';
              pctColor = 'text-red-400';
            }

            return (
              <button
                key={item.key}
                onClick={() => onSelectNutrient(item.key)}
                className={`w-20 h-20 flex flex-col items-center justify-center rounded-xl border transition-all cursor-pointer shadow-sm ${bg} ${border}`}
              >
                <span className={`text-sm font-bold ${textColor} mb-1`}>{details.shortLabel}</span>
                <span className={`text-xs font-bold ${pctColor}`}>{item.pct}%</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const macros = nutrientData.filter(d => ['calories', 'proteins', 'carbs', 'fats', 'fiber', 'omega3', 'omega6', 'water'].includes(d.key));
  const vitamins = nutrientData.filter(d => d.key.startsWith('vitamin_'));
  const minerals = nutrientData.filter(d => !macros.includes(d) && !vitamins.includes(d));

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
      <h3 className="text-white font-bold text-lg mb-6">Overview Nutrienti</h3>
      {renderGroup('Macro & Energia', macros)}
      {renderGroup('Vitamine', vitamins)}
      {renderGroup('Minerali', minerals)}
    </div>
  );
}
