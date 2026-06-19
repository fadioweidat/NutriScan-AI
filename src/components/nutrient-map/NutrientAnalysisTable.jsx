import React, { useState } from 'react';
import { getNutrientDetails } from '../../data/nutrient-details';
import engine from '../../lib/nutrition-engine';
import { Search, ListFilter, ArrowUpDown } from 'lucide-react';

const STATUS_BADGE = {
  green: { label: 'Ottimo', className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  yellow: { label: 'Quasi raggiunto', className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  orange: { label: 'Basso', className: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  red: { label: 'Grave', className: 'text-rose-400 bg-rose-400/10 border-rose-400/20' }
};

export default function NutrientAnalysisTable({ nutrientData, foods, onSelectNutrient, dietConfig }) {
  const [filter, setFilter] = useState('all'); // all, red, orange, green, excess
  const [search, setSearch] = useState('');
  
  // Default sorting: prima rossi, arancioni, gialli, verdi. Dentro al gruppo: pct crescente.
  // In `nutrientData`, colorCode è 'red', 'orange', 'yellow', 'green'
  const getColorWeight = (c) => {
    if (c === 'red') return 0;
    if (c === 'orange') return 1;
    if (c === 'yellow') return 2;
    if (c === 'green') return 3;
    return 4;
  };

  const filteredData = nutrientData.filter(d => {
    if (filter === 'red' && d.colorCode !== 'red') return false;
    if (filter === 'orange' && d.colorCode !== 'orange') return false;
    if (filter === 'green' && d.colorCode !== 'green') return false;
    if (filter === 'excess' && d.pct <= 150) return false; // consider excess > 150%

    if (search) {
      const details = getNutrientDetails(d.key);
      const name = engine.NUTRIENT_LABELS[d.key] || d.key;
      if (!name.toLowerCase().includes(search.toLowerCase()) && !details.shortLabel.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const wa = getColorWeight(a.colorCode);
    const wb = getColorWeight(b.colorCode);
    if (wa !== wb) return wa - wb;
    return a.pct - b.pct;
  });

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden flex flex-col">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
        <h3 className="text-white font-bold text-lg">Analisi Completa</h3>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cerca nutriente..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
          >
            <option value="all">Tutti</option>
            <option value="red">Solo carenze (Grave)</option>
            <option value="orange">Solo bassi</option>
            <option value="green">Solo ottimali</option>
            <option value="excess">Solo eccessi (&gt;150%)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
              <th className="pb-3 pl-2 font-medium">Nutriente</th>
              <th className="pb-3 font-medium">Assunto</th>
              <th className="pb-3 font-medium">Target</th>
              <th className="pb-3 font-medium">Copertura</th>
              <th className="pb-3 font-medium">Stato</th>
              <th className="pb-3 font-medium">Priorità</th>
              <th className="pb-3 pr-2 font-medium">Azione Consigliata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.map(d => {
              const name = engine.NUTRIENT_LABELS[d.key] || d.key;
              const unit = engine.NUTRIENT_UNITS[d.key] || '';
              const badge = STATUS_BADGE[d.colorCode] || STATUS_BADGE.green;
              
              let priority = 'Bassa';
              let priorityColor = 'text-white/30';
              if (d.colorCode === 'red') { priority = 'Alta'; priorityColor = 'text-rose-400 font-bold'; }
              else if (d.colorCode === 'orange') { priority = 'Media'; priorityColor = 'text-amber-400 font-bold'; }
              else if (d.colorCode === 'green') { priority = '—'; priorityColor = 'text-white/20'; }

              let suggestion = '—';
              if (d.colorCode === 'red' || d.colorCode === 'orange') {
                const deficit = d.target - d.avgVal;
                // Prendi il primo suggerimento e rimuovi il tick ✅ e prendi solo il nome alimento
                const suggs = engine.generateQuantifiedFixSuggestions(d.key, deficit, foods, { diet_type: dietConfig.key });
                if (suggs.length > 0) {
                  // Esempio stringa generata: "✓ 120g di Kiwi" -> "Kiwi"
                  const match = suggs[0].match(/di\s+(.+)$/i) || suggs[0].match(/([A-Z][a-z]+.*)$/);
                  if (match) suggestion = match[1].trim();
                  else suggestion = suggs[0].replace(/[^a-zA-Z\s]/g, '').trim(); // Fallback grezzo
                }
              }

              return (
                <tr 
                  key={d.key} 
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => onSelectNutrient(d.key)}
                >
                  <td className="py-4 pl-2">
                    <span className="text-white font-medium text-sm">{name}</span>
                  </td>
                  <td className="py-4 text-sm text-white/70">{Math.round(d.avgVal)}{unit}</td>
                  <td className="py-4 text-sm text-white/40">{Math.round(d.target)}{unit}</td>
                  <td className="py-4 text-sm font-medium text-white/90">{d.pct}%</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className={`py-4 text-sm ${priorityColor}`}>{priority}</td>
                  <td className="py-4 pr-2 text-sm text-cyan-400 italic">{suggestion}</td>
                </tr>
              );
            })}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-white/40 text-sm">
                  Nessun nutriente corrisponde ai filtri.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
