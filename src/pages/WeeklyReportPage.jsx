import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import engine from '../lib/nutrition-engine';
import { 
  CalendarRange, TrendingUp, TrendingDown, ArrowRight, 
  CheckCircle2, AlertTriangle, XCircle, Info, BrainCircuit, Loader2, Sparkles, X
} from 'lucide-react';

export default function WeeklyReportPage() {
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('settimana');
  const [mealsData, setMealsData] = useState([]);
  const [foodsData, setFoodsData] = useState([]);

  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const d60 = new Date();
        d60.setDate(d60.getDate() - 60);

        const [mealsRes, foodsRes] = await Promise.all([
          supabase.from('meal_entries').select('*, foods(*, food_nutrients(*))').gte('entry_date', d60.toISOString().split('T')[0]),
          supabase.from('foods').select('*, food_nutrients(*)')
        ]);

        if (mealsRes.data) setMealsData(mealsRes.data);
        if (foodsRes.data) setFoodsData(foodsRes.data);

      } catch (e) {
        console.error("Errore caricamento dati:", e);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadData();
  }, [user]);

  const rda = useMemo(() => engine.getRDA(profile), [profile]);

  // Raggruppa per giorni
  const dailyStats = useMemo(() => {
    const daysMap = {};
    mealsData.forEach(m => {
      const d = m.entry_date;
      if (!daysMap[d]) daysMap[d] = [];
      const mealNutrients = engine.calculateMealNutrients(m.foods, m.quantity_grams);
      daysMap[d].push({ ...m, nutrients: mealNutrients });
    });

    const result = {};
    Object.keys(daysMap).forEach(d => {
      const totals = engine.calculateDailyTotals(daysMap[d]);
      const score = engine.calculateNutritionScore(totals, profile);
      const comparison = engine.compareWithRDA(totals, profile);
      const status = engine.calculateDailyHealthStatus(score, comparison.missing.length);
      result[d] = { totals, score, comparison, status };
    });
    return result;
  }, [mealsData, rda]);

  // Calcola metriche per periodi
  const getPeriodStats = (daysAgoStart, daysAgoEnd) => {
    const start = new Date(); start.setDate(start.getDate() - daysAgoStart);
    const end = new Date(); end.setDate(end.getDate() - daysAgoEnd);
    
    let scores = [];
    let totalsList = [];
    let missingCounts = {};

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const stats = dailyStats[dateStr];
      if (stats) {
        scores.push(stats.score);
        totalsList.push(stats.totals);
        stats.comparison.missing.forEach(k => {
          missingCounts[k] = (missingCounts[k] || 0) + 1;
        });
        stats.comparison.low.forEach(k => {
          missingCounts[k] = (missingCounts[k] || 0) + 1;
        });
      }
    }

    const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
    
    // Average percentages for each nutrient
    const avgPcts = {};
    Object.keys(rda).forEach(k => {
      let sum = 0;
      totalsList.forEach(t => {
        let amount = (['calories','proteins','carbs','fats','fiber','water','omega3','omega6'].includes(k)) 
          ? (t[k] || 0) 
          : (t.micronutrients?.[k] || 0);
        let pct = engine.calculateNutrientPercentage(amount, rda[k]);
        sum += Math.min(pct, 100);
      });
      avgPcts[k] = totalsList.length ? Math.round(sum / totalsList.length) : 0;
    });

    return { scores, avgScore, avgPcts, missingCounts, totalsList, daysWithData: scores.length };
  };

  const period7 = getPeriodStats(7, 0);
  const period14_7 = getPeriodStats(14, 8);
  const period30 = getPeriodStats(30, 0);
  const period60_30 = getPeriodStats(60, 31);

  // -- VISTA 7 GIORNI --
  const weeklyMiglioramenti = [];
  const weeklyPeggioramenti = [];
  Object.keys(rda).forEach(k => {
    const diff = period7.avgPcts[k] - period14_7.avgPcts[k];
    if (diff > 5 && period7.daysWithData > 0 && period14_7.daysWithData > 0) {
      weeklyMiglioramenti.push({ key: k, diff });
    } else if (diff < -5 && period7.daysWithData > 0 && period14_7.daysWithData > 0) {
      weeklyPeggioramenti.push({ key: k, diff });
    }
  });
  weeklyMiglioramenti.sort((a,b) => b.diff - a.diff).slice(0, 5);
  weeklyPeggioramenti.sort((a,b) => a.diff - b.diff).slice(0, 5);
  const weeklyPriorities = engine.getTopNutritionalPriorities(
    engine.calculateAverageTotals(period7.totalsList), 
    rda, 
    3,
    profile
  );

  // -- VISTA 30 GIORNI --
  const monthlyMissingDays = Object.entries(period30.missingCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);
  
  const monthlySortedPcts = Object.entries(period30.avgPcts).sort((a,b) => b[1] - a[1]);
  const puntiForti = monthlySortedPcts.slice(0, 5);
  const areeOttimizzare = [...monthlySortedPcts].reverse().slice(0, 5);

  const tendenzaMensile = [];
  Object.keys(rda).forEach(k => {
    const diff = period30.avgPcts[k] - period60_30.avgPcts[k];
    let icon = <ArrowRight className="w-4 h-4 text-white/50" />;
    if (diff > 5) icon = <TrendingUp className="w-4 h-4 text-lime-400" />;
    if (diff < -5) icon = <TrendingDown className="w-4 h-4 text-red-400" />;
    tendenzaMensile.push({ key: k, diff, icon });
  });
  tendenzaMensile.sort((a,b) => b.diff - a.diff).slice(0, 5); // top 5 movimenti

  // -- REPORT AI LOCALE --
  const generateAiText = () => {
    if (period30.daysWithData === 0) return "Non ci sono dati a sufficienza negli ultimi 30 giorni.";
    let text = `Negli ultimi 30 giorni, lo score medio è stato di ${period30.avgScore}/100. `;
    if (monthlyMissingDays.length > 0) {
      text += `Il nutriente più frequentemente sotto target è stato ${engine.NUTRIENT_LABELS[monthlyMissingDays[0][0]] || monthlyMissingDays[0][0]} (${monthlyMissingDays[0][1]} giorni). `;
    }
    if (puntiForti.length > 0) {
      text += `Ottimo lavoro con ${engine.NUTRIENT_LABELS[puntiForti[0][0]] || puntiForti[0][0]}, mantenuto a ottimi livelli. `;
    }
    return text + "Usa la scheda Mese per vedere le azioni consigliate.";
  };

  // -- CALENDARIO --
  const calendarDays = [];
  const startCal = new Date();
  startCal.setDate(1); // primo del mese
  const endCal = new Date(startCal.getFullYear(), startCal.getMonth() + 1, 0);
  for (let d = new Date(startCal); d <= endCal; d.setDate(d.getDate() + 1)) {
    const str = d.toISOString().split('T')[0];
    calendarDays.push({
      dateStr: str,
      dayNum: d.getDate(),
      stats: dailyStats[str] || null
    });
  }

  const handleDayClick = (day) => {
    if (day.stats) setSelectedDayInfo(day);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  if (period30.daysWithData === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50"></div>
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Dati Insufficienti</h2>
          <p className="text-white/60 mb-6">Aggiungi pasti per generare report intelligenti e insight nutrizionali.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Intestazione e Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <CalendarRange className="w-6 h-6 text-lime-400" />
          <div>
            <h1 className="text-lg font-bold text-white">Analisi e Report</h1>
            <p className="text-white/50 text-sm">Decisioni guidate dai tuoi dati</p>
          </div>
        </div>
        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
          {['settimana', 'mese', 'calendario'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sintesi AI Sempre Visibile */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BrainCircuit className="w-32 h-32 text-cyan-400" />
        </div>
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-cyan-400 font-bold mb-1">Report AI</h3>
            <p className="text-white/90 leading-relaxed font-medium">
              "{generateAiText()}"
            </p>
          </div>
        </div>
      </div>

      {/* --- TAB: SETTIMANA --- */}
      {activeTab === 'settimana' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center flex flex-col justify-center items-center">
              <h3 className="text-white/60 text-sm font-medium mb-2">Score Medio Settimana</h3>
              <div className="text-5xl font-black text-lime-400">{period7.avgScore}</div>
              <p className="text-white/40 text-xs mt-2">Su {period7.daysWithData} giorni tracciati</p>
            </div>
            
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-white/80 text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Top 3 Priorità
              </h3>
              <div className="space-y-3">
                {weeklyPriorities.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="font-medium text-white">{engine.NUTRIENT_LABELS[p.nutrient || p.key] || p.nutrient || p.key}</span>
                    <span className="text-amber-400 text-sm font-bold">Apporto basso ({Math.round(p.percentage || 0)}%)</span>
                  </div>
                ))}
                {weeklyPriorities.length === 0 && <p className="text-white/40 text-sm">Nessuna carenza urgente registrata.</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-lime-400 text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Miglioramenti
              </h3>
              <p className="text-white/40 text-xs mb-4">Rispetto ai 7 giorni precedenti</p>
              <div className="space-y-2">
                {weeklyMiglioramenti.map((m, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">{engine.NUTRIENT_LABELS[m.key] || m.key}</span>
                    <span className="text-lime-400 text-sm font-bold">+{m.diff}%</span>
                  </div>
                ))}
                {weeklyMiglioramenti.length === 0 && <p className="text-white/40 text-sm">Dati insufficienti per il confronto.</p>}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-white/50 text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Peggioramenti
              </h3>
              <p className="text-white/40 text-xs mb-4">Rispetto ai 7 giorni precedenti</p>
              <div className="space-y-2">
                {weeklyPeggioramenti.map((m, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">{engine.NUTRIENT_LABELS[m.key] || m.key}</span>
                    <span className="text-red-400 text-sm font-bold">{m.diff}%</span>
                  </div>
                ))}
                {weeklyPeggioramenti.length === 0 && <p className="text-white/40 text-sm">Nessun peggioramento rilevante.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: MESE --- */}
      {activeTab === 'mese' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-white/80 text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Frequenza Sotto Target (30 Giorni)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {monthlyMissingDays.map((m, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-white font-medium">{engine.NUTRIENT_LABELS[m[0]] || m[0]}</span>
                  <span className="text-red-400 font-bold">{m[1]} giorni</span>
                </div>
              ))}
              {monthlyMissingDays.length === 0 && <p className="text-white/40">Tutto in regola negli ultimi 30 giorni!</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-lime-400 text-sm font-bold mb-4 uppercase tracking-wider">Punti Forti</h3>
              <div className="space-y-3">
                {puntiForti.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl">
                    <span className="text-white/90 text-sm">{engine.NUTRIENT_LABELS[p[0]] || p[0]}</span>
                    <span className="text-lime-400 font-bold">{p[1]}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-amber-400 text-sm font-bold mb-4 uppercase tracking-wider">Aree da Ottimizzare</h3>
              <div className="space-y-3">
                {areeOttimizzare.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl">
                    <span className="text-white/90 text-sm">{engine.NUTRIENT_LABELS[p[0]] || p[0]}</span>
                    <span className="text-amber-400 font-bold">{p[1]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-cyan-400 text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Azioni Consigliate
            </h3>
            <p className="text-white/50 text-sm mb-6">Quantità reali per coprire le carenze delle tue aree da ottimizzare giornaliere (basato su RDA):</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {areeOttimizzare.slice(0, 3).map((area, i) => {
                const target = rda[area[0]];
                const avgTotal = (area[1] / 100) * target;
                const deficit = target - avgTotal;
                const suggestions = engine.generateQuantifiedFixSuggestions(area[0], deficit, foodsData);
                
                return (
                  <div key={i} className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl">
                    <h4 className="text-white font-bold mb-3">{engine.NUTRIENT_LABELS[area[0]] || area[0]}</h4>
                    <ul className="space-y-2">
                      {suggestions.map((sug, idx) => (
                        <li key={idx} className="text-cyan-400/90 text-sm">{sug}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* --- TAB: CALENDARIO --- */}
      {activeTab === 'calendario' && (
        <div className="animate-fade-in relative">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-white/80 text-sm font-bold mb-6 uppercase tracking-wider text-center">Calendario del Mese</h3>
            <div className="grid grid-cols-7 gap-2">
              {['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(d => (
                <div key={d} className="text-center text-white/30 text-xs font-medium mb-2">{d}</div>
              ))}
              
              {/* Padding per giorni inizio mese (semplificato, assumiamo lunedi o lasciamo flex) */}
              {Array.from({ length: new Date(startCal.getFullYear(), startCal.getMonth(), 1).getDay() - 1 < 0 ? 6 : new Date(startCal.getFullYear(), startCal.getMonth(), 1).getDay() - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12"></div>
              ))}

              {calendarDays.map((day, i) => {
                let bg = 'bg-white/5';
                let border = 'border-white/10';
                if (day.stats) {
                  if (day.stats.status === 'green') { bg = 'bg-lime-500/20'; border = 'border-lime-500/40'; }
                  if (day.stats.status === 'orange') { bg = 'bg-amber-500/20'; border = 'border-amber-500/40'; }
                  if (day.stats.status === 'red') { bg = 'bg-red-500/20'; border = 'border-red-500/40'; }
                }

                return (
                  <button 
                    key={i} 
                    onClick={() => handleDayClick(day)}
                    disabled={!day.stats}
                    className={`h-14 flex flex-col items-center justify-center rounded-xl border transition-all ${bg} ${border} ${day.stats ? 'hover:scale-105 cursor-pointer hover:bg-opacity-40' : 'opacity-50 cursor-default'}`}
                  >
                    <span className={`text-sm font-medium ${day.stats ? 'text-white' : 'text-white/30'}`}>{day.dayNum}</span>
                    {day.stats && <span className="text-[10px] font-bold mt-1 text-white/80">{day.stats.score}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Modal Dettaglio Giorno */}
          {selectedDayInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#12121a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <button 
                  onClick={() => setSelectedDayInfo(null)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 rounded-full p-2"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="p-6 border-b border-white/10 bg-white/5">
                  <h2 className="text-xl font-bold text-white mb-1">
                    {new Date(selectedDayInfo.dateStr).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                  <p className="text-white/50 text-sm">Score: <strong className="text-white">{selectedDayInfo.stats.score}/100</strong></p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-wider font-bold mb-2">Nutrienti da Migliorare / Bassi</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDayInfo.stats.comparison.missing.map(k => (
                        <span key={k} className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs border border-red-500/30">
                          {engine.NUTRIENT_LABELS[k] || k}
                        </span>
                      ))}
                      {selectedDayInfo.stats.comparison.low.map(k => (
                        <span key={k} className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30">
                          {engine.NUTRIENT_LABELS[k] || k}
                        </span>
                      ))}
                      {selectedDayInfo.stats.comparison.missing.length === 0 && selectedDayInfo.stats.comparison.low.length === 0 && (
                        <span className="text-lime-400 text-sm">Nessuna carenza grave registrata.</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-wider font-bold mb-2">Nutrienti OK</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDayInfo.stats.comparison.ok.slice(0, 10).map(k => (
                        <span key={k} className="px-2 py-1 rounded bg-lime-500/10 text-lime-400 text-xs border border-lime-500/20">
                          {engine.NUTRIENT_LABELS[k] || k}
                        </span>
                      ))}
                      {selectedDayInfo.stats.comparison.ok.length > 10 && <span className="text-white/40 text-xs mt-1">+{selectedDayInfo.stats.comparison.ok.length - 10} altri</span>}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
