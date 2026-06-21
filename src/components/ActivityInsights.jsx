import { Flame, Clock, Award, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function ActivityInsights({ analysis }) {
  if (!analysis) return null;

  const { volumeStatus, activeMinutes, activeCalories, workoutsCount, insights } = analysis;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default: return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'success': return 'bg-emerald-500/[0.02] border-emerald-500/10 text-slate-300';
      case 'warning': return 'bg-amber-500/[0.02] border-amber-500/10 text-slate-300';
      default: return 'bg-cyan-500/[0.02] border-cyan-500/10 text-slate-300';
    }
  };

  return (
    <div className="glass-card p-5 relative overflow-hidden space-y-5" role="region" aria-label="Analisi Attività Fisica (Wearables)">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />

      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5 border-b border-white/[0.04] pb-3">
        <Award className="w-4 h-4 text-emerald-400" /> Analisi ed Impatti Attività
      </h3>

      {/* Row of stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Active minutes */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl text-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Minuti Attivi</span>
          <div className="flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm font-black text-white">{activeMinutes}m</span>
          </div>
        </div>

        {/* Active Calories */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl text-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Calorie Bruciate</span>
          <div className="flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-sm font-black text-white">{activeCalories}</span>
          </div>
        </div>

        {/* Workouts count */}
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl text-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Sessioni</span>
          <div className="flex items-center justify-center gap-1">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-sm font-black text-white">{workoutsCount}</span>
          </div>
        </div>
      </div>

      {/* Correlation Insights */}
      <div className="space-y-3">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Correlazioni & Consigli</span>
        {insights.length === 0 ? (
          <div className="p-3 text-center rounded-xl bg-white/[0.01] border border-white/[0.03]">
            <p className="text-xs text-slate-500 italic">Sincronizza i dati dei wearables per calcolare le correlazioni.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {insights.map((ins, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl border flex gap-2.5 items-start ${getSeverityBg(ins.severity)}`}
              >
                {getSeverityIcon(ins.severity)}
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
