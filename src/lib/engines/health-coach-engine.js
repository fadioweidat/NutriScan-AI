import nutritionEngine from '../nutrition-engine.js';
import dailyScoreEngine from './daily-score-engine.js';
import trendEngine from './trend-engine.js';
import goalEngine from './goal-engine.js';

/**
 * Health Coach Engine (Phase 3)
 * Orchestrates health score, diet compliance, supplements, trends, goals, and medical alerts.
 */

// MAIN ORCHESTRATOR FUNCTION
export async function getHealthCoachContext(supabase, userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Parallel fetch of all independent health profile, logs, and entries
    const [
      profileRes,
      conditionsRes,
      allergiesRes,
      medicationsRes,
      supplementsRes,
      reportsRes,
      sleepLogsRes,
      stressLogsRes,
      hydrationLogsRes,
      activityLogsRes,
      mealEntriesRes
    ] = await Promise.all([
      supabase.from('health_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_conditions').select('*').eq('user_id', userId),
      supabase.from('user_allergies').select('*').eq('user_id', userId),
      supabase.from('user_medications').select('*').eq('user_id', userId).eq('is_active', true),
      supabase.from('user_supplements').select('*').eq('user_id', userId).eq('is_active', true),
      supabase.from('blood_test_reports').select('*').eq('user_id', userId).order('test_date', { ascending: false }),
      supabase.from('sleep_logs').select('*').eq('user_id', userId).gte('entry_date', thirtyDaysAgoStr),
      supabase.from('stress_logs').select('*').eq('user_id', userId).gte('entry_date', thirtyDaysAgoStr),
      supabase.from('hydration_logs').select('*').eq('user_id', userId).gte('entry_date', thirtyDaysAgoStr),
      supabase.from('activity_logs').select('*').eq('user_id', userId).gte('entry_date', thirtyDaysAgoStr),
      supabase.from('meal_entries').select(`
        id, quantity_grams, entry_date,
        foods (
          id, name, category,
          calories, proteins, carbs, fats, fiber, water, omega3, omega6,
          food_nutrients ( nutrient_key, nutrient_name, amount, unit )
        )
      `).eq('user_id', userId).gte('entry_date', thirtyDaysAgoStr)
    ]);

    const profile = profileRes.data;
    const conditions = conditionsRes.data;
    const allergies = allergiesRes.data;
    const medications = medicationsRes.data;
    const supplements = supplementsRes.data;
    const reports = reportsRes.data;
    const sleepLogs = sleepLogsRes.data;
    const stressLogs = stressLogsRes.data;
    const hydrationLogs = hydrationLogsRes.data;
    const activityLogs = activityLogsRes.data;
    const mealEntries = mealEntriesRes.data;

    let latestReportBiomarkers = [];
    if (reports && reports.length > 0) {
      const { data: biomarkers } = await supabase
        .from('blood_test_biomarkers')
        .select('*')
        .eq('report_id', reports[0].id);
      latestReportBiomarkers = biomarkers || [];
    }

    // Group meals by date to calculate historical totals
    const mealsByDate = {};
    (mealEntries || []).forEach(entry => {
      const date = entry.entry_date;
      if (!mealsByDate[date]) mealsByDate[date] = [];
      
      // Standardize format for nutrition engine
      const foodData = entry.foods;
      if (foodData) {
        mealsByDate[date].push({
          quantity_grams: entry.quantity_grams,
          ...foodData
        });
      }
    });

    const dietType = profile?.diet_type || 'standard';

    // 5. Calculate History logs for Trend Engine
    const historyLogs = [];
    const dateCursor = new Date(thirtyDaysAgo);
    const todayObj = new Date();

    while (dateCursor <= todayObj) {
      const dateStr = dateCursor.toISOString().split('T')[0];
      
      const dayMeals = mealsByDate[dateStr] || [];
      const dayTotals = dayMeals.length > 0 ? nutritionEngine.calculateDailyTotals(dayMeals) : null;
      
      const daySleep = (sleepLogs || []).find(l => l.entry_date === dateStr);
      const dayStress = (stressLogs || []).find(l => l.entry_date === dateStr);
      const dayHydration = (hydrationLogs || []).find(l => l.entry_date === dateStr);
      const dayActivities = (activityLogs || []).filter(l => l.entry_date === dateStr);

      const healthScore = dailyScoreEngine.calculateDailyHealthScore({
        totals: dayTotals,
        dietType,
        meals: dayMeals,
        sleepLog: daySleep,
        stressLog: dayStress,
        hydrationLog: dayHydration,
        activityLogs: dayActivities,
        conditions: conditions || []
      });

      historyLogs.push({
        date: dateStr,
        healthScore,
        sleepHours: daySleep ? Number(daySleep.duration_hours || 0) : 0,
        sleepQuality: daySleep ? Number(daySleep.quality_score || 0) : 0,
        stressLevel: dayStress ? Number(dayStress.stress_level || 5) : 5,
        waterMl: dayHydration ? Number(dayHydration.water_ml || 0) : 0,
        activeMinutes: dayActivities.reduce((sum, act) => sum + Number(act.duration_minutes || 0), 0)
      });

      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    // 6. Compile Today's specific context
    const todayMeals = mealsByDate[today] || [];
    const todayTotals = todayMeals.length > 0 ? nutritionEngine.calculateDailyTotals(todayMeals) : null;
    
    const todaySleep = (sleepLogs || []).find(l => l.entry_date === today);
    const todayStress = (stressLogs || []).find(l => l.entry_date === today);
    const todayHydration = (hydrationLogs || []).find(l => l.entry_date === today);
    const todayActivities = (activityLogs || []).filter(l => l.entry_date === today);

    // A. Daily Health Score
    const dailyScore = dailyScoreEngine.calculateDailyHealthScore({
      totals: todayTotals,
      dietType,
      meals: todayMeals,
      sleepLog: todaySleep,
      stressLog: todayStress,
      hydrationLog: todayHydration,
      activityLogs: todayActivities,
      conditions: conditions || []
    });

    // B. Diet Compliance
    const dietCompliance = dailyScoreEngine.calculateDietCompliance(todayTotals, dietType, todayMeals, conditions || []);

    // C. Risk Level
    const riskLevel = dailyScoreEngine.calculateRiskLevel(
      dailyScore, 
      conditions || [], 
      medications || [], 
      latestReportBiomarkers
    );

    // D. Goals tracking
    const goalsBreakdown = goalEngine.checkDailyGoals({
      totals: todayTotals,
      dietType,
      meals: todayMeals,
      sleepLog: todaySleep,
      stressLog: todayStress,
      hydrationLog: todayHydration,
      activityLogs: todayActivities,
      conditions: conditions || []
    });

    // E. Trends tracking
    const trends = trendEngine.compileAllTrends(historyLogs, 30);

    // F. Priorities Generation (Highest weight to abnormal Blood Tests & Patologie)
    const priorities = [];

    // F1. Blood Test Biomarker priorities (Priority 1-3 based on specific markers)
    latestReportBiomarkers.forEach(b => {
      const name = b.biomarker_name.toLowerCase();
      const val = Number(b.value);
      
      let weight = 70;
      let target = b.biomarker_name;
      let reason;

      if (b.status === 'low') {
        reason = `${b.biomarker_name} basso (${val} ${b.unit}) nei tuoi esami del sangue. Aumentare l'apporto dietetico o valutare controlli.`;
        if (name.includes('vitamina d') || name.includes('vitamin d')) {
          weight = 100;
          target = "Vitamina D insufficiente";
          reason = `Vitamina D insufficiente (${val} ${b.unit}) nei tuoi esami del sangue. Si consiglia una regolare esposizione solare o integrazione.`;
        } else if (name.includes('ferritina')) {
          weight = 95;
          target = "Ferritina bassa";
          reason = `Ferritina bassa (${val} ${b.unit}) nei tuoi esami del sangue. Monitorare l'apporto di ferro e abbinare fonti di Vitamina C.`;
        } else if (name.includes('ferro') || name === 'iron') {
          weight = 90;
          target = "Ferro basso";
          reason = `Ferro basso (${val} ${b.unit}) nei tuoi esami del sangue. Ottimizzare le fonti di ferro nella dieta (pesce, legumi, verdure a foglia verde).`;
        } else if (name.includes('b12')) {
          weight = 85;
          target = "B12 bassa";
          reason = `Vitamina B12 bassa (${val} ${b.unit}) nei tuoi esami del sangue. Valutare un'integrazione o alimenti fortificati se segui una dieta vegetale.`;
        }
        priorities.push({ target, reason, type: 'blood_test', weight });
      } else if (b.status === 'high') {
        reason = `${b.biomarker_name} alto (${val} ${b.unit}) nei tuoi esami del sangue. Evitare eccessi alimentari associati.`;
        if (name.includes('colesterolo') || name.includes('cholesterol')) {
          weight = 80;
          target = "Colesterolo alto";
          reason = `Colesterolo alto (${val} ${b.unit}) nei tuoi esami del sangue. Ridurre i grassi saturi e aumentare il consumo di fibre solubili (avena, legumi).`;
        } else if (name.includes('glicemia') || name.includes('glucose') || name.includes('glucosio')) {
          weight = 75;
          target = "Glicemia elevata";
          reason = `Glicemia elevata (${val} ${b.unit}) nei tuoi esami del sangue. Limitare carboidrati raffinati e zuccheri semplici per migliorare la sensibilità all'insulina.`;
        } else {
          weight = 65;
        }
        priorities.push({ target, reason, type: 'blood_test', weight });
      }
    });

    // F2. Patologie & conditions adjustments
    (conditions || []).forEach(c => {
      const name = c.condition_name.toLowerCase();
      if (name.includes('diabete')) {
        const sugar = todayTotals ? Number(todayTotals.sugar || todayTotals.sugar_g || 0) : 0;
        priorities.push({
          target: 'Controllo Glicemico (Diabete)',
          reason: sugar > 30 
            ? `Hai registrato ${sugar}g di zuccheri (limite raccomandato <= 30g per il diabete).`
            : "Diabete registrato: privilegiare cibi a basso indice glicemico e ricchi di fibre.",
          type: 'condition',
          weight: 60
        });
      }
      if (name.includes('ipertensione')) {
        const sodium = todayTotals ? Number(todayTotals.sodium || 0) : 0;
        priorities.push({
          target: 'Riduzione Sodio (Ipertensione)',
          reason: sodium > 2000
            ? `Hai superato il target di sodio (registrati ${sodium}mg su max 2000mg raccomandati per l'ipertensione).`
            : "Ipertensione registrata: preferire potassio ed evitare l'aggiunta di sale.",
          type: 'condition',
          weight: 60
        });
      }
      if (name.includes('anemia')) {
        priorities.push({
          target: 'Ferro & Vitamina C (Anemia)',
          reason: "Anemia registrata: incrementare il ferro eme ed associare vitamina C per massimizzare la biodisponibilità.",
          type: 'condition',
          weight: 55
        });
      }
      if (name.includes('osteoporosi')) {
        priorities.push({
          target: 'Calcio & Vitamina D (Osteoporosi)',
          reason: "Osteoporosi registrata: favorire l'assorbimento del calcio aumentando l'esposizione solare ed evitando inibitori (ossalati).",
          type: 'condition',
          weight: 55
        });
      }
      if (name.includes('insufficienza renale')) {
        const protein = todayTotals ? Number(todayTotals.proteins || 0) : 0;
        priorities.push({
          target: 'Ottimizzazione Proteica (Insufficienza Renale)',
          reason: protein > 90
            ? `Attenzione all'apporto proteico elevato (${protein}g). Si consiglia moderazione per non sovraccaricare la funzionalità renale.`
            : "Insufficienza renale registrata: mantenere un apporto proteico controllato ed educativo.",
          type: 'condition',
          weight: 60
        });
      }
      if (name.includes('celia')) {
        priorities.push({
          target: 'Dieta Senza Glutine (Celiachia)',
          reason: "Celiachia registrata: eliminare tassativamente fonti di glutine e prestare attenzione alle contaminazioni incrociate.",
          type: 'condition',
          weight: 60
        });
      }
    });

    // F3. Lifestyle priorities
    const water = todayHydration ? Number(todayHydration.water_ml || 0) : 0;
    if (water < 2000) {
      priorities.push({
        target: 'Idratazione',
        reason: `Hai assunto solo ${water}ml d'acqua oggi. Raggiungere l'obiettivo di 2000ml.`,
        type: 'lifestyle',
        weight: 40
      });
    }

    const sleepHours = todaySleep ? Number(todaySleep.duration_hours || 0) : 0;
    if (sleepHours < 7) {
      priorities.push({
        target: 'Qualità del Sonno',
        reason: `Hai dormito solo ${sleepHours} ore la notte scorsa. Cerca di raggiungere almeno 7 ore di riposo.`,
        type: 'lifestyle',
        weight: 35
      });
    }

    const stressVal = todayStress ? Number(todayStress.stress_level || 1) : 1;
    if (stressVal >= 6) {
      priorities.push({
        target: 'Gestione Stress',
        reason: `Stress elevato registrato (livello ${stressVal}/10). Considera alimenti ricchi di magnesio per supportare il sistema nervoso.`,
        type: 'lifestyle',
        weight: 30
      });
    }

    const activeMinutes = todayActivities.reduce((sum, act) => sum + Number(act.duration_minutes || 0), 0);
    if (activeMinutes < 30) {
      priorities.push({
        target: 'Attività Fisica',
        reason: `Oggi hai loggato solo ${activeMinutes} minuti di movimento. Obiettivo minimo: 30 minuti.`,
        type: 'lifestyle',
        weight: 25
      });
    }

    // Sort priorities by weight descending
    const sortedPriorities = priorities
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5) // limit to top 5 priorities
      .map((p, index) => `${index + 1}. [${p.target}] ${p.reason}`);

    if (sortedPriorities.length === 0) {
      sortedPriorities.push("1. Mantenere l'ottimo equilibrio nutrizionale e di stile di vita registrato oggi.");
    }

    // G. Supplement Intelligence
    const supplementIntelligence = {};
    const trackedNutrients = {
      vitamin_d: { name: 'Vitamina D', keyword: 'vitamina d' },
      iron: { name: 'Ferro', keyword: 'ferro' },
      vitamin_b12: { name: 'Vitamina B12', keyword: 'b12' },
      magnesium: { name: 'Magnesio', keyword: 'magnesio' },
      omega3: { name: 'Omega 3', keyword: 'omega 3' },
      calcium: { name: 'Calcio', keyword: 'calcio' },
      zinc: { name: 'Zinco', keyword: 'zinco' },
      copper: { name: 'Rame', keyword: 'rame' },
      potassium: { name: 'Potassio', keyword: 'potassio' }
    };

    Object.keys(trackedNutrients).forEach(key => {
      const targetNut = trackedNutrients[key];
      const hasSupplement = (supplements || []).some(s => 
        s.supplement_name.toLowerCase().includes(targetNut.keyword)
      );

      // Calculate fraction covered by diet
      let dietPct = 0;
      if (todayTotals) {
        const rda = nutritionEngine.getRDA(profile);
        const targetValue = rda[key] || 1;
        const actualValue = key === 'proteins' || key === 'carbs' || key === 'fats' || key === 'fiber' || key === 'water' || key === 'omega3' || key === 'omega6'
          ? (todayTotals[key] || 0)
          : (todayTotals.micronutrients?.[key] || 0);

        dietPct = Math.round((actualValue / targetValue) * 100);
      }

      supplementIntelligence[key] = {
        name: targetNut.name,
        dietPct,
        supplementActive: hasSupplement
      };
    });

    // H. Medical Alerts
    const alerts = [];
    const activeMeds = (medications || []).map(m => m.medication_name.toLowerCase());
    
    activeMeds.forEach(medName => {
      if (medName.includes('warfarin') || medName.includes('coumadin')) {
        alerts.push("⚠️ Possibile interazione. Non modificare la terapia senza consultare il medico. Alimenti ad altissimo contenuto di vitamina K (spinaci, biete) possono interferire con il dosaggio del Warfarin.");
      }
      if (medName.includes('levotiroxina') || medName.includes('eutirox')) {
        alerts.push("⚠️ Possibile interazione. Non modificare la terapia senza consultare il medico. Calcio e Ferro riducono l'assorbimento della levotiroxina. Assumere il farmaco lontano dai pasti.");
      }
      if (medName.includes('metformina')) {
        alerts.push("⚠️ Possibile interazione. Non modificare la terapia senza consultare il medico. L'uso cronico di metformina riduce l'assorbimento di Vitamina B12.");
      }
    });

    // I. Educational Suggestions
    const educationalSuggestions = [];
    if (supplementIntelligence.vitamin_d?.dietPct < 50 && !supplementIntelligence.vitamin_d?.supplementActive) {
      educationalSuggestions.push("La Vitamina D stimola la sintesi dei trasportatori intestinali di calcio. Dal momento che l'apporto dietetico è basso, si consiglia una regolare esposizione solare.");
    }
    if (supplementIntelligence.iron?.dietPct < 60 && !supplementIntelligence.iron?.supplementActive) {
      educationalSuggestions.push("Se riscontri stanchezza prolungata o ferro basso, considera l'abbinamento di Ferro non-eme (vegetale) + Vitamina C (limone, kiwi) per triplicarne l'assorbimento.");
    }
    if (todayStress && Number(todayStress.stress_level) >= 6) {
      educationalSuggestions.push("Alti livelli di stress aumentano l'escrezione renale di Magnesio. Consumare semi di zucca, mandorle o cioccolato fondente aiuta a compensare questa perdita.");
    }

    return {
      healthScore: dailyScore,
      riskLevel,
      dietCompliance,
      priorities: sortedPriorities,
      trends,
      goals: goalsBreakdown,
      supplementIntelligence,
      alerts,
      educationalSuggestions,
      lifestyle: {
        sleepHours,
        sleepQuality: todaySleep ? todaySleep.quality_score : null,
        stressLevel: todayStress ? todayStress.stress_level : null,
        waterMl: water,
        activeMinutes
      },
      bloodTests: {
        testDate: reports && reports.length > 0 ? reports[0].test_date : null,
        biomarkers: latestReportBiomarkers.map(b => ({ name: b.biomarker_name, value: b.value, unit: b.unit, status: b.status }))
      },
      patologie: (conditions || []).map(c => c.condition_name),
      allergie: (allergies || []).map(a => a.allergy_name),
      medications: (medications || []).map(m => m.medication_name),
      supplements: (supplements || []).map(s => s.supplement_name)
    };

  } catch (err) {
    console.error("Error in health-coach-engine:", err);
    throw err;
  }
}

export default {
  getHealthCoachContext
};
