import { useMemo } from 'react';

/**
 * Animated progress bar for nutrient display.
 *
 * @param {object}  props
 * @param {string}  props.label          – Nutrient name (e.g. "Proteine")
 * @param {number|null} props.current    – Current intake
 * @param {number|null} props.target     – Target intake
 * @param {string}  props.unit           – Unit label (e.g. "g", "mg")
 * @param {string}  [props.color]        – Optional hex/tailwind override
 * @param {boolean} [props.showPercentage=true]
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
export default function NutrientBar({
  label,
  current,
  target,
  unit = 'g',
  color,
  showPercentage = true,
  size = 'md',
}) {
  const hasData = current != null && target != null && target > 0;

  const percentage = useMemo(() => {
    if (!hasData) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }, [current, target, hasData]);

  const rawPercentage = useMemo(() => {
    if (!hasData) return 0;
    return Math.round((current / target) * 100);
  }, [current, target, hasData]);

  // Auto color based on percentage of target
  const barColor = useMemo(() => {
    if (color) return color;
    if (percentage >= 80) return '#22c55e'; // green
    if (percentage >= 50) return '#f59e0b'; // yellow
    return '#ef4444';                        // red
  }, [percentage, color]);

  const sizeConfig = {
    sm: { track: 'h-1.5', text: 'text-xs', gap: 'gap-1' },
    md: { track: 'h-2.5', text: 'text-sm', gap: 'gap-1.5' },
    lg: { track: 'h-3.5', text: 'text-base', gap: 'gap-2' },
  };

  const s = sizeConfig[size] || sizeConfig.md;

  if (!hasData) {
    return (
      <div className={`${s.gap} flex flex-col`}>
        <div className="flex items-center justify-between">
          <span className={`${s.text} font-medium text-slate-300`}>{label || 'Nutriente'}</span>
          <span className={`${s.text} text-slate-500 italic`}>Dato non disponibile</span>
        </div>
        <div className={`nutrient-bar-track ${s.track}`}>
          <div className="nutrient-bar-fill h-full bg-slate-700/40" style={{ width: '0%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.gap} flex flex-col`}>
      <div className="flex items-center justify-between">
        <span className={`${s.text} font-medium text-slate-300`}>{label}</span>
        <div className="flex items-center gap-2">
          <span className={`${s.text} text-slate-400`}>
            <span className="text-slate-200 font-semibold">{current}</span>
            <span className="text-slate-500 mx-0.5">/</span>
            {target} {unit}
          </span>
          {showPercentage && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-md"
              style={{
                color: barColor,
                background: `${barColor}18`,
              }}
            >
              {rawPercentage}%
            </span>
          )}
        </div>
      </div>
      <div className={`nutrient-bar-track ${s.track}`}>
        <div
          className="nutrient-bar-fill h-full"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
          }}
        />
      </div>
    </div>
  );
}
