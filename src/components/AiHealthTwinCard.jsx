import { useState, useMemo } from 'react';
import { runSimulation } from '../lib/engines/simulation-engine';
import { getExplanation } from '../lib/engines/explainability-engine';
import { 
  BrainCircuit, 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  Activity, 
  TrendingUp, 
  Sliders, 
  UserCheck, 
  Info,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

export default function AiHealthTwinCard({ 
  digitalTwin,      // aggregated digital twin context
  predictiveTrends, // 7/30/90 days trend directions
  deficiencies,     // nutrient predictions
  warnings,         // early warnings list
  currentScore      // current health score
}) {
  // Simulator parameters state
  const [sleepDelta, setSleepDelta] = useState(0);
  const [waterDelta, setWaterDelta] = useState(0);
  const [activityDelta, setActivityDelta] = useState(0);
  const [sugarDelta, setSugarDelta] = useState(0);
  const [weightDelta, setWeightDelta] = useState(0);

  // Explanation Modal State
  const [explanationModal, setExplanationModal] = useState(null);

  // Compute simulation results
  const simulation = useMemo(() => {
    return runSimulation(currentScore || 70, {
      sleepDeltaHours: sleepDelta,
      waterDeltaMl: waterDelta,
      activeMinutesDelta: activityDelta,
      sugarReductionGrams: sugarDelta,
      weightLossKg: weightDelta
    });
  }, [currentScore, sleepDelta, waterDelta, activityDelta, sugarDelta, weightDelta]);

  // Handle open explanation modal
  const openExplanation = (type, item) => {
    let explData = {};
    if (type === 'deficiency') {
      explData = getExplanation('deficiency', item);
    } else if (type === 'warning') {
      explData = getExplanation('warning', item);
    }
    setExplanationModal(explData);
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden space-y-6" role="region" aria-label="Gemello Digitale della Salute">
      {/* Premium background glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-lime-500/5 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <BrainCircuit className="w-5 h-5 text-cyan-400 animate-pulse-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              Twin Nutrizionale AI
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Digital Twin
              </span>
            </h2>
            <p className="text-xs text-slate-400">Modello predittivo e simulatore dello stato di salute</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Stato Modello</span>
          <span className="text-xs font-bold text-lime-400 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> Sincronizzato
          </span>
        </div>
      </div>

      {/* Medical Disclaimer Alert Banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <p>
          <strong>Disclaimer Educativo:</strong> Il Gemello Digitale è un modello matematico predittivo a scopo informativo. Non effettua diagnosi cliniche, non prescrive terapie e non sostituisce il medico.
        </p>
      </div>

      {/* Main Grid: Twin Status & Forecasts / Early Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Predictions & Forecasts */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Previsioni & Andamenti
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '7 Giorni', status: predictiveTrends?.days_7?.healthScore || 'stable' },
              { label: '30 Giorni', status: predictiveTrends?.days_30?.healthScore || 'stable' },
              { label: '90 Giorni', status: predictiveTrends?.days_90?.healthScore || 'stable' }
            ].map((p, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-center">
                <span className="text-[10px] text-slate-400 block mb-1">{p.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                  p.status === 'improving' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  p.status === 'declining' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {p.status === 'improving' ? 'In Miglioramento' :
                   p.status === 'declining' ? 'In Calo' : 'Stabile'}
                </span>
              </div>
            ))}
          </div>

          {/* Deficiency Warnings Panel */}
          <div className="space-y-2.5">
            <span className="text-xs text-slate-400 font-medium block">Rischio Carenze Nutrizionali (Previsione)</span>
            <div className="space-y-2">
              {deficiencies.slice(0, 3).map((def, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      def.probability === 'high' ? 'bg-rose-500' :
                      def.probability === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-xs font-bold text-slate-200">{def.nutrient}</span>
                    <span className="text-[10px] text-slate-500">({def.timeHorizon})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      def.probability === 'high' ? 'bg-rose-500/15 text-rose-400' :
                      def.probability === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      Rischio {def.probability === 'high' ? 'Alto' : def.probability === 'medium' ? 'Medio' : 'Basso'}
                    </span>
                    <button 
                      onClick={() => openExplanation('deficiency', def)}
                      className="p-1 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      title="Spiegazione AI"
                      aria-label={`Spiegazione carenza ${def.nutrient}`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Early Warnings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" /> Segnali Preventivi & Alert
          </h3>
          
          <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
            {warnings.length === 0 ? (
              <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] text-center">
                <p className="text-xs text-slate-400">Nessun allarme preventivo attivo. Il modello registra parametri stabili.</p>
              </div>
            ) : (
              warnings.map((w, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5 hover:bg-white/[0.04] transition-colors relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {w.urgency === 'high' ? <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> : <Activity className="w-3.5 h-3.5 text-amber-400" />}
                      {w.title}
                    </span>
                    <button 
                      onClick={() => openExplanation('warning', w)}
                      className="p-1 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      title="Perché?"
                      aria-label={`Dettagli avviso ${w.title}`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{w.description}</p>
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span>Confidenza: {w.confidence}%</span>
                    <span className="text-cyan-400 font-medium">Consiglio preventivo all'interno</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Simulator Section */}
      <div className="border-t border-white/[0.06] pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-lime-400" /> Simulatore di Abitudini (What-If)
          </h3>
          {simulation.scoreDelta !== 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              simulation.scoreDelta > 0 ? 'bg-lime-500/20 text-lime-400' : 'bg-slate-500/20 text-slate-400'
            }`}>
              Impatto Stimato: {simulation.scoreDelta > 0 ? `+${simulation.scoreDelta}` : simulation.scoreDelta} punti
            </span>
          )}
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Sleep */}
          <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl space-y-2">
            <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Sonno Notturno</label>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">+{sleepDelta} ore</span>
            </div>
            <input 
              type="range" min="0" max="3" step="0.5" 
              value={sleepDelta} 
              onChange={e => setSleepDelta(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-lime-400"
              aria-label="Simulatore ore di sonno extra"
            />
          </div>

          {/* Water */}
          <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl space-y-2">
            <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Idratazione Extra</label>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">+{waterDelta} ml</span>
            </div>
            <input 
              type="range" min="0" max="1500" step="250" 
              value={waterDelta} 
              onChange={e => setWaterDelta(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-lime-400"
              aria-label="Simulatore idratazione extra"
            />
          </div>

          {/* Activity */}
          <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl space-y-2">
            <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Attività Extra</label>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">+{activityDelta} min</span>
            </div>
            <input 
              type="range" min="0" max="90" step="15" 
              value={activityDelta} 
              onChange={e => setActivityDelta(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-lime-400"
              aria-label="Simulatore attività fisica extra"
            />
          </div>

          {/* Sugars */}
          <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl space-y-2">
            <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Taglio Zuccheri</label>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">-{sugarDelta} g</span>
            </div>
            <input 
              type="range" min="0" max="50" step="5" 
              value={sugarDelta} 
              onChange={e => setSugarDelta(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-lime-400"
              aria-label="Simulatore taglio zuccheri"
            />
          </div>

          {/* Weight Loss */}
          <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl space-y-2">
            <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Calo Peso Ipo.</label>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">-{weightDelta} kg</span>
            </div>
            <input 
              type="range" min="0" max="10" step="1" 
              value={weightDelta} 
              onChange={e => setWeightDelta(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-lime-400"
              aria-label="Simulatore calo peso ipotetico"
            />
          </div>
        </div>

        {/* Simulation Output */}
        <div className="bg-lime-500/[0.02] border border-lime-500/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-lime-400 uppercase tracking-wider block">Effetto Combinato Simulato</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{simulation.potentialScore}</span>
              <span className="text-xs text-slate-400">/ 100 Health Score stimato</span>
            </div>
          </div>

          <div className="flex-1 md:max-w-xl text-xs text-slate-300 leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/[0.03]">
            {simulation.impactDetails.length === 0 ? (
              <span className="text-slate-500 italic">Sposta i controlli in alto per avviare la simulazione e vedere gli impatti previsti.</span>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {simulation.impactDetails.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Explanation Modal Overlay */}
      {explanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 shadow-2xl relative space-y-4 border border-cyan-500/30">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
              {explanationModal.title}
            </h4>
            
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Dati Utilizzati</span>
                <p className="bg-white/5 p-2 rounded-lg border border-white/5">{explanationModal.dataUsed}</p>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Spiegazione Logica</span>
                <p className="bg-white/5 p-2 rounded-lg border border-white/5">{explanationModal.reasoning}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Grado di Confidenza</span>
                  <p className="font-bold text-cyan-400">{explanationModal.confidence}%</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5 font-bold">Limiti Previsionali</span>
                  <p className="text-[10px] text-slate-400">{explanationModal.limits}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setExplanationModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                Chiudi Spiegazione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
