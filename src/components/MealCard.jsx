import { Coffee, Sun, Moon, Cookie, Pencil, Trash2, ImageOff } from 'lucide-react';
import NutrientBar from './NutrientBar';

const MEAL_ICONS = {
  breakfast: { icon: Coffee,  label: 'Colazione', color: '#f59e0b' },
  lunch:     { icon: Sun,     label: 'Pranzo',    color: '#22d3ee' },
  dinner:    { icon: Moon,    label: 'Cena',      color: '#818cf8' },
  snack:     { icon: Cookie,  label: 'Spuntino',  color: '#f472b6' },
};

/**
 * Card component for a meal entry.
 *
 * @param {object}   props
 * @param {object|null} props.meal
 * @param {Function} [props.onEdit]
 * @param {Function} [props.onDelete]
 * @param {boolean}  [props.compact=false]
 */
export default function MealCard({ meal, onEdit, onDelete, compact = false }) {
  if (!meal) {
    return (
      <div className="glass-card-static p-6 flex flex-col items-center justify-center text-center min-h-[140px]">
        <ImageOff className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">Nessun pasto registrato</p>
      </div>
    );
  }

  const {
    id,
    food_name,
    meal_type,
    quantity_grams,
    calories,
    proteins,
    fats,
    carbs,
    fiber,
    photo_url,
    entry_date,
    notes,
    foods,
  } = meal;

  const mealMeta = MEAL_ICONS[meal_type] || MEAL_ICONS.snack;
  const MealIcon = mealMeta.icon;
  const displayName = food_name || foods?.name || 'Alimento sconosciuto';

  const formattedDate = entry_date
    ? new Date(entry_date).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <div className="glass-card p-4 animate-slide-up">
      <div className="flex gap-3">
        {/* Photo / Icon */}
        <div className="shrink-0">
          {photo_url ? (
            <img
              src={photo_url}
              alt={displayName}
              className="w-14 h-14 rounded-xl object-cover border border-white/[0.06]"
              loading="lazy"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: `${mealMeta.color}15` }}
            >
              <MealIcon className="w-6 h-6" style={{ color: mealMeta.color }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-200 truncate">
                {displayName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="badge text-[11px]"
                  style={{
                    background: `${mealMeta.color}18`,
                    color: mealMeta.color,
                  }}
                >
                  {mealMeta.label}
                </span>
                {quantity_grams != null && (
                  <span className="text-xs text-slate-500">{quantity_grams}g</span>
                )}
                {formattedDate && (
                  <span className="text-xs text-slate-600">{formattedDate}</span>
                )}
              </div>
            </div>

            {/* Calories */}
            <div className="text-right shrink-0">
              <span className="text-lg font-bold text-slate-100 tabular-nums">
                {calories != null ? calories : '--'}
              </span>
              <span className="text-xs text-slate-500 ml-0.5">kcal</span>
            </div>
          </div>

          {/* Macro bars (compact: inline mini bars) */}
          {compact ? (
            <div className="flex gap-3 mt-2.5">
              <MacroMini label="P" value={proteins} color="#22c55e" />
              <MacroMini label="G" value={fats}     color="#f59e0b" />
              <MacroMini label="C" value={carbs}     color="#3b82f6" />
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <NutrientBar label="Proteine"      current={proteins} target={proteins} unit="g" color="#22c55e" size="sm" showPercentage={false} />
              <NutrientBar label="Grassi"        current={fats}     target={fats}     unit="g" color="#f59e0b" size="sm" showPercentage={false} />
              <NutrientBar label="Carboidrati"   current={carbs}    target={carbs}    unit="g" color="#3b82f6" size="sm" showPercentage={false} />
              <NutrientBar label="Fibre"         current={fiber}    target={fiber}    unit="g" color="#a855f7" size="sm" showPercentage={false} />
            </div>
          )}

          {/* Notes */}
          {notes && !compact && (
            <p className="mt-2 text-xs text-slate-500 italic line-clamp-2">{notes}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
          {onEdit && (
            <button
              onClick={() => onEdit(meal)}
              className="btn-ghost !px-3 !py-1.5 !text-xs !rounded-lg group"
              aria-label="Modifica pasto"
            >
              <Pencil className="w-3.5 h-3.5 group-hover:text-accent-cyan transition-colors" />
              <span>Modifica</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="btn-ghost !px-3 !py-1.5 !text-xs !rounded-lg group hover:!border-red-500/30"
              aria-label="Elimina pasto"
            >
              <Trash2 className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" />
              <span>Elimina</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Compact macro pill ── */
function MacroMini({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span className="text-xs text-slate-400">
        <span className="font-semibold text-slate-300">{label}</span>{' '}
        {value != null ? `${value}g` : '--'}
      </span>
    </div>
  );
}
