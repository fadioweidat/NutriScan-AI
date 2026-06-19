import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import engine from '../lib/nutrition-engine';
import NutrientBar from '../components/NutrientBar';
import MealCard from '../components/MealCard';
import {
  ChevronLeft, ChevronRight, CalendarDays, Plus,
  Coffee, Sun, Moon, Cookie, Loader2, Trash2
} from 'lucide-react';

const MEAL_SECTIONS = [
  { key: 'breakfast', label: 'Colazione', icon: Coffee },
  { key: 'lunch', label: 'Pranzo', icon: Sun },
  { key: 'dinner', label: 'Cena', icon: Moon },
  { key: 'snack', label: 'Snack', icon: Cookie },
];

function formatDateIT(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0];
}

export default function DailyDiaryPage() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [allMeals, setAllMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadMeals = useCallback(async () => {
    setLoading(true);
    try {
      if (profile && profile.id) {
        const { data, error } = await supabase
          .from('meal_entries')
          .select('*, foods(*, food_nutrients(*))')
          .eq('user_id', profile.id)
          .order('entry_date', { ascending: false });
        
        if (error) throw error;
        
        // Formatta i pasti per essere compatibili col resto dell'UI (che usa nutrients calcolati)
        const formattedMeals = data.map(m => {
           const nutrients = engine.calculateMealNutrients(m.foods, m.quantity_grams);
           return { 
             ...m, 
             nutrients, 
             calories: nutrients?.calories != null ? Math.round(nutrients.calories) : null,
             proteins: nutrients?.proteins != null ? Math.round(nutrients.proteins) : null,
             carbs: nutrients?.carbs != null ? Math.round(nutrients.carbs) : null,
             fats: nutrients?.fats != null ? Math.round(nutrients.fats) : null,
             fiber: nutrients?.fiber != null ? Math.round(nutrients.fiber) : null
           };
        });
        setAllMeals(formattedMeals || []);
      }
    } catch (err) {
      console.error('Errore caricamento pasti:', err);
      setAllMeals([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const dayMeals = useMemo(
    () => allMeals.filter((m) => m.entry_date === selectedDate),
    [allMeals, selectedDate]
  );

  const rda = useMemo(() => engine.getRDA(profile), [profile]);
  const dailyTotals = useMemo(() => engine.calculateDailyTotals(dayMeals.map(m => m.nutrients)), [dayMeals]);
  const comparison = useMemo(() => engine.compareWithRDA(dailyTotals, rda), [dailyTotals, rda]);

  const navigateDate = (direction) => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = async (mealId) => {
    if (confirmDeleteId !== mealId) {
      setConfirmDeleteId(mealId);
      return;
    }

    setDeletingId(mealId);
    try {
      const { error } = await supabase.from('meal_entries').delete().eq('id', mealId);
      if (error) throw error;
      setAllMeals((prev) => prev.filter((m) => m.id !== mealId));
    } catch (err) {
      console.error('Errore eliminazione pasto:', err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Build nutrient status badges
  const nutrientBadges = useMemo(() => {
    if (!comparison) return { ok: [], low: [], missing: [] };
    const ok = [];
    const low = [];
    const missing = [];

    const checkNutrient = (label, percent) => {
      if (percent >= 80) ok.push(label);
      else if (percent >= 30) low.push(label);
      else missing.push(label);
    };

    if (comparison.proteins) checkNutrient('Proteine', comparison.proteins.percent);
    if (comparison.carbs) checkNutrient('Carboidrati', comparison.carbs.percent);
    if (comparison.fats) checkNutrient('Grassi', comparison.fats.percent);
    if (comparison.fiber) checkNutrient('Fibre', comparison.fiber.percent);

    if (comparison.vitamins) {
      const vitaminLabels = {
        vitamin_a: 'Vit. A', vitamin_c: 'Vit. C', vitamin_d: 'Vit. D',
        vitamin_e: 'Vit. E', vitamin_k: 'Vit. K', vitamin_b12: 'Vit. B12',
      };
      Object.entries(comparison.vitamins).forEach(([key, data]) => {
        if (vitaminLabels[key] && data?.percent !== undefined) {
          checkNutrient(vitaminLabels[key], data.percent);
        }
      });
    }

    if (comparison.minerals) {
      const mineralLabels = {
        calcium: 'Calcio', iron: 'Ferro', magnesium: 'Magnesio',
        zinc: 'Zinco', potassium: 'Potassio',
      };
      Object.entries(comparison.minerals).forEach(([key, data]) => {
        if (mineralLabels[key] && data?.percent !== undefined) {
          checkNutrient(mineralLabels[key], data.percent);
        }
      });
    }

    return { ok, low, missing };
  }, [comparison]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Date Navigator */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <CalendarDays className="w-4 h-4 text-lime-400" />
              <span className="text-white font-semibold capitalize">
                {formatDateIT(selectedDate)}
              </span>
            </div>
            {!isToday(selectedDate) && (
              <button
                onClick={goToToday}
                className="text-lime-400 text-xs mt-1 hover:text-lime-300 transition-colors"
              >
                Torna a oggi
              </button>
            )}
          </div>

          <button
            onClick={() => navigateDate(1)}
            disabled={isToday(selectedDate)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Meal Sections */}
      {MEAL_SECTIONS.map((section) => {
        const Icon = section.icon;
        const sectionMeals = dayMeals.filter((m) => m.meal_type === section.key);
        return (
          <div key={section.key}>
            <div className="flex items-center gap-2 mb-3 ml-1">
              <Icon className="w-4 h-4 text-white/50" />
              <h3 className="text-white/70 text-sm font-medium">{section.label}</h3>
              {sectionMeals.length > 0 && (
                <span className="text-white/30 text-xs">
                  ({sectionMeals.reduce((sum, m) => sum + (m.calories || 0), 0).toFixed(0)} kcal)
                </span>
              )}
            </div>
            {sectionMeals.length > 0 ? (
              <div className="space-y-2">
                {sectionMeals.map((meal) => (
                  <div key={meal.id} className="relative group">
                    <MealCard meal={meal} />
                    <button
                      onClick={() => handleDelete(meal.id)}
                      disabled={deletingId === meal.id}
                      className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${
                        confirmDeleteId === meal.id
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-white/30 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title={confirmDeleteId === meal.id ? 'Clicca di nuovo per confermare' : 'Elimina pasto'}
                    >
                      {deletingId === meal.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    {confirmDeleteId === meal.id && (
                      <span className="absolute top-14 right-3 text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                        Clicca di nuovo per eliminare
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                <p className="text-white/30 text-sm">
                  Nessun pasto per {section.label.toLowerCase()}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Daily Totals */}
      {dayMeals.length > 0 && (
        <div>
          <h3 className="text-white/70 text-sm font-medium mb-3 ml-1">
            Totali del giorno
          </h3>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4">
            {/* Calories */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Calorie</span>
              <span className="text-white font-semibold">
                {Math.round(dailyTotals.calories)} / {Math.round(rda.calories)} kcal
              </span>
            </div>
            <NutrientBar
              label="Calorie"
              current={Math.round(dailyTotals.calories)}
              target={Math.round(rda.calories)}
              unit="kcal"
              color="orange"
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <NutrientBar label="Proteine" current={dailyTotals.proteins?.toFixed(1)} target={rda.proteins} unit="g" color="lime" />
              <NutrientBar label="Carboidrati" current={dailyTotals.carbs?.toFixed(1)} target={rda.carbs} unit="g" color="cyan" />
              <NutrientBar label="Grassi" current={dailyTotals.fats?.toFixed(1)} target={rda.fats} unit="g" color="amber" />
              <NutrientBar label="Fibre" current={dailyTotals.fiber?.toFixed(1)} target={rda.fiber} unit="g" color="emerald" />
            </div>
          </div>
        </div>
      )}

      {/* Mini Report: Nutrient Status Badges */}
      {dayMeals.length > 0 && (
        <div>
          <h3 className="text-white/70 text-sm font-medium mb-3 ml-1">
            Stato nutrienti
          </h3>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
            {nutrientBadges.ok.length > 0 && (
              <div>
                <span className="text-xs text-green-400 font-medium">✓ Adeguato</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {nutrientBadges.ok.map((n) => (
                    <span key={n} className="px-2 py-1 text-xs rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {nutrientBadges.low.length > 0 && (
              <div>
                <span className="text-xs text-yellow-400 font-medium">⚠ Basso</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {nutrientBadges.low.map((n) => (
                    <span key={n} className="px-2 py-1 text-xs rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {nutrientBadges.missing.length > 0 && (
              <div>
                <span className="text-xs text-red-400 font-medium">✗ Carente</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {nutrientBadges.missing.map((n) => (
                    <span key={n} className="px-2 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <Link
        to="/add-meal"
        className="fixed bottom-6 right-6 z-50 p-4 bg-lime-500 hover:bg-lime-400 text-black rounded-2xl shadow-2xl shadow-lime-500/30 transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
