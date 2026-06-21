import { Heart, Activity, ShieldAlert } from 'lucide-react';

export default function HeartSummary({ analysis }) {
  if (!analysis) return null;

  const { restingHeartRate, averageHeartRate, hrv, rhrStatus, hrvStatus, autonomicBalance, insights, disclaimer } = analysis;

  const getStatusColor = (status) => {
    switch (status) {
      case 'warning': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      default: return 'bg-white/5 border-white/[0.04] text-slate-300';
    }
  };

  return (
    <div className="glass-card p-5 relative overflow-hidden space-y-5" role="region" aria-label="Analisi Frequenza Cardiaca & HRV (Wearables)">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl" />

      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5 border-b border-white/[0.04] pb-3">
        <Heart className="w-4 h-4 text-rose-400" /> Analisi Cardiaca & HRV
      </h3>

      {/* Row of stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* RHR */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl text-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Battito Riposo</span>
          <div className="flex items-center justify-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/10" />
            <span className="text-sm font-black text-white">{restingHeartRate} <span className="text-[9px] text-slate-500 font-normal">bpm</span></span>
          </div>
        </div>

        {/* Avg HR */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl text-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Battito Medio</span>
          <div className="flex items-center justify-center gap-1">
            <Activity className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-sm font-black text-white">{averageHeartRate} <span className="text-[9px] text-slate-500 font-normal">bpm</span></span>
          </div>
        </div>

        {/* HRV */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl text-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">HRV Medio</span>
          <div className="flex items-center justify-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-sm font-black text-white">{hrv} <span className="text-[9px] text-slate-500 font-normal">ms</span></span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Stato Autonomico & HRV</span>
        {insights.length === 0 ? (
          <div className="p-3 text-center rounded-xl bg-white/[0.01] border border-white/[0.03]">
            <p className="text-xs text-slate-500 italic">Nessun dato cardiaco registrato.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {insights.map((ins, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl border space-y-1 ${getStatusColor(ins.status)}`}
              >
                <span className="text-xs font-bold text-white block">{ins.title}</span>
                <p className="text-[10px] text-slate-400 leading-relaxed">{ins.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical Disclaimer */}
      <div className="p-2.5 rounded-xl bg-rose-500/[0.02] border border-rose-500/10 text-[9px] text-rose-400/90 leading-normal flex gap-2">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
}
