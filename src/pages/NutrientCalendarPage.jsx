import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import engine from '../lib/nutrition-engine';
import NutrientMap from '../components/NutrientMap';
import { AlertTriangle, Loader2, CalendarDays } from 'lucide-react';

export default function NutrientCalendarPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [foods, setFoods] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Data limit: ultimi 30 giorni
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isoDate = thirtyDaysAgo.toISOString().split('T')[0];

      // 1. Fetch pasti degli ultimi 30 giorni
      const { data: mealsData, error: mealsErr } = await supabase
        .from('meal_entries')
        .select(`
          id, quantity_grams, entry_date,
          foods (
            id, name, category,
            calories, proteins, carbs, fats, fiber, water, omega3, omega6,
            food_nutrients ( nutrient_key, nutrient_name, amount, unit )
          )
        `)
        .eq('user_id', user.id)
        .gte('entry_date', isoDate);

      if (mealsErr) throw mealsErr;

      // 2. Fetch di tutti gli alimenti per generare suggerimenti quantitativi
      const { data: foodsData, error: foodsErr } = await supabase
        .from('foods')
        .select(`
          id, name, category,
          calories, proteins, carbs, fats, fiber, water, omega3, omega6,
          food_nutrients ( nutrient_key, nutrient_name, amount, unit )
        `);

      if (foodsErr) throw foodsErr;

      // Processiamo i pasti con il nutrition engine
      const processedMeals = (mealsData || []).map(m => {
        if (!m.foods) return null;
        const calc = engine.calculateMealNutrients(m.foods, m.quantity_grams);
        return {
          ...calc,
          entry_date: m.entry_date
        };
      }).filter(Boolean);

      setMeals(processedMeals);
      setFoods(foodsData || []);

    } catch (err) {
      console.error("Errore caricamento dati mappa nutrienti:", err);
      setError("Impossibile caricare i dati della mappa nutrienti.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
        <p className="text-slate-400">Calcolo dati nutrizionali in corso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Mappa Nutrienti</h1>
        </div>
        <p className="text-slate-400">
          Analizza il tuo stato nutrizionale nel tempo e ricevi suggerimenti pratici.
        </p>
      </header>

      {meals.length === 0 ? (
        <div className="p-12 text-center bg-white/[0.02] border border-white/[0.05] rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-200 mb-2">Nessun dato disponibile</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Aggiungi almeno un pasto per vedere la Mappa Nutrienti.
          </p>
        </div>
      ) : (
        <NutrientMap meals={meals} foods={foods} profile={profile} />
      )}
    </div>
  );
}
