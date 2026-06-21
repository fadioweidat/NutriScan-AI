import { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Calendar, BarChart2, Activity, Moon, Droplet, Smile } from 'lucide-react';

export default function HealthTimeline({ historyLogs = [] }) {
  const [timeframe, setTimeframe] = useState(30); // 7 | 30 | 90 | 180 | 365

  // Filter and sort logs based on timeframe
  const filteredData = useMemo(() => {
    const sorted = [...historyLogs].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-timeframe);
  }, [historyLogs, timeframe]);

  // Format date for chart labels
  const formatXAxis = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface/90 border border-white/[0.08] backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            {new Date(data.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-lime-400" /> Health Score:
              </span>
              <span className="text-xs font-bold text-white">{data.healthScore}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sonno:
              </span>
              <span className="text-xs font-bold text-white">{data.sleepHours} ore</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-amber-400" /> Stress:
              </span>
              <span className="text-xs font-bold text-white">{data.stressLevel} / 10</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-cyan-400" /> Acqua:
              </span>
              <span className="text-xs font-bold text-white">{data.waterMl} ml</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header & Filter buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20">
            <BarChart2 className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              Analisi Longitudinale
            </h2>
            <p className="text-xs text-slate-400">Tracciamento storico e trend dei parametri di salute</p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 shrink-0">
          {[
            { label: '7 Giorni', value: 7 },
            { label: '30 Giorni', value: 30 },
            { label: '90 Giorni', value: 90 },
            { label: '6 Mesi', value: 180 },
            { label: '1 Anno', value: 365 }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTimeframe(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeframe === opt.value 
                  ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/15'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Health Score Area Chart */}
      <div className="space-y-2">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-lime-400" /> Andamento Health Score Quotidiano
        </span>
        <div className="h-[250px] w-full bg-white/[0.01] rounded-2xl border border-white/[0.02] p-4">
          {filteredData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
              Nessun dato storico registrato per questo intervallo temporale.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHealthScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis} 
                  stroke="rgba(255,255,255,0.2)" 
                  style={{ fontSize: '10px' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="rgba(255,255,255,0.2)" 
                  style={{ fontSize: '10px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="healthScore" 
                  stroke="#84cc16" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorHealthScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Sparklines / Lifestyle Parameter Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Sonno Medio', key: 'sleepHours', unit: 'h', color: 'text-indigo-400' },
          { label: 'Stress Medio', key: 'stressLevel', unit: '/10', color: 'text-amber-400' },
          { label: 'Acqua Totale', key: 'waterMl', unit: 'ml', color: 'text-cyan-400' },
          { label: 'Attività Media', key: 'activeMinutes', unit: 'm', color: 'text-emerald-400' }
        ].map((spark, idx) => {
          const avgVal = filteredData.length > 0
            ? filteredData.reduce((sum, d) => sum + (d[spark.key] || 0), 0) / filteredData.length
            : 0;

          return (
            <div key={idx} className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-4 space-y-1 text-center sm:text-left">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{spark.label}</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className={`text-lg font-black ${spark.color}`}>
                  {spark.key === 'waterMl' ? Math.round(avgVal) : avgVal.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400">{spark.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
