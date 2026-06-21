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
import { 
  BarChart2, 
  Activity, 
  Moon, 
  Droplet, 
  Smile, 
  Scale, 
  Dumbbell, 
  Utensils, 
  Pill, 
  Stethoscope 
} from 'lucide-react';

export default function HealthTimeline({ historyLogs = [] }) {
  const [timeframe, setTimeframe] = useState(30); // 7 | 30 | 90 | 180 | 365
  const [activeMetric, setActiveMetric] = useState('healthScore'); // healthScore | sleepHours | stressLevel | waterMl | activeMinutes | weightKg

  const metricsConfig = {
    healthScore: { label: 'Health Score', color: '#84cc16', icon: <Activity className="w-3.5 h-3.5" />, domain: [0, 100], unit: '' },
    sleepHours: { label: 'Sonno', color: '#6366f1', icon: <Moon className="w-3.5 h-3.5" />, domain: [0, 12], unit: ' ore' },
    stressLevel: { label: 'Stress', color: '#f59e0b', icon: <Smile className="w-3.5 h-3.5" />, domain: [0, 10], unit: ' / 10' },
    waterMl: { label: 'Idratazione', color: '#06b6d4', icon: <Droplet className="w-3.5 h-3.5" />, domain: [0, 3000], unit: ' ml' },
    activeMinutes: { label: 'Attività', color: '#10b981', icon: <Dumbbell className="w-3.5 h-3.5" />, domain: [0, 120], unit: ' min' },
    weightKg: { label: 'Peso', color: '#ec4899', icon: <Scale className="w-3.5 h-3.5" />, domain: [40, 150], unit: ' kg' }
  };

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

  // Custom Tooltip component showing multi-dimensional daily details
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const currentVal = data[activeMetric] !== undefined ? data[activeMetric] : 'N/D';
      const config = metricsConfig[activeMetric];

      return (
        <div className="bg-surface/90 border border-white/[0.08] backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl space-y-2.5 max-w-xs text-xs">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            {new Date(data.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span className="text-slate-400 font-medium">Valore selezionato:</span>
            <span className="font-extrabold text-white flex items-center gap-1">
              {config.icon}
              {currentVal}{config.unit}
            </span>
          </div>

          {/* Details list */}
          <div className="space-y-1.5 pt-0.5">
            {/* Meals */}
            <div className="flex items-start gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 font-semibold">Pasti: </span>
                <span className="text-slate-300">
                  {data.meals && data.meals.length > 0 
                    ? data.meals.map(m => m.name || m.alimento).slice(0, 2).join(', ') + (data.meals.length > 2 ? '...' : '')
                    : 'Nessun pasto loggato'}
                </span>
              </div>
            </div>

            {/* Medications / Supplements */}
            <div className="flex items-start gap-1.5">
              <Pill className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 font-semibold">Farmaci/Integratori: </span>
                <span className="text-slate-300">
                  {data.medications && data.medications.length > 0 
                    ? data.medications.slice(0, 2).join(', ')
                    : 'Nessuno attivo'}
                </span>
              </div>
            </div>

            {/* Biomarkers */}
            {data.biomarkers && data.biomarkers.length > 0 && (
              <div className="flex items-start gap-1.5 border-t border-white/[0.04] pt-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 font-semibold">Biomarcatori: </span>
                  <span className="text-cyan-400 font-bold">
                    {data.biomarkers.map(b => `${b.biomarker_name}: ${b.value} ${b.unit}`).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const activeConfig = metricsConfig[activeMetric];

  return (
    <div className="glass-card p-6 space-y-6" role="region" aria-label="Analisi Storica Longitudinale">
      {/* Header & Filter buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20">
            <BarChart2 className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              Analisi Longitudinale 2.0
            </h2>
            <p className="text-xs text-slate-400">Monitoraggio dei parametri di salute, pasti ed esami nel tempo</p>
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

      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(metricsConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMetric === key
                ? 'bg-white/10 border-white/20 text-white shadow-xl shadow-white/[0.02]'
                : 'bg-white/[0.01] border-white/[0.03] text-slate-400 hover:text-slate-200'
            }`}
            aria-label={`Visualizza andamento di ${config.label}`}
          >
            {config.icon}
            {config.label}
          </button>
        ))}
      </div>

      {/* Main Area Chart */}
      <div className="space-y-2">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          {activeConfig.icon}
          Andamento {activeConfig.label} ({timeframe} giorni)
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
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.0}/>
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
                  domain={activeConfig.domain} 
                  stroke="rgba(255,255,255,0.2)" 
                  style={{ fontSize: '10px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric} 
                  stroke={activeConfig.color} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorMetric)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Averages Summary Row */}
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
