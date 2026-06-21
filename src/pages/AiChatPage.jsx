import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import engine from '../lib/nutrition-engine';
import SubscriptionManager from '../lib/operations/subscription-manager.js';
import healthEngine from '../lib/health-engine';
import lifestyleEngine from '../lib/lifestyle-engine';
import medicalKnowledgeEngine from '../lib/engines/medical-knowledge-engine';
import scientificNutritionEngine from '../lib/engines/scientific-nutrition-engine';
import { getHealthCoachContext } from '../lib/engines/health-coach-engine';
import { buildDigitalTwinContext } from '../lib/engines/digital-twin-engine';
import { computePredictiveTrends } from '../lib/engines/predictive-health-engine';
import { forecastBiomarkers } from '../lib/engines/forecast-engine';
import { runSimulation } from '../lib/engines/simulation-engine';
import dailyScoreEngine from '../lib/engines/daily-score-engine';
import { buildEvidenceContext } from '../lib/engines/scientific-knowledge-engine';
import { buildRagContext } from '../lib/engines/rag-engine';
import { buildExplainabilityContext } from '../lib/engines/scientific-explainability-engine';
import { buildKnowledgeUpdateContext } from '../lib/engines/knowledge-update-manager';
import ScientificEvidenceCard from '../components/ScientificEvidenceCard';

// Phase 8 Imports
import manager from '../lib/connectors/health-provider-manager';
import { calculateRecoveryMetrics } from '../lib/engines/recovery-engine';
import { analyzeActivity } from '../lib/engines/activity-intelligence-engine';
import { analyzeHeartMetrics } from '../lib/engines/heart-intelligence-engine';
import { analyzeWeightMetrics } from '../lib/engines/weight-intelligence-engine';

import { Send, Bot, User, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

const QUICK_PROMPTS = [
  "Cosa mi manca oggi?",
  "Come posso aumentare il magnesio?",
  "Come posso aumentare la vitamina D?",
  "Quali sono le mie priorità nutrizionali?",
  "Cosa posso mangiare stasera?",
  "Sono in Keto, cosa devo monitorare?",
  "Sono in Carnivore, cosa devo monitorare?"
];

export default function AiChatPage() {
  const { user, profile } = useAuth();
  
  const [hasMeals, setHasMeals] = useState(null);
  const [contextData, setContextData] = useState(null);
  const [scientificDashboard, setScientificDashboard] = useState(null);
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ciao! Sono il tuo assistente nutrizionale. Posso aiutarti a capire cosa ti manca oggi o suggerirti come colmare i tuoi fabbisogni con alimenti specifici.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    async function prepareContext() {
      // Fetch 90 days of history for digital twin and longitudinal trends
      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cutoff90Str = ninetyDaysAgo.toISOString().split('T')[0];

      // Helper to fetch meal planner data concurrently
      const fetchMealPlannerContext = async (userId) => {
        const getMondayOfCurrentWeek = () => {
          const d = new Date();
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const mon = new Date(d.setDate(diff));
          return mon.toISOString().split('T')[0];
        };
        const mondayStr = getMondayOfCurrentWeek();

        const { data: plans } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start', mondayStr)
          .order('created_at', { ascending: false });

        if (plans && plans.length > 0) {
          const activePlan = plans[0];

          const [daysRes, listRes] = await Promise.all([
            supabase.from('meal_plan_days').select('*').eq('meal_plan_id', activePlan.id).order('created_at', { ascending: true }),
            supabase.from('shopping_lists').select('id').eq('meal_plan_id', activePlan.id)
          ]);

          let listItems = [];
          if (listRes.data && listRes.data.length > 0) {
            const { data: items } = await supabase
              .from('shopping_list_items')
              .select('*')
              .eq('shopping_list_id', listRes.data[0].id);
            listItems = items || [];
          }

          const days = daysRes.data || [];
          return {
            diet_type: activePlan.diet_type,
            calories_target: activePlan.calories_target,
            days: days.map(d => ({
              day: d.day_of_week,
              breakfast: d.breakfast?.name || '',
              lunch: d.lunch?.name || '',
              dinner: d.dinner?.name || '',
              snacks: d.snacks?.name || '',
              macros: { Kcal: d.calories, Prot: d.proteins, Carbs: d.carbs, Fats: d.fats }
            })),
            shopping_list: listItems.map(item => ({ alimento: item.alimento, quantita: item.quantita, categoria: item.categoria, completato: item.completato }))
          };
        }
        return null;
      };

      // Parallelize baseline context fetches over 90 days
      const [
        mealsRes,
        healthContext,
        lifestyleContext,
        healthCoachContext,
        mealPlannerContext,
        sleepLogsRes,
        stressLogsRes,
        hydrationLogsRes,
        activityLogsRes,
        reportsRes
      ] = await Promise.all([
        supabase
          .from('meal_entries')
          .select(`
            *,
            foods (*, food_nutrients (*))
          `)
          .gte('entry_date', cutoff90Str),
        healthEngine.getFullHealthContext(user.id).catch(e => { console.error(e); return null; }),
        lifestyleEngine.getTodayLifestyleContext(user.id).catch(e => { console.error(e); return null; }),
        getHealthCoachContext(supabase, user.id).catch(e => { console.error(e); return null; }),
        fetchMealPlannerContext(user.id).catch(e => { console.error(e); return null; }),
        supabase.from('sleep_logs').select('*').eq('user_id', user.id).gte('entry_date', cutoff90Str),
        supabase.from('stress_logs').select('*').eq('user_id', user.id).gte('entry_date', cutoff90Str),
        supabase.from('hydration_logs').select('*').eq('user_id', user.id).gte('entry_date', cutoff90Str),
        supabase.from('activity_logs').select('*').eq('user_id', user.id).gte('entry_date', cutoff90Str),
        supabase.from('blood_test_reports').select('*').eq('user_id', user.id).order('test_date', { ascending: false })
      ]);

      const meals = mealsRes.data || [];
      if (meals.length === 0) {
        setHasMeals(false);
        return;
      }

      setHasMeals(true);

      // Check and sync connected wearables on load
      const connectedProviders = await manager.getConnectedProviders(supabase).catch(() => []);
      let aggregatedWearableData = [];
      for (const providerId of connectedProviders) {
        try {
          const pData = await manager.syncMetrics(supabase, providerId, 90);
          aggregatedWearableData = [...aggregatedWearableData, ...pData];
        } catch (e) {
          console.error(`Errore caricamento wearable ${providerId} in chat:`, e);
        }
      }
      const finalWearableData = aggregatedWearableData.length > 0
        ? manager.deduplicateAndMapMetrics(aggregatedWearableData)
        : [];

      const sleepLogs = sleepLogsRes.data || [];
      const stressLogs = stressLogsRes.data || [];
      const hydrationLogs = hydrationLogsRes.data || [];
      const activityLogs = activityLogsRes.data || [];
      const reports = reportsRes.data || [];

      // Fetch historical biomarkers
      let historicalBiomarkers = [];
      const reportIds = reports.map(r => r.id);
      if (reportIds.length > 0) {
        const { data: bRes } = await supabase
          .from('blood_test_biomarkers')
          .select('*')
          .in('report_id', reportIds);
        historicalBiomarkers = bRes || [];
      }

      // Group meals by date
      const mealsByDate = {};
      meals.forEach(entry => {
        const date = entry.entry_date;
        if (!mealsByDate[date]) mealsByDate[date] = [];
        if (entry.foods) {
          mealsByDate[date].push({
            quantity_grams: entry.quantity_grams,
            ...entry.foods
          });
        }
      });

      const dietType = profile?.diet_type || 'standard';

      // Reconstruct meals with nutrients for today
      const todayStr = today.toISOString().split('T')[0];
      const todayMeals = meals.filter(m => m.entry_date === todayStr);

      const reconstructMeals = (mealEntries) => {
         return mealEntries.map(m => {
             const food = m.foods;
             const nutrients = engine.calculateMealNutrients(food, m.quantity_grams);
             return { ...m, nutrients };
         });
      };

      const todayReconstructed = reconstructMeals(todayMeals);
      const todayTotals = engine.calculateDailyTotals(todayReconstructed);
      
      const medicalContext = medicalKnowledgeEngine.generateMedicalContext(healthContext);
      const scientificContext = scientificNutritionEngine.generateScientificContext(healthContext, lifestyleContext);
      const knowledgeUpdateContext = buildKnowledgeUpdateContext();
      
      const rda = engine.getRDA(profile, healthContext);
      const score = engine.calculateNutritionScore(todayTotals, profile);
      const comparison = engine.compareWithRDA(todayTotals, profile);

      // Build history logs for predictive engine
      const historyLogs = [];
      const dateCursor = new Date(ninetyDaysAgo);
      const todayObj = new Date();

      while (dateCursor <= todayObj) {
        const dateStr = dateCursor.toISOString().split('T')[0];
        const dayMeals = mealsByDate[dateStr] || [];
        const dayTotals = dayMeals.length > 0 ? engine.calculateDailyTotals(dayMeals) : null;
        
        const daySleep = sleepLogs.find(l => l.entry_date === dateStr);
        const dayStress = stressLogs.find(l => l.entry_date === dateStr);
        const dayHydration = hydrationLogs.find(l => l.entry_date === dateStr);
        const dayActivities = activityLogs.filter(l => l.entry_date === dateStr);

        const matchingWearable = finalWearableData.find(w => w.date === dateStr);

        const sleepHours = daySleep 
          ? Number(daySleep.duration_hours || 0) 
          : (matchingWearable ? matchingWearable.sleepHours : 0);
        const sleepQuality = daySleep 
          ? Number(daySleep.quality_score || 0) 
          : (matchingWearable ? matchingWearable.sleepQuality : 0);
        const activeMinutes = dayActivities.reduce((sum, act) => sum + Number(act.duration_minutes || 0), 0)
          || (matchingWearable ? matchingWearable.activeMinutes : 0);
        const weightKg = matchingWearable?.weightKg || profile?.weight_kg || 75;

        const healthScore = dailyScoreEngine.calculateDailyHealthScore({
          totals: dayTotals,
          dietType,
          meals: dayMeals,
          sleepLog: daySleep || (matchingWearable ? { duration_hours: sleepHours, quality_score: sleepQuality } : null),
          stressLog: dayStress,
          hydrationLog: dayHydration,
          activityLogs: dayActivities.length > 0 ? dayActivities : (matchingWearable ? [{ duration_minutes: activeMinutes }] : []),
          conditions: healthContext?.conditions || []
        });

        const sugarGrams = dayTotals ? (dayTotals.sugar || dayTotals.sugar_g || 0) : 0;

        historyLogs.push({
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
          hrv: matchingWearable?.hrv || 55,
          restingHeartRate: matchingWearable?.restingHeartRate || 65,
          averageHeartRate: matchingWearable?.averageHeartRate || 75,
          activeCalories: matchingWearable?.activeCalories || 0
        });

        dateCursor.setDate(dateCursor.getDate() + 1);
      }

      // Compute Phase 6 twin contexts
      const digitalTwin = buildDigitalTwinContext({
        profile,
        conditions: healthContext?.conditions,
        allergies: healthContext?.allergies,
        medications: healthContext?.medications,
        supplements: healthContext?.supplements,
        reports,
        biomarkers: historicalBiomarkers.filter(b => b.report_id === (reports[0]?.id)),
        sleepLogs,
        stressLogs,
        hydrationLogs,
        activityLogs,
        mealsHistory: meals
      });

      const predictiveTrends = computePredictiveTrends({ historyLogs });
      const biomarkersForecast = forecastBiomarkers({ reports, historicalBiomarkers });
      const defaultSimulation = runSimulation(score, { sleepDeltaHours: 1, waterDeltaMl: 500 });

      // Calculate priorities over 7 days
      const allReconstructed = reconstructMeals(meals.filter(m => m.entry_date >= todayStr)); // recent
      const daysMap = {};
      allReconstructed.forEach(m => {
        if (!daysMap[m.entry_date]) daysMap[m.entry_date] = [];
        daysMap[m.entry_date].push(m);
      });
      const daysTotals = Object.values(daysMap).map(dayMeals => engine.calculateDailyTotals(dayMeals));
      const avgTotals = engine.calculateAverageTotals(daysTotals);
      const priorities = engine.getTopNutritionalPriorities(avgTotals, rda, 3, profile);

      const cleanedHealthContext = {
        conditions: (healthContext?.conditions || []).map(c => ({ condition_name: c.condition_name, diagnosed_date: c.diagnosed_date })),
        allergies: (healthContext?.allergies || []).map(a => ({ allergy_name: a.allergy_name, severity: a.severity })),
        intolerances: (healthContext?.intolerances || []).map(i => ({ intolerance_name: i.intolerance_name, severity: i.severity })),
        medications: (healthContext?.medications || []).map(m => ({ medication_name: m.medication_name, dosage: m.dosage, frequency: m.frequency })),
        supplements: (healthContext?.supplements || []).map(s => ({ supplement_name: s.supplement_name, dosage: s.dosage, frequency: s.frequency }))
      };

      // Today wearable metrics
      const todayWearable = finalWearableData.find(w => w.date === todayStr);

      const todayLog = historyLogs.find(l => l.date === todayStr);
      const sleepHoursToday = todayLog ? todayLog.sleepHours : (todayWearable ? todayWearable.sleepHours : 7);
      const sleepQualityToday = todayLog ? todayLog.sleepQuality : (todayWearable ? todayWearable.sleepQuality : 70);
      const hrvToday = todayWearable ? todayWearable.hrv : 55;
      const activeMinutesToday = todayLog ? todayLog.activeMinutes : (todayWearable ? todayWearable.activeMinutes : 30);
      const stressLevelToday = todayLog ? todayLog.stressLevel : 5;
      const activeCaloriesToday = todayWearable ? todayWearable.activeCalories : 250;
      const waterMlToday = todayLog ? todayLog.waterMl : 1500;
      const sugarGramsToday = todayLog ? todayLog.sugarGrams : 20;
      const healthScoreToday = todayLog ? todayLog.healthScore : 75;
      const workoutsCountToday = todayWearable ? todayWearable.workouts : 0;
      const weightKgToday = todayWearable?.weightKg || profile?.weight_kg || 75;
      const heightCmToday = profile?.height_cm || 175;
      const mealsCaloriesToday = todayTotals ? Math.round(todayTotals.calories || todayTotals.kcal || 0) : 0;

      const recoveryContext = calculateRecoveryMetrics({
        sleepHours: sleepHoursToday,
        sleepQuality: sleepQualityToday,
        hrv: hrvToday,
        activeMinutes: activeMinutesToday,
        stressLevel: stressLevelToday
      });

      const activityContext = analyzeActivity({
        activeMinutes: activeMinutesToday,
        activeCalories: activeCaloriesToday,
        sleepHours: sleepHoursToday,
        waterMl: waterMlToday,
        sugarGrams: sugarGramsToday,
        healthScore: healthScoreToday,
        workoutsCount: workoutsCountToday
      });

      const heartContext = analyzeHeartMetrics({
        restingHeartRate: todayWearable ? todayWearable.restingHeartRate : 65,
        averageHeartRate: todayWearable ? todayWearable.averageHeartRate : 75,
        hrv: hrvToday,
        stressLevel: stressLevelToday
      });

      const weightContext = analyzeWeightMetrics({
        weightKg: weightKgToday,
        heightCm: heightCmToday,
        mealsCalories: mealsCaloriesToday,
        activeCalories: activeCaloriesToday,
        sleepHours: sleepHoursToday,
        targetWeight: profile?.target_weight || null
      });

      const wearableContext = {
        connectedProviders,
        todayMetrics: todayWearable || null
      };

      setContextData({
        diet: profile?.diet_type || 'standard',
        healthContext: cleanedHealthContext,
        lifestyleContext: {
          sleep: lifestyleContext?.sleep,
          stress: lifestyleContext?.stress,
          hydration: lifestyleContext?.hydration,
          activity: lifestyleContext?.activity,
          digestion: lifestyleContext?.digestion
        },
        medicalContext: medicalContext,
        scientificContext: scientificContext,
        knowledgeUpdateContext,
        healthCoachContext: healthCoachContext,
        mealPlannerContext: mealPlannerContext,
        score: score,
        todayTotals: todayTotals,
        okNutrients: comparison.ok,
        improveNutrients: comparison.low,
        missingNutrients: comparison.missing,
        sevenDayPriorities: priorities,
        digitalTwinContext: digitalTwin,
        predictiveContext: predictiveTrends,
        forecastContext: biomarkersForecast,
        simulationContext: defaultSimulation,
        
        // Phase 8 Wearable Contexts
        wearableContext,
        recoveryContext,
        activityContext,
        heartContext,
        weightContext
      });
    }

    if (user) prepareContext();
  }, [user, profile]);

  const handleSend = async (text = input) => {
    if (!text.trim() || loading) return;

    const tier = SubscriptionManager.getUserTier(user);
    const userMessagesCount = messages.filter(m => m.role === 'user').length;
    if (tier === 'free' && userMessagesCount >= 5) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: "Hai esaurito i 5 messaggi giornalieri del piano Free. Esegui l'upgrade a Pro per avere messaggi illimitati con il tuo AI Health Coach." }
      ]);
      setInput('');
      return;
    }

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const scientificQuery = [
        text,
        contextData?.improveNutrients?.join(' '),
        contextData?.missingNutrients?.join(' '),
        contextData?.diet
      ].filter(Boolean).join(' ');
      const evidenceContext = buildEvidenceContext(scientificQuery);
      const ragContext = buildRagContext(scientificQuery);
      const explainabilityContext = buildExplainabilityContext(ragContext);
      const enrichedContext = {
        ...contextData,
        evidenceContext,
        ragContext,
        explainabilityContext
      };

      setScientificDashboard({
        evidenceContext,
        knowledgeContext: contextData?.knowledgeUpdateContext
      });

      const { data, error } = await supabase.functions.invoke('ai-nutrition-chat', {
        body: { 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: enrichedContext
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error("Errore chat:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Scusa, si è verificato un errore temporaneo di connessione. Riprova." }]);
    } finally {
      setLoading(false);
    }
  };

  if (hasMeals === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  if (hasMeals === false) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50"></div>
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Dati Insufficienti</h2>
          <p className="text-white/60 mb-6">Aggiungi almeno un pasto per ricevere un’analisi nutrizionale.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-[140px])] min-h-[600px] flex flex-col bg-[#0a0a0f] rounded-3xl border border-white/10 overflow-hidden mt-6 shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">NutriScan AI</h1>
          <p className="text-cyan-400/80 text-sm font-medium">Assistente Personale</p>
        </div>
      </div>

      {scientificDashboard && (
        <div className="px-6 pt-4 shrink-0">
          <ScientificEvidenceCard
            evidenceContext={scientificDashboard.evidenceContext}
            knowledgeContext={scientificDashboard.knowledgeContext}
          />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-lime-500/20 shadow-lime-500/10' : 'bg-cyan-500/20 shadow-cyan-500/10'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-lime-400" /> : <Bot className="w-5 h-5 text-cyan-400" />}
            </div>
            <div className={`max-w-[80%] rounded-3xl p-5 ${msg.role === 'user' ? 'bg-lime-500 text-black rounded-tr-sm' : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl rounded-tl-sm p-5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" />
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-6 shrink-0 bg-white/5 border-t border-white/10">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Chiedi all'AI..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-5 pr-16 text-white text-base focus:outline-none focus:border-cyan-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 w-12 h-12 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 text-black disabled:text-white/30 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-cyan-500/20 disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
