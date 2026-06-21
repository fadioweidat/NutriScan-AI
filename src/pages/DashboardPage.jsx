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
import { getHealthCoachContext } from '../lib/engines/health-coach-engine';
import AiHealthSummary from '../components/dashboard/AiHealthSummary';
import WeeklyMealPlanCard from '../components/dashboard/WeeklyMealPlanCard';

// Phase 6 Engine Imports
import { buildDigitalTwinContext } from '../lib/engines/digital-twin-engine';
import { computePredictiveTrends } from '../lib/engines/predictive-health-engine';
import { predictDeficiencies } from '../lib/engines/deficiency-prediction-engine';
import { forecastBiomarkers } from '../lib/engines/forecast-engine';
import { generateEarlyWarnings } from '../lib/engines/early-warning-engine';
import dailyScoreEngine from '../lib/engines/daily-score-engine';

// Phase 8 Engine Imports
import manager from '../lib/connectors/health-provider-manager';
import { calculateRecoveryMetrics, compileRecoveryTrend } from '../lib/engines/recovery-engine';
import { analyzeActivity } from '../lib/engines/activity-intelligence-engine';
import { analyzeHeartMetrics } from '../lib/engines/heart-intelligence-engine';
import { analyzeWeightMetrics, compileWeightTrend } from '../lib/engines/weight-intelligence-engine';

// Phase 6 UI Component Imports
import AiHealthTwinCard from '../components/AiHealthTwinCard';
import HealthTimeline from '../components/HealthTimeline';

// Phase 8 UI Component Imports
import WearablesCard from '../components/WearablesCard';
import RecoveryCard from '../components/RecoveryCard';
import ActivityInsights from '../components/ActivityInsights';
import HeartSummary from '../components/HeartSummary';
import WeightTrendCard from '../components/WeightTrendCard';

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
  const [coachContext, setCoachContext] = useState(null);

  // Phase 6 Health Twin States
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [predictiveTrends, setPredictiveTrends] = useState(null);
  const [deficiencies, setDeficiencies] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Phase 8 Wearables States
  const [wearableData, setWearableData] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cutoff90Str = ninetyDaysAgo.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      // Parallel fetch of all health records over 90 days
      const [
        countRes,
        lsRes,
        medsRes,
        suppsRes,
        conditionsRes,
        coachRes,
        foodsRes,
        mealsRes,
        sleepLogsRes,
        stressLogsRes,
        hydrationLogsRes,
        activityLogsRes,
        reportsRes
      ] = await Promise.all([
        supabase
          .from('meal_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        lifestyleEngine.getTodayLifestyleContext(user.id).catch(e => { console.error(e); return null; }),
        healthEngine.getMedications(user.id).catch(e => { console.error(e); return []; }),
        healthEngine.getSupplements(user.id).catch(e => { console.error(e); return []; }),
        healthEngine.getConditions(user.id).catch(e => { console.error(e); return []; }),
        getHealthCoachContext(supabase, user.id).catch(e => { console.error(e); return null; }),
        supabase
          .from('foods')
          .select(`
            id, name, category,
            calories, proteins, carbs, fats, fiber, water, omega3, omega6,
            food_nutrients ( nutrient_key, nutrient_name, amount, unit )
          `),
        supabase
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
          .gte('entry_date', cutoff90Str),
        supabase.from('sleep_logs').select('*').eq('user_id', user.id).gte('entry_date', cutoff90Str),
        supabase.from('stress_logs').select('*').eq('user_id', user.id).gte('entry_date', cutoff90Str),
        supabase.from('hydration_logs').select('*').eq('user_id', user.id).gte('entry_date', cutoff90Str),
        supabase.from('activity_logs').select('*').eq('user_id', user.id).gte('entry_date', cutoff90Str),
        supabase.from('blood_test_reports').select('*').eq('user_id', user.id).order('test_date', { ascending: false })
      ]);

      const count = countRes.count || 0;
      setHasAnyMeal(count > 0);

      if (count === 0) {
        setLoading(false);
        return; // Empty state onboarding
      }

      setLifestyleContext(lsRes);

      const activeMeds = (medsRes || []).filter(m => m.is_active);
      const warningsList = medicalKnowledgeEngine.checkMedicationInteractions(activeMeds);
      setDrugWarnings(warningsList);

      setCoachContext(coachRes);
      setFoods(foodsRes.data || []);

      const sleepLogs = sleepLogsRes.data || [];
      const stressLogs = stressLogsRes.data || [];
      const hydrationLogs = hydrationLogsRes.data || [];
      const activityLogs = activityLogsRes.data || [];
      const reports = reportsRes.data || [];
      const conditions = conditionsRes || [];
      const supplements = suppsRes || [];
      const medications = medsRes || [];

      // Fetch historical biomarkers for all reports
      let historicalBiomarkers = [];
      const reportIds = reports.map(r => r.id);
      if (reportIds.length > 0) {
        const { data: bRes } = await supabase
          .from('blood_test_biomarkers')
          .select('*')
          .in('report_id', reportIds);
        historicalBiomarkers = bRes || [];
      }

      // Check and sync connected wearables on load
      const connectedProviders = await manager.getConnectedProviders(supabase).catch(() => []);
      let aggregatedWearableData = [];
      for (const providerId of connectedProviders) {
        try {
          const pData = await manager.syncMetrics(supabase, providerId, 90);
          aggregatedWearableData = [...aggregatedWearableData, ...pData];
        } catch (e) {
          console.error(`Errore caricamento automatico wearable ${providerId}:`, e);
        }
      }
      
      let finalWearableData = [];
      if (aggregatedWearableData.length > 0) {
        finalWearableData = manager.deduplicateAndMapMetrics(aggregatedWearableData);
        setWearableData(finalWearableData);
      }

      // Group meals by date to calculate daily totals
      const mealsByDate = {};
      const processedMeals = (mealsRes.data || []).map(m => {
        if (!m.foods) return null;
        const calc = engine.calculateMealNutrients(m.foods, m.quantity_grams);
        const mealObj = { ...calc, entry_date: m.entry_date };
        
        const date = m.entry_date;
        if (!mealsByDate[date]) mealsByDate[date] = [];
        mealsByDate[date].push({
          quantity_grams: m.quantity_grams,
          ...m.foods
        });

        return mealObj;
      }).filter(Boolean);

      // Save processed meals for other layout charts (7 days cutoff for standard widgets)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoffStr = sevenDaysAgo.toISOString().split('T')[0];

      setWeeklyMeals(processedMeals.filter(m => m.entry_date >= cutoffStr));
      setTodayMeals(processedMeals.filter(m => m.entry_date === todayStr));

      // Calculate longitudinal history logs
      const calculatedLogs = [];
      const dateCursor = new Date(ninetyDaysAgo);
      const todayObj = new Date();
      const dietType = safeProfile.diet_type || 'standard';

      while (dateCursor <= todayObj) {
        const dateStr = dateCursor.toISOString().split('T')[0];
        const dayMeals = mealsByDate[dateStr] || [];
        const dayTotals = dayMeals.length > 0 ? engine.calculateDailyTotals(dayMeals) : null;
        
        const daySleep = sleepLogs.find(l => l.entry_date === dateStr);
        const dayStress = stressLogs.find(l => l.entry_date === dateStr);
        const dayHydration = hydrationLogs.find(l => l.entry_date === dateStr);
        const dayActivities = activityLogs.filter(l => l.entry_date === dateStr);
        const dayMeds = activeMeds.map(m => m.medication_name);
        const dayReport = reports.find(r => r.test_date === dateStr);
        const dayBiomarkers = dayReport ? historicalBiomarkers.filter(b => b.report_id === dayReport.id) : [];

        // Check if we have wearable data for this date
        const matchingWearable = finalWearableData.find(w => w.date === dateStr);

        const sleepHours = daySleep 
          ? Number(daySleep.duration_hours || 0) 
          : (matchingWearable ? matchingWearable.sleepHours : 0);
        const sleepQuality = daySleep 
          ? Number(daySleep.quality_score || 0) 
          : (matchingWearable ? matchingWearable.sleepQuality : 0);
        const activeMinutes = dayActivities.reduce((sum, act) => sum + Number(act.duration_minutes || 0), 0)
          || (matchingWearable ? matchingWearable.activeMinutes : 0);
        const weightKg = matchingWearable?.weightKg || safeProfile.weight_kg || 75;

        const healthScore = dailyScoreEngine.calculateDailyHealthScore({
          totals: dayTotals,
          dietType,
          meals: dayMeals,
          sleepLog: daySleep || (matchingWearable ? { duration_hours: sleepHours, quality_score: sleepQuality } : null),
          stressLog: dayStress,
          hydrationLog: dayHydration,
          activityLogs: dayActivities.length > 0 ? dayActivities : (matchingWearable ? [{ duration_minutes: activeMinutes }] : []),
          conditions: conditions
        });

        const sugarGrams = dayTotals ? (dayTotals.sugar || dayTotals.sugar_g || 0) : 0;

        calculatedLogs.push({
          date: dateStr,
          healthScore,
          sleepHours,
          sleepQuality,
          stressLevel: dayStress ? Number(dayStress.stress_level || 5) : 5,
          waterMl: dayHydration ? Number(dayHydration.water_ml || 0) : 0,
          activeMinutes,
          sugarGrams,
          nutritionalIndex: healthScore,
          weightKg,
          meals: dayMeals,
          medications: dayMeds,
          biomarkers: dayBiomarkers,
          hrv: matchingWearable?.hrv || 55,
          restingHeartRate: matchingWearable?.restingHeartRate || 65,
          averageHeartRate: matchingWearable?.averageHeartRate || 75,
          activeCalories: matchingWearable?.activeCalories || 0
        });

        dateCursor.setDate(dateCursor.getDate() + 1);
      }
      setHistoryLogs(calculatedLogs);

      // Calculate averages of nutrients over the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      let totalIron = 0, totalCalcium = 0, totalMagnesium = 0, totalOmega3 = 0, daysWithMeals = 0;
      Object.entries(mealsByDate).forEach(([dateStr, dayMeals]) => {
        if (dateStr >= thirtyDaysAgoStr && dayMeals.length > 0) {
          const totals = engine.calculateDailyTotals(dayMeals);
          if (totals) {
            daysWithMeals++;
            totalIron += totals.micronutrients?.iron || totals.iron || 0;
            totalCalcium += totals.micronutrients?.calcium || totals.calcio || 0;
            totalMagnesium += totals.micronutrients?.magnesium || totals.magnesio || 0;
            totalOmega3 += totals.omega3 || 0;
          }
        }
      });

      const recentNutrients = {
        iron: daysWithMeals > 0 ? totalIron / daysWithMeals : 12,
        calcium: daysWithMeals > 0 ? totalCalcium / daysWithMeals : 600,
        magnesium: daysWithMeals > 0 ? totalMagnesium / daysWithMeals : 250,
        omega3: daysWithMeals > 0 ? totalOmega3 / daysWithMeals : 0.1
      };

      // Construct Twin Context
      const digitalTwinCtx = buildDigitalTwinContext({
        profile: safeProfile,
        conditions,
        allergies: [],
        medications,
        supplements,
        reports,
        biomarkers: historicalBiomarkers.filter(b => b.report_id === (reports[0]?.id)),
        sleepLogs,
        stressLogs,
        hydrationLogs,
        activityLogs,
        mealsHistory: processedMeals
      });
      setDigitalTwin(digitalTwinCtx);

      // Run predictive trends and alerts
      const predictive = computePredictiveTrends({ historyLogs: calculatedLogs });
      setPredictiveTrends(predictive);

      const defs = predictDeficiencies({
        profile: safeProfile,
        conditions,
        medications,
        supplements,
        biomarkers: digitalTwinCtx.biomarkers,
        recentNutrients
      });
      setDeficiencies(defs);

      const fore = forecastBiomarkers({ reports, historicalBiomarkers });
      const warns = generateEarlyWarnings({
        predictiveTrends: predictive,
        deficiencies: defs,
        biomarkersForecast: fore
      });
      setWarnings(warns);

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

  const todayWearable = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return wearableData.find(w => w.date === todayStr);
  }, [wearableData]);

  const recoveryMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const daySleep = historyLogs.find(l => l.date === todayStr);
    const sleepHours = daySleep ? daySleep.sleepHours : (todayWearable ? todayWearable.sleepHours : 7);
    const sleepQuality = daySleep ? daySleep.sleepQuality : (todayWearable ? todayWearable.sleepQuality : 70);
    const hrv = todayWearable ? todayWearable.hrv : 55;
    const activeMinutes = daySleep ? daySleep.activeMinutes : (todayWearable ? todayWearable.activeMinutes : 30);
    const stressLevel = daySleep ? daySleep.stressLevel : 5;

    return calculateRecoveryMetrics({
      sleepHours,
      sleepQuality,
      hrv,
      activeMinutes,
      stressLevel
    });
  }, [historyLogs, todayWearable]);

  const activityAnalysis = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayLog = historyLogs.find(l => l.date === todayStr);
    const activeMinutes = dayLog ? dayLog.activeMinutes : (todayWearable ? todayWearable.activeMinutes : 30);
    const activeCalories = todayWearable ? todayWearable.activeCalories : 250;
    const sleepHours = dayLog ? dayLog.sleepHours : (todayWearable ? todayWearable.sleepHours : 7);
    const waterMl = dayLog ? dayLog.waterMl : 1500;
    const sugarGrams = dayLog ? dayLog.sugarGrams : 20;
    const healthScore = dayLog ? dayLog.healthScore : 75;
    const workoutsCount = todayWearable ? todayWearable.workouts : 0;

    return analyzeActivity({
      activeMinutes,
      activeCalories,
      sleepHours,
      waterMl,
      sugarGrams,
      healthScore,
      workoutsCount
    });
  }, [historyLogs, todayWearable]);

  const heartAnalysis = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayLog = historyLogs.find(l => l.date === todayStr);
    const restingHeartRate = todayWearable ? todayWearable.restingHeartRate : 65;
    const averageHeartRate = todayWearable ? todayWearable.averageHeartRate : 75;
    const hrv = todayWearable ? todayWearable.hrv : 55;
    const stressLevel = dayLog ? dayLog.stressLevel : 5;

    return analyzeHeartMetrics({
      restingHeartRate,
      averageHeartRate,
      hrv,
      stressLevel
    });
  }, [historyLogs, todayWearable]);

  const weightAnalysis = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayLog = historyLogs.find(l => l.date === todayStr);
    const weightKg = todayWearable?.weightKg || safeProfile.weight_kg || 75;
    const heightCm = safeProfile.height_cm || 175;
    const mealsCalories = dailyTotals ? Math.round(dailyTotals.calories || dailyTotals.kcal || 0) : 0;
    const activeCalories = todayWearable ? todayWearable.activeCalories : 300;
    const sleepHours = dayLog ? dayLog.sleepHours : (todayWearable ? todayWearable.sleepHours : 7);

    return analyzeWeightMetrics({
      weightKg,
      heightCm,
      mealsCalories,
      activeCalories,
      sleepHours,
      targetWeight: safeProfile.target_weight || null
    });
  }, [safeProfile, dailyTotals, historyLogs, todayWearable]);

  const weightTrend = useMemo(() => {
    const historyList = historyLogs.map(l => ({ weightKg: l.weightKg || safeProfile.weight_kg || 75 }));
    return compileWeightTrend(historyList);
  }, [historyLogs, safeProfile]);

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

      {/* Phase 6: AI Health Twin Premium Widget */}
      {digitalTwin && (
        <AiHealthTwinCard 
          digitalTwin={digitalTwin}
          predictiveTrends={predictiveTrends}
          deficiencies={deficiencies}
          warnings={warnings}
          currentScore={digitalTwin.healthScore || coachContext?.healthScore || dailyTotals?.healthScore || 70}
        />
      )}

      {/* AI Health Summary Widget */}
      {coachContext && <AiHealthSummary context={coachContext} />}

      {/* Phase 6: Longitudinal Health Timeline Charts */}
      {historyLogs.length > 0 && (
        <HealthTimeline historyLogs={historyLogs} />
      )}

      {/* Phase 8: Wearables and Health Ecosystem */}
      <div className="space-y-6" role="region" aria-label="Wearables and Health Ecosystem">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" /> Ecosystem & Wearables
        </h2>
        
        <WearablesCard supabase={supabase} onSyncComplete={loadDashboardData} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecoveryCard metrics={recoveryMetrics} />
          <ActivityInsights analysis={activityAnalysis} />
          <HeartSummary analysis={heartAnalysis} />
          <WeightTrendCard analysis={weightAnalysis} trend={weightTrend} />
        </div>
      </div>

      {/* Weekly Meal Plan Preview */}
      <WeeklyMealPlanCard />

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
