import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ReferenceLine,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

/**
 * Recharts-based nutrient visualization.
 *
 * @param {object}  props
 * @param {Array}   props.data   – Chart data
 * @param {'bar'|'radar'|'line'} props.type
 * @param {string}  [props.title]
 */
export default function NutrientChart({ data, type, title }) {
  if (!data || data.length === 0) {
    return <EmptyState title={title} />;
  }

  return (
    <div className="glass-card-static p-5 animate-fade-in">
      {title && (
        <h3 className="text-sm font-semibold text-slate-200 mb-4">{title}</h3>
      )}

      <div className="w-full" style={{ height: type === 'radar' ? 320 : 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' && <HorizontalBarChart data={data} />}
          {type === 'radar' && <NutrientRadarChart data={data} />}
          {type === 'line' && <TrendLineChart data={data} />}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Bar Chart – horizontal current vs target
   ────────────────────────────────────────────── */
function HorizontalBarChart({ data }) {
  return (
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="rgba(255,255,255,0.04)"
        horizontal={false}
      />
      <XAxis
        type="number"
        tick={{ fill: '#94a3b8', fontSize: 11 }}
        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
        tickLine={false}
      />
      <YAxis
        dataKey="name"
        type="category"
        width={80}
        tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 500 }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip content={<CustomBarTooltip />} />
      <Bar
        dataKey="current"
        name="Attuale"
        fill="#84cc16"
        radius={[0, 6, 6, 0]}
        barSize={14}
      />
      <Bar
        dataKey="target"
        name="Obiettivo"
        fill="rgba(255,255,255,0.08)"
        radius={[0, 6, 6, 0]}
        barSize={14}
      />
    </BarChart>
  );
}

/* ──────────────────────────────────────────────
   Radar Chart – vitamins / minerals
   ────────────────────────────────────────────── */
function NutrientRadarChart({ data }) {
  // Normalize data to percentages for radar display
  const normalized = data.map((d) => ({
    name: d.name,
    value: d.target > 0 ? Math.round((d.current / d.target) * 100) : 0,
    fullMark: 100,
  }));

  return (
    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={normalized}>
      <PolarGrid stroke="rgba(255,255,255,0.06)" />
      <PolarAngleAxis
        dataKey="name"
        tick={{ fill: '#94a3b8', fontSize: 11 }}
      />
      <PolarRadiusAxis
        angle={90}
        tick={{ fill: '#64748b', fontSize: 10 }}
        axisLine={false}
        domain={[0, 100]}
      />
      <Radar
        name="% Obiettivo"
        dataKey="value"
        stroke="#84cc16"
        fill="#84cc16"
        fillOpacity={0.2}
        strokeWidth={2}
      />
      <Tooltip content={<CustomRadarTooltip />} />
    </RadarChart>
  );
}

/* ──────────────────────────────────────────────
   Line Chart – weekly trends
   ────────────────────────────────────────────── */
function TrendLineChart({ data }) {
  const hasTarget = data.some((d) => d.target != null);

  return (
    <LineChart
      data={data}
      margin={{ top: 8, right: 20, left: 4, bottom: 4 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="rgba(255,255,255,0.04)"
      />
      <XAxis
        dataKey="date"
        tick={{ fill: '#94a3b8', fontSize: 11 }}
        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
        tickLine={false}
      />
      <YAxis
        tick={{ fill: '#94a3b8', fontSize: 11 }}
        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
        tickLine={false}
      />
      <Tooltip content={<CustomLineTooltip />} />
      <Legend
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
      />
      <Line
        type="monotone"
        dataKey="value"
        name="Valore"
        stroke="#84cc16"
        strokeWidth={2}
        dot={{ fill: '#84cc16', r: 3, strokeWidth: 0 }}
        activeDot={{ r: 5, fill: '#84cc16', stroke: '#0a0a0f', strokeWidth: 2 }}
      />
      {hasTarget && (
        <ReferenceLine
          y={data[0]?.target}
          stroke="#22d3ee"
          strokeDasharray="6 4"
          strokeWidth={1.5}
          label={{
            value: 'Obiettivo',
            fill: '#22d3ee',
            fontSize: 11,
            position: 'insideTopRight',
          }}
        />
      )}
    </LineChart>
  );
}

/* ──────────────────────────────────────────────
   Custom Tooltips
   ────────────────────────────────────────────── */
function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-static px-3 py-2 text-xs">
      <p className="font-semibold text-slate-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color }} className="flex gap-2">
          <span>{p.name}:</span>
          <span className="font-semibold">
            {p.value} {payload[0]?.payload?.unit || ''}
          </span>
        </p>
      ))}
    </div>
  );
}

function CustomRadarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-static px-3 py-2 text-xs">
      <p className="font-semibold text-slate-200">
        {payload[0]?.payload?.name}
      </p>
      <p className="text-accent mt-0.5">{payload[0]?.value}% dell'obiettivo</p>
    </div>
  );
}

function CustomLineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-static px-3 py-2 text-xs">
      <p className="font-semibold text-slate-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.stroke }} className="flex gap-2">
          <span>{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Empty state
   ────────────────────────────────────────────── */
function EmptyState({ title }) {
  return (
    <div className="glass-card-static p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
      {title && (
        <h3 className="text-sm font-semibold text-slate-200 mb-4">{title}</h3>
      )}
      <BarChart3 className="w-10 h-10 text-slate-600 mb-3" />
      <p className="text-sm text-slate-500">Nessun dato disponibile</p>
    </div>
  );
}
