import { Activity, Moon, BatteryCharging, AlertCircle } from 'lucide-react';

export default function RecoveryCard({ metrics }) {
  if (!metrics) return null;

  const { recoveryScore, fatigueScore, sleepDebt } = metrics;

  // Compute color based on recovery status
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-500';
    if (score >= 50) return 'text-amber-400 stroke-amber-500';
    return 'text-rose-400 stroke-rose-500';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
  };

  const circumference = 2 * Math.PI * 34; // r=34 -> ~213.6
  const strokeDashoffset = circumference - (recoveryScore / 100) * circumference;

  return (
    <div className="glass-card p-5 relative overflow-hidden space-y-5" role="region" aria-label="Analisi Stato di Recupero (Wearables)">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5 border-b border-white/[0.04] pb-3">
        <BatteryCharging className="w-4 h-4 text-indigo-400" /> Recupero & Stanchezza
      </h3>

      <div className="flex items-center justify-between gap-6">
        {/* Left: Score Circle */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-20 h-20 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r="34"
              className="stroke-white/[0.04]"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Foreground circle */}
            <circle
              cx="40"
              cy="40"
              r="34"
              className={`transition-all duration-500 ${getScoreColor(recoveryScore)}`}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-black text-white">{recoveryScore}</span>
            <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Score</span>
          </div>
        </div>

        {/* Right: Summary details */}
        <div className="flex-1 space-y-3.5">
          {/* Fatigue */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Indice di Affaticamento:</span>
              <span className="font-bold text-slate-200">{fatigueScore} / 100</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-400 transition-all duration-500" 
                style={{ width: `${fatigueScore}%` }}
              />
            </div>
          </div>

          {/* Sleep debt */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" /> Debito di Sonno:
            </span>
            <span className="text-xs font-bold text-white">
              {sleepDebt > 0 ? `+${sleepDebt} ore` : 'Nessuno'}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic educational suggestion based on score */}
      <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${getScoreBg(recoveryScore)}`}>
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            {recoveryScore >= 80 
              ? "Pronto per l'attività! Il tuo corpo registra un eccellente recupero muscolare ed autonomico. Ottima giornata per carichi allenanti elevati."
              : recoveryScore >= 50
              ? "Recupero moderato. Consigliati allenamenti a media intensità o sessioni di mobilità. Mantieni controllata l'idratazione."
              : "Affaticamento elevato. Si raccomanda riposo attivo ed esercizi di respirazione. Un sonno riparatore di almeno 8 ore aiuterà a smaltire la fatica."
            }
          </span>
        </div>
      </div>
    </div>
  );
}
