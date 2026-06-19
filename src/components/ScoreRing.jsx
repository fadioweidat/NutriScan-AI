import { useMemo } from 'react';

/**
 * Animated SVG circular score display.
 *
 * @param {object} props
 * @param {number|null} props.score      – Score 0-100
 * @param {number}      [props.size=120] – SVG diameter in px
 * @param {string}      [props.label]    – Label below score
 * @param {boolean}     [props.showGrade=false]
 */
export default function ScoreRing({
  score,
  size = 120,
  label,
  showGrade = false,
}) {
  const hasScore = score != null && !isNaN(score);
  const clampedScore = hasScore ? Math.max(0, Math.min(100, Math.round(score))) : 0;

  const strokeWidth = Math.max(6, size * 0.07);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedScore / 100) * circumference;

  const { color, grade } = useMemo(() => {
    if (!hasScore) return { color: '#475569', grade: '--' };
    if (clampedScore >= 80) return { color: '#22c55e', grade: 'A' };
    if (clampedScore >= 60) return { color: '#84cc16', grade: 'B' };
    if (clampedScore >= 40) return { color: '#f59e0b', grade: 'C' };
    if (clampedScore >= 20) return { color: '#f97316', grade: 'D' };
    return { color: '#ef4444', grade: 'E' };
  }, [clampedScore, hasScore]);

  const center = size / 2;
  const scoreFontSize = size * 0.28;
  const gradeFontSize = size * 0.14;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block"
        >
          {/* Background ring */}
          <circle
            className="score-ring-bg"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
          />

          {/* Filled ring */}
          <circle
            className="score-ring-fill"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              '--circumference': circumference,
              '--dash-offset': dashOffset,
            }}
          />
        </svg>

        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <span
            className="font-bold tabular-nums leading-none"
            style={{
              fontSize: scoreFontSize,
              color: hasScore ? '#f1f5f9' : '#475569',
            }}
          >
            {hasScore ? clampedScore : '--'}
          </span>

          {showGrade && (
            <span
              className="font-bold leading-none mt-1"
              style={{
                fontSize: gradeFontSize,
                color,
              }}
            >
              {grade}
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-sm font-medium text-slate-400 text-center">
          {label}
        </span>
      )}
    </div>
  );
}
