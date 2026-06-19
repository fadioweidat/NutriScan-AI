import { useState } from 'react';
import { 
  Activity, CheckCircle, TrendingUp, AlertTriangle, ShieldAlert, 
  HelpCircle, Compass, Droplet, Star, Clock, Info
} from 'lucide-react';

export default function AiHealthSummary({ context }) {
  if (!context) return null;

  const {
    healthScore = 50,
    riskLevel = 'LOW',
    dietCompliance = 100,
    priorities = [],
    trends = {},
    goals = { goals: [], completedCount: 0, totalCount: 0, percent: 0 },
    alerts = [],
    educationalSuggestions = []
  } = context;

  const [checkedPriorities, setCheckedPriorities] = useState({});

  const togglePriority = (index) => {
    setCheckedPriorities(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Determine colors based on Health Score
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-green-400 border-green-500/20 bg-green-500/5';
    if (score >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const getScoreRingColor = (score) => {
    if (score >= 80) return '#4ade80'; // green-400
    if (score >= 50) return '#fbbf24'; // amber-400
    return '#f43f5e'; // rose-500
  };

  // Determine colors based on Risk Level
  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
    }
  };

  // Determine trend text & color
  const renderTrendIndicator = (trendVal) => {
    if (trendVal === 'Migliorato') {
      return <span className="text-green-400 text-xs flex items-center gap-1">📈 Migliorato</span>;
    }
    if (trendVal === 'Peggiorato') {
      return <span className="text-rose-400 text-xs flex items-center gap-1">📉 Peggiorato</span>;
    }
    return <span className="text-white/40 text-xs flex items-center gap-1">➡️ Stabile</span>;
  };

  return (
    <div className="glass-card-static p-6 space-y-6 animate-fade-in relative overflow-hidden">
      
      {/* Glow background accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-lime-400" />
          <h3 className="text-sm font-semibold text-slate-200">AI Health Summary 2.0</h3>
        </div>
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Real-Time Coach</span>
      </div>

      {/* Active Medical Alerts Box */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-xs">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Score and Main Indicators Ring row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Score Circular Ring */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="46"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="46"
                stroke={getScoreRingColor(healthScore)}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - healthScore / 100)}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white font-mono">{healthScore}</span>
              <span className="text-[10px] text-white/40">Health Score</span>
            </div>
          </div>
        </div>

        {/* Risk Level and Diet Compliance cards */}
        <div className="md:col-span-2 space-y-4">
          {/* Risk Level */}
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
            <span className="text-xs text-white/60">Risk Level Educativo:</span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getRiskBadgeClass(riskLevel)}`}>
              {riskLevel}
            </span>
          </div>

          {/* Diet Adherence */}
          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Aderenza alla Dieta:</span>
              <span className="font-bold text-lime-400 font-mono">{dietCompliance}%</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-lime-500 h-full transition-all duration-500" 
                style={{ width: `${dietCompliance}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Priorities Checklist */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-lime-400" /> Priorità di Oggi
        </h4>
        <div className="space-y-2 bg-white/[0.01] border border-white/5 p-4 rounded-3xl">
          {priorities.map((p, idx) => {
            const isChecked = checkedPriorities[idx] || false;
            return (
              <div 
                key={idx}
                onClick={() => togglePriority(idx)}
                className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                  isChecked ? 'bg-white/5 opacity-50' : 'hover:bg-white/[0.02]'
                }`}
              >
                <button 
                  className={`w-4 h-4 rounded border mt-0.5 shrink-0 transition-all flex items-center justify-center ${
                    isChecked 
                      ? 'border-lime-500 bg-lime-500 text-black' 
                      : 'border-white/20 hover:border-white/40 bg-transparent'
                  }`}
                >
                  {isChecked && (
                    <svg className="w-2.5 h-2.5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className={`text-[11px] leading-relaxed text-left ${isChecked ? 'line-through text-white/40' : 'text-white/80'}`}>
                  {p.replace(/^\d+\.\s*/, '')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trends & Goals Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Trends */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-3xl space-y-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-lime-400" /> Trend Storico (30gg)
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-[11px]">Salute Generale</span>
              {renderTrendIndicator(trends.healthScore)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-[11px]">Sonno</span>
              {renderTrendIndicator(trends.sleep)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-[11px]">Stress</span>
              {renderTrendIndicator(trends.stress)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-[11px]">Idratazione</span>
              {renderTrendIndicator(trends.hydration)}
            </div>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
              <CheckCircle className="w-3.5 h-3.5 text-lime-400" /> Obiettivi di Oggi
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-white/50 text-[11px]">
                <span>Completati oggi:</span>
                <span className="text-white font-semibold font-mono">{goals.completedCount} su {goals.totalCount}</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-lime-500 h-full transition-all duration-500" 
                  style={{ width: `${goals.percent || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-lime-500/5 border border-lime-500/10 p-2.5 rounded-xl text-center text-[10px] text-lime-400 font-medium">
            🎯 {goals.percent}% degli obiettivi completati
          </div>
        </div>

      </div>

      {/* Educational Insight panel */}
      {educationalSuggestions.length > 0 && (
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-3xl space-y-2.5">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-lime-400" /> Spiegazioni Educative
          </h4>
          <div className="space-y-2">
            {educationalSuggestions.map((suggestion, i) => (
              <div key={i} className="text-[11px] text-white/70 leading-relaxed pl-3 border-l border-lime-500/30">
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
