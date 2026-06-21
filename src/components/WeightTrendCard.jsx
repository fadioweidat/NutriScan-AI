import { Scale, Activity, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

export default function WeightTrendCard({ analysis, trend = 'stable' }) {
  if (!analysis) return null;

  const { weightKg, bmi, bmiClass, bmrEstimate, dailyOutflow, netCalorieBalance, insights } = analysis;

  const getBmiBg = (bmiVal) => {
    if (bmiVal >= 18.5 && bmiVal < 25) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (bmiVal >= 25 && bmiVal < 30) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  const getBalanceColor = (balance) => {
    if (balance > 150) return 'text-orange-400';
    if (balance < -150) return 'text-emerald-400';
    return 'text-cyan-400';
  };

  return (
    <div className="glass-card p-5 relative overflow-hidden space-y-5" role="region" aria-label="Analisi Peso & Bilancio Calorico (Wearables)">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />

      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5 border-b border-white/[0.04] pb-3">
        <Scale className="w-4 h-4 text-cyan-400" /> Analisi Peso & Bilancio Energetico
      </h3>

      {/* Row of stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Weight */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl text-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Peso Attuale</span>
          <div className="flex items-center justify-center gap-1">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-sm font-black text-white">{weightKg} <span className="text-[9px] text-slate-500 font-normal">kg</span></span>
          </div>
        </div>

        {/* BMI */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl text-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">BMI</span>
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-sm font-black text-white">{bmi}</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${getBmiBg(bmi)}`}>
              {bmiClass}
            </span>
          </div>
        </div>

        {/* Caloric Balance */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl text-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Bilancio</span>
          <div className="flex items-center justify-center gap-0.5">
            <span className={`text-sm font-black ${getBalanceColor(netCalorieBalance)}`}>
              {netCalorieBalance > 0 ? `+${netCalorieBalance}` : netCalorieBalance}
            </span>
            <span className="text-[9px] text-slate-500 font-normal">kcal</span>
          </div>
        </div>
      </div>

      {/* Metabolic details */}
      <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-400">
          <span>Stima BMR (Metabolismo Basale):</span>
          <span className="font-bold text-white">{bmrEstimate} kcal</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Outflow Energetico (Consumo Totale):</span>
          <span className="font-bold text-white">{dailyOutflow} kcal</span>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Analisi Energetica</span>
        {insights.length === 0 ? (
          <div className="p-3 text-center rounded-xl bg-white/[0.01] border border-white/[0.03]">
            <p className="text-xs text-slate-500 italic">Nessun dato sul bilancio calorico registrato.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {insights.map((ins, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] flex gap-2.5 items-start"
              >
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">{ins.title}</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{ins.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
