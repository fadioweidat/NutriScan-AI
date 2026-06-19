import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import engine from '../lib/nutrition-engine';

import NutritionalScoreCard from '../components/dashboard/NutritionalScoreCard';
import NutritionalPriorities from '../components/dashboard/NutritionalPriorities';
import FixTodayCard from '../components/dashboard/FixTodayCard';
import MiniTrendCard from '../components/dashboard/MiniTrendCard';
import MacroSummaryCard from '../components/dashboard/MacroSummaryCard';
import LifestyleSummaryCard from '../components/dashboard/LifestyleSummaryCard';
import lifestyleEngine from '../lib/lifestyle-engine';
import healthEngine from '../lib/health-engine';
import medicalKnowledgeEngine from '../lib/engines/medical-knowledge-engine';

import { Plus, FileBarChart, Sparkles, BrainCircuit, Activity, Salad, Loader2, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const safeProfile = profile || {
    age: 30,
    sex: 'male',
    weight_kg: 75,
    height_cm: 175,
    activity_level: 'moderato',
    diet_type: 'standard'
  };

  const [hasAnyMeal, setHasAnyMeal] = useState(false);
  const [weeklyMeals, setWeeklyMeals] = useState([]);
  const [todayMeals, setTodayMeals] = useState([]);
  const [foods, setFoods] = useState([]);
  const [lifestyleContext, setLifestyleContext] = useState(null);
  const [drugWarnings, setDrugWarnings] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // 1. Controllo se l'utente ha mai inserito un pasto in assoluto (per l'Onboarding)
      const { count } = await supabase
        .from('meal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setHasAnyMeal(count > 0);

      if (count === 0) {
        setLoading(false);
        return; // Fermati qui, mostreremo l'onboarding
      }

      // Fetch lifestyle data
      const ls = await lifestyleEngine.getTodayLifestyleContext(user.id);
      setLifestyleContext(ls);

      // Fetch active medications and check interactions
      const meds = await healthEngine.getMedications(user.id);
      const activeMeds = (meds || []).filter(m => m.is_active);
      const warnings = medicalKnowledgeEngine.checkMedicationInteractions(activeMeds);
      setDrugWarnings(warnings);

      // 2. Fetch degli alimenti per i suggerimenti quantitativi
      const { data: foodsData } = await supabase
        .from('foods')
        .select(`
          id, name, category,
          calories, proteins, carbs, fats, fiber, water, omega3, omega6,
          food_nutrients ( nutrient_key, nutrient_name, amount, unit )
        `);
      setFoods(foodsData || []);

      // 3. Fetch pasti ultimi 7 giorni
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoffStr = sevenDaysAgo.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      const { data: mealsData } = await supabase
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
        .gte('entry_date', cutoffStr);

      const processedMeals = (mealsData || []).map(m => {
        if (!m.foods) return null;
        const calc = engine.calculateMealNutrients(m.foods, m.quantity_grams);
        return { ...calc, entry_date: m.entry_date };
      }).filter(Boolean);

      setWeeklyMeals(processedMeals);
      setTodayMeals(processedMeals.filter(m => m.entry_date === todayStr));

    } catch (err) {
      console.error("Errore caricamento dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const dailyTotals = useMemo(() => engine.calculateDailyTotals(todayMeals), [todayMeals]);
  
  const dietType = safeProfile.diet_type || 'standard';
  const dietConfig = engine.DIET_CONFIGS?.[dietType] || engine.DIET_CONFIGS?.['standard'] || {
    label: 'Standard',
    dashboardMetrics: { top: [], bottom: [] },
    ignoreLow: [],
    warnings: []
  };
  const rda = useMemo(() => engine.getRDA(safeProfile), [safeProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  // ── ONBOARDING / EMPTY STATE ──
  if (!hasAnyMeal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-surface-light to-surface border border-cyan-500/30 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl"></div>
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <BrainCircuit className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Scopri cosa manca alla tua alimentazione
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
            NutriScan AI analizza vitamine, minerali, fibre e trend nutrizionali per aiutarti a migliorare la tua alimentazione con dati reali.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
            {[
              { label: 'Vitamine', icon: Activity, color: 'text-lime-400' },
              { label: 'Minerali', icon: Sparkles, color: 'text-cyan-400' },
              { label: 'Fibre & Proteine', icon: Salad, color: 'text-emerald-400' },
              { label: 'Analisi AI & Trend', icon: FileBarChart, color: 'text-purple-400' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
                <item.icon className={`w-6 h-6 ${item.color}`} />
                <span className="text-white/80 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/add-meal')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-lime-500 hover:bg-lime-400 text-black text-lg font-bold rounded-xl transition-all shadow-xl shadow-lime-500/20 hover:scale-105"
          >
            <Plus className="w-6 h-6" />
            Aggiungi il primo pasto
          </button>
        </div>
      </div>
    );
  }

  // ── REAL DASHBOARD ──
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* 1. Nutritional Score */}
      <NutritionalScoreCard dailyTotals={dailyTotals} hasMeals={todayMeals.length > 0} profile={safeProfile} />

      {/* Drug Interactions Warning */}
      {drugWarnings.length > 0 && (
        <div className="bg-gradient-to-r from-red-500/10 to-amber-500/5 border border-red-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-2">Avviso Interazioni Farmaco-Alimento</h3>
              <div className="space-y-3">
                {drugWarnings.map((warning, idx) => (
                  <div key={idx} className="text-sm text-white/80 leading-relaxed">
                    <span className="font-semibold text-red-400">{warning.medication}</span> ↔ <span className="font-medium text-amber-400">{warning.interactsWith}</span>: {warning.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Macro e Calorie */}
      <div className="mb-4">
        <MacroSummaryCard dailyTotals={dailyTotals} rda={rda} dietConfig={dietConfig} />
      </div>

      <div className="mb-8">
        <LifestyleSummaryCard lifestyleContext={lifestyleContext} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 clear-both mb-6">
        {/* 3. Priorità Nutrizionali (7 Giorni) */}
        <NutritionalPriorities weeklyMeals={weeklyMeals} rda={rda} dietConfig={dietConfig} profile={safeProfile} />

        {/* 4. Correggi Oggi */}
        <FixTodayCard dailyTotals={dailyTotals} foods={foods} rda={rda} dietConfig={dietConfig} profile={safeProfile} />
      </div>

      {/* 5. Mini Trend (7 Giorni) - Full Width */}
      <div className="mt-6">
        <MiniTrendCard weeklyMeals={weeklyMeals} rda={rda} dietConfig={dietConfig} profile={safeProfile} />
      </div>
      
    </div>
  );
}
